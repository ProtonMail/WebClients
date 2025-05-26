import { NotificationAction } from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { ContentScriptContextFactoryOptions } from 'proton-pass-extension/app/content/context/factory';
import type { IFrameMessage } from 'proton-pass-extension/app/content/services/iframes/messages';
import { createIFrameService } from 'proton-pass-extension/app/content/services/iframes/service';
import type { AbstractInlineService } from 'proton-pass-extension/app/content/services/inline/inline.abstract';
import { getFrameElement } from 'proton-pass-extension/app/content/utils/frame';
import type { FrameMessageHandler } from 'proton-pass-extension/app/content/utils/frame.message-broker';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { clientNeedsSession, clientSessionLocked } from '@proton/pass/lib/client';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import noop from '@proton/utils/noop';

/** NOTE: This should only be spawned in the top-layer */
export const createInlineService = ({
    elements,
    controller,
}: ContentScriptContextFactoryOptions): AbstractInlineService => {
    const { transport } = controller;
    const iframes = createIFrameService(elements);
    const activeListeners = createListenerStore();

    const dropdown: AbstractInlineService['dropdown'] = {
        attach: (layer) => iframes.attachDropdown(layer),
        open: (payload) => {
            const attachedAnchor = iframes.dropdown?.getCurrentAnchor();
            const visible = iframes.dropdown?.getState().visible;

            if (visible) dropdown.close();

            switch (payload.type) {
                case 'field': {
                    const { field } = payload;
                    const layer = field.getFormHandle().element;
                    const fieldChanged =
                        !attachedAnchor ||
                        attachedAnchor.type !== 'field' ||
                        attachedAnchor.field.element !== field.element;

                    if (fieldChanged) iframes.attachDropdown(layer)?.open(payload);
                    break;
                }

                case 'frame': {
                    const { fieldFrameId, fieldId, formId } = payload;
                    const fieldChanged =
                        attachedAnchor?.type !== 'frame' ||
                        attachedAnchor.fieldFrameId !== fieldFrameId ||
                        attachedAnchor.fieldId !== fieldId;

                    if (fieldChanged) {
                        iframes.attachDropdown()?.open(payload);
                        const handleClose = () => dropdown.close({ type: 'frame', fieldId, formId });
                        /** NOTE: attaching the dropdown to a subframe field is too heavy
                         * for repositioning on resize/scroll. Prefer auto-closing */
                        activeListeners.addListener(window, 'resize', handleClose);
                        activeListeners.addListener(document, 'scroll', handleClose, { capture: true });
                    }
                    break;
                }
            }
        },

        close: (target) => {
            activeListeners.removeAll();
            const dropdown = iframes.dropdown;
            const anchor = dropdown?.getCurrentAnchor();
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
            const anchor = dropdown?.getCurrentAnchor();

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
        _,
        sendResponse
    ) => {
        Promise.resolve(dropdown.getState()).then(sendResponse).catch(noop);
        return true;
    };

    const onInlineDropdownAttach: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_ATTACH> = () => {
        iframes.attachDropdown();
    };

    return {
        init: () => {
            iframes.init();
            transport.register(WorkerMessageType.INLINE_DROPDOWN_OPEN, onInlineDropdownOpen);
            transport.register(WorkerMessageType.INLINE_DROPDOWN_CLOSE, onInlineDropdownClose);
            transport.register(WorkerMessageType.INLINE_DROPDOWN_STATE, onInlineDropdownState);
            transport.register(WorkerMessageType.INLINE_DROPDOWN_ATTACH, onInlineDropdownAttach);
        },

        setTheme: iframes.setTheme,

        destroy: () => {
            iframes.destroy();
            transport.unregister(WorkerMessageType.INLINE_DROPDOWN_OPEN, onInlineDropdownOpen);
            transport.unregister(WorkerMessageType.INLINE_DROPDOWN_CLOSE, onInlineDropdownClose);
            transport.unregister(WorkerMessageType.INLINE_DROPDOWN_STATE, onInlineDropdownState);
            transport.unregister(WorkerMessageType.INLINE_DROPDOWN_ATTACH, onInlineDropdownAttach);
        },

        sync,

        dropdown,
        notification,
    };
};
