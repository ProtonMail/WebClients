import { NotificationAction } from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { ContentScriptContextFactoryOptions } from 'proton-pass-extension/app/content/context/factory';
import { createIconRegistry } from 'proton-pass-extension/app/content/services/inline/icon/icon.registry';
import { getFrameElement } from 'proton-pass-extension/app/content/utils/frame';
import type { FrameMessageHandler } from 'proton-pass-extension/app/content/utils/frame.message-broker';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { clientNeedsSession, clientSessionLocked } from '@proton/pass/lib/client';
import { isMainFrame } from '@proton/pass/utils/dom/is-main-frame';
import noop from '@proton/utils/noop';

import { createDropdownHandler } from './dropdown/dropdown.handler';
import type { AbstractInlineService } from './inline.abstract';
import { createInlineRegistry } from './inline.registry';
import { createNotificationHandler } from './notification/notification.handler';

export const createInlineService = ({
    elements,
    controller,
}: ContentScriptContextFactoryOptions): AbstractInlineService => {
    /** NOTE: This should only be spawned in the top-frame */
    if (!isMainFrame()) throw new Error('InlineService should only be created in top-frame');

    const { channel } = controller;
    const registry = createInlineRegistry(elements);
    const dropdown = createDropdownHandler(registry);
    const notification = createNotificationHandler(registry);
    const icon = createIconRegistry(dropdown, elements.control);

    const onDropdownOpen: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_OPEN> = ({ payload }) => {
        if (payload.type === 'request') return;

        const { autofocused, coords, frameId, action, frameAttributes, fieldFrameId, field, origin } = payload;
        const root = registry.root;
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

    const onDropdownClose: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_CLOSE> = ({ payload }) => {
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

    /** Triggered when a sub-frame needs access to the top-level dropdown state */
    const onDropdownState: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_STATE> = (
        _,
        _sender,
        sendResponse
    ) => {
        Promise.resolve(dropdown.getState()).then(sendResponse).catch(noop);
        return true;
    };

    /** Triggered when a sub-frame optimistically tries to attach
     * a dropdown app in the top-frame because of a form detection */
    const onDropdownAttach: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_ATTACH> = () => {
        registry.attachDropdown();
    };

    return {
        init: () => {
            registry.init();

            channel.register(WorkerMessageType.INLINE_DROPDOWN_OPEN, onDropdownOpen);
            channel.register(WorkerMessageType.INLINE_DROPDOWN_CLOSE, onDropdownClose);
            channel.register(WorkerMessageType.INLINE_DROPDOWN_STATE, onDropdownState);
            channel.register(WorkerMessageType.INLINE_DROPDOWN_ATTACH, onDropdownAttach);
        },

        setTheme: registry.setTheme,

        destroy: () => {
            registry.destroy();
            dropdown.destroy();
            icon.destroy();

            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_OPEN, onDropdownOpen);
            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_CLOSE, onDropdownClose);
            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_STATE, onDropdownState);
            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_ATTACH, onDropdownAttach);
        },

        sync: withContext((ctx) => {
            if (!ctx) return;

            const { status } = ctx.getState();
            const locked = clientSessionLocked(status);
            const loggedOut = clientNeedsSession(status);

            if (loggedOut || locked) {
                const action = registry.notification?.getState().action;
                const unlockable = [NotificationAction.PASSKEY_CREATE, NotificationAction.PASSKEY_GET];
                const shouldDestroy = !locked || (action && !unlockable.includes(action));
                if (shouldDestroy) registry.notification?.destroy();
            }
        }),

        icon,
        dropdown,
        notification,
    };
};
