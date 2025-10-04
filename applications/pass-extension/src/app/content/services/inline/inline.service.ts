import { NotificationAction } from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { ContentScriptContextFactoryOptions } from 'proton-pass-extension/app/content/context/factory';
import type { DropdownAnchor, DropdownRequest } from 'proton-pass-extension/app/content/services/iframes/dropdown';
import type { IFrameMessage } from 'proton-pass-extension/app/content/services/iframes/messages';
import { createIFrameService } from 'proton-pass-extension/app/content/services/iframes/service';
import type { AbstractInlineService } from 'proton-pass-extension/app/content/services/inline/inline.abstract';
import { getFrameElement } from 'proton-pass-extension/app/content/utils/frame';
import type { FrameMessageHandler } from 'proton-pass-extension/app/content/utils/frame.message-broker';
import { isActiveElement } from 'proton-pass-extension/app/content/utils/nodes';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { clientNeedsSession, clientSessionLocked } from '@proton/pass/lib/client';
import { isMainFrame } from '@proton/pass/utils/dom/is-main-frame';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import noop from '@proton/utils/noop';

export const createInlineService = ({
    elements,
    controller,
}: ContentScriptContextFactoryOptions): AbstractInlineService => {
    /** NOTE: This should only be spawned in the top-frame */
    if (!isMainFrame()) throw new Error('InlineService should only be created in top-frame');

    const { channel } = controller;
    const iframes = createIFrameService(elements);
    const activeListeners = createListenerStore();

    const willDropdownAnchorChange = (anchor: DropdownAnchor, payload: DropdownRequest): boolean => {
        if (!anchor) return true;

        switch (payload.type) {
            case 'field':
                return anchor.type !== 'field' || anchor.field.element !== payload.field.element;

            case 'frame':
                return (
                    anchor.type !== 'frame' ||
                    anchor.fieldFrameId !== payload.fieldFrameId ||
                    anchor.fieldId !== payload.fieldId
                );
        }
    };

    const dropdown: AbstractInlineService['dropdown'] = {
        attach: (layer) => iframes.attachDropdown(layer),
        open: (payload) => {
            const attachedAnchor = iframes.dropdown?.anchor;
            const visible = iframes.dropdown?.getState().visible;
            const { autofocused } = payload;

            const didAnchorChange = !attachedAnchor || willDropdownAnchorChange(attachedAnchor, payload);
            const autoclose = visible && (didAnchorChange || !autofocused);

            if (autoclose) dropdown.close();

            if (didAnchorChange) {
                const layer = payload.type === 'field' ? payload.field.getFormHandle().element : undefined;
                iframes.attachDropdown(layer)?.open(payload);

                const close = () => dropdown.close(payload);

                activeListeners.addListener(window, 'resize', close, { once: true, passive: true });
                activeListeners.addListener(document, 'scroll', close, { once: true, passive: true, capture: true });
            }
        },

        close: (target) => {
            activeListeners.removeAll();
            const dropdown = iframes.dropdown;
            const anchor = dropdown?.anchor;
            const activeAnchor = (() => {
                switch (target?.type) {
                    case 'field':
                        return anchor?.type === target.type && anchor.field.element === target.field.element;
                    case 'frame':
                        return (
                            anchor?.type === target.type &&
                            anchor.fieldId === target.fieldId &&
                            anchor.formId === target.formId
                        );
                }
            })();

            /* If a field is passed as a parameter, only close the
             * dropdown if it is currently attached to this element. */
            if (target && !activeAnchor) return;
            iframes.dropdown?.close();
        },

        destroy: () => iframes.dropdown?.destroy(),

        sendMessage: (message: IFrameMessage) => iframes.dropdown?.sendMessage(message),

        getState: async () => {
            const dropdown = iframes.dropdown;
            const visible = dropdown?.getState().visible ?? false;
            const anchor = dropdown?.anchor;

            return {
                visible,
                attachedField: anchor
                    ? (() => {
                          switch (anchor.type) {
                              case 'field': {
                                  const { fieldId } = anchor.field;
                                  const { formId } = anchor.field.getFormHandle();
                                  return { fieldId, formId };
                              }
                              case 'frame': {
                                  const { fieldId, formId } = anchor;
                                  return { fieldId, formId };
                              }
                          }
                      })()
                    : undefined,
            };
        },
    };

    const notification: AbstractInlineService['notification'] = {
        attach: () => iframes.attachNotification(),
        open: (request) => iframes.attachNotification()?.open(request),
        close: (action) => {
            /* If an action is passed as a parameter, only close the
             * notification if it is currently attached to this action. */
            if (action && iframes.notification?.getState().action !== action) return;
            iframes.notification?.close();
        },
        destroy: () => iframes.notification?.destroy(),
    };

    const sync = withContext((ctx) => {
        if (!ctx) return;

        const { status } = ctx.getState();
        const locked = clientSessionLocked(status);
        const loggedOut = clientNeedsSession(status);

        if (loggedOut || locked) {
            const action = iframes.notification?.getState().action;
            const unlockable = [NotificationAction.PASSKEY_CREATE, NotificationAction.PASSKEY_GET];
            const shouldDestroy = !locked || (action && !unlockable.includes(action));
            if (shouldDestroy) iframes.notification?.destroy();
        }
    });

    const onInlineDropdownOpen: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_OPEN> = ({ payload }) => {
        if (payload.type === 'request') return;

        const { autofocused, coords, frameId, action, frameAttributes, fieldFrameId, field, origin } = payload;
        const root = iframes.root;
        const rootRect = root.customElement.getBoundingClientRect();

        const top = rootRect.top + coords.top;
        const left = rootRect.left + coords.left;

        const frame = getFrameElement(frameId, frameAttributes);

        if (!frame) return;

        return dropdown.open({
            type: 'frame',
            action,
            autofocused,
            coords: { top, left },
            fieldFrameId,
            fieldId: field.fieldId,
            formId: field.formId,
            frame,
            frameId,
            origin,
        });
    };

    const onInlineDropdownClose: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_CLOSE> = ({ payload }) => {
        return dropdown.close(
            payload.field
                ? {
                      type: 'frame',
                      formId: payload.field.formId,
                      fieldId: payload.field.fieldId,
                  }
                : undefined
        );
    };

    const onInlineDropdownState: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_STATE> = (
        _message,
        _sender,
        sendResponse
    ) => {
        Promise.resolve(dropdown.getState()).then(sendResponse).catch(noop);
        return true;
    };

    const onInlineDropdownAttach: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_ATTACH> = () => {
        iframes.attachDropdown();
    };

    /** When sub-frame loses focus but top-level UI gains focus, don't close dropdown
     * as this indicates legitimate user interaction with our UI elements */
    const onInlineFrameBlur: FrameMessageHandler<WorkerMessageType.INLINE_FRAME_BLUR> = ({ payload }) => {
        if (iframes.dropdown?.getState().visible && !isActiveElement(iframes.root.customElement)) {
            const { formId, fieldId } = payload;
            dropdown.close({ type: 'frame', formId, fieldId });
        }
    };

    return {
        init: () => {
            iframes.init();
            channel.register(WorkerMessageType.INLINE_DROPDOWN_OPEN, onInlineDropdownOpen);
            channel.register(WorkerMessageType.INLINE_DROPDOWN_CLOSE, onInlineDropdownClose);
            channel.register(WorkerMessageType.INLINE_DROPDOWN_STATE, onInlineDropdownState);
            channel.register(WorkerMessageType.INLINE_DROPDOWN_ATTACH, onInlineDropdownAttach);
            channel.register(WorkerMessageType.INLINE_FRAME_BLUR, onInlineFrameBlur);
        },

        setTheme: iframes.setTheme,

        destroy: () => {
            iframes.destroy();
            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_OPEN, onInlineDropdownOpen);
            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_CLOSE, onInlineDropdownClose);
            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_STATE, onInlineDropdownState);
            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_ATTACH, onInlineDropdownAttach);
            channel.unregister(WorkerMessageType.INLINE_FRAME_BLUR, onInlineFrameBlur);
        },

        sync,

        dropdown,
        notification,
    };
};
