import { NotificationAction } from 'proton-pass-extension/app/content/constants.runtime';
import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { ContentScriptContextFactoryOptions } from 'proton-pass-extension/app/content/context/factory';
import type { FrameMessageHandler } from 'proton-pass-extension/app/content/services/client/client.channel';
import { createIconRegistry } from 'proton-pass-extension/app/content/services/inline/icon/icon.registry';
import { getFrameElement } from 'proton-pass-extension/app/content/utils/frame';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { clientNeedsSession, clientSessionLocked } from '@proton/pass/lib/client';
import noop from '@proton/utils/noop';

import { createDropdownHandler } from './dropdown/dropdown.handler';
import type { AbstractInlineService } from './inline.abstract';
import { createInlineRegistry } from './inline.registry';
import { createNotificationHandler } from './notification/notification.handler';

export const createInlineService = ({
    elements,
    controller,
    mainFrame,
}: ContentScriptContextFactoryOptions): AbstractInlineService => {
    /** NOTE: This should only be spawned in the top-frame */
    if (!mainFrame) throw new Error('InlineService should only be created in top-frame');

    const { channel } = controller;
    const registry = createInlineRegistry(elements);
    const dropdown = createDropdownHandler(registry);
    const notification = createNotificationHandler(registry);
    const icon = createIconRegistry({ channel, dropdown, tag: elements.control, mainFrame });

    const onDropdownOpen: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_OPEN> = ({ payload }) => {
        if (payload.type !== 'relay') return;

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

    /** Handles dropdown state requests from sub-frames for icon/dropdown management. */
    const onDropdownState: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_STATE> = (_, sendResponse) => {
        Promise.resolve(dropdown.getState()).then(sendResponse).catch(noop);
        return true;
    };

    /** Handles dropdown attachment requests from sub-frames after form detection.
     * Pre-creates dropdown elements before actual open requests. */
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
