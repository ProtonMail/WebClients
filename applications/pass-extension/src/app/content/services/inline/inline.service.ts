import { clientLocked, clientNeedsSession } from '@proton/pass/lib/client';
import { POPOVER_SUPPORTED } from '@proton/pass/utils/dom/popover';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import noop from '@proton/utils/noop';

import { WorkerMessageType } from '../../../../types/messages';
import { NotificationAction } from '../../constants.runtime';
import { withContext } from '../../context/context';
import type { ContentScriptContextFactoryOptions } from '../../context/factory';
import type { FrameMessageHandler } from '../client/client.channel';
import { DROPDOWN_AUTOFOCUS_TIMEOUT } from './dropdown/dropdown.focus';
import { createDropdownHandler } from './dropdown/dropdown.handler';
import { createIconRegistry } from './icon/icon.registry';
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

    const onDropdownToggle: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_TOGGLE> = ({ payload }) => {
        const { autofilled, autofocused, field } = payload;
        const { frameId, fieldId, formId } = field;
        const { coords, action, origin, telemetry } = payload;

        const root = registry.root;
        const rootRect = POPOVER_SUPPORTED ? { top: 0, left: 0 } : root.customElement.getBoundingClientRect();

        const top = rootRect.top + coords.top;
        const left = rootRect.left + coords.left;

        return dropdown.toggle({
            type: 'frame',
            action,
            autofilled,
            autofocused,
            coords: { top, left },
            fieldId,
            formId,
            frameId,
            origin,
            telemetry,
        });
    };

    const onDropdownClose: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_CLOSE> = ({ payload }) => {
        return dropdown.close(
            payload.field
                ? {
                      type: 'frame',
                      formId: payload.field.formId,
                      fieldId: payload.field.fieldId,
                      frameId: payload.field.frameId,
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

    const onNotificationOpen: FrameMessageHandler<WorkerMessageType.INLINE_NOTIFICATION_OPEN> = ({ payload }) => {
        notification.open(payload);
    };

    /** Keyboard-shortcut focus hand-off. The worker sends this to the top-frame once a
     * frame — possibly a sub-frame — has claimed an `AUTOFILL_TRIGGER`. The dropdown may
     * still be attaching at that point, since the trigger replies synchronously so the
     * frame walk isn't stalled : poll until it is visible before bypassing focus traps.
     * `trapField: false` — this flow never focused the anchor field, so arming its
     * action-trap would swallow the field's next genuine autofocus dropdown. */
    const onDropdownFocus: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_FOCUS> = () => {
        void waitUntil(() => Boolean(registry.dropdown?.getState().visible), 25, DROPDOWN_AUTOFOCUS_TIMEOUT)
            .then(() => registry.dropdown?.requestFocus(false))
            .catch(noop);
    };

    return {
        init: () => {
            registry.init();

            channel.register(WorkerMessageType.INLINE_DROPDOWN_TOGGLE, onDropdownToggle);
            channel.register(WorkerMessageType.INLINE_DROPDOWN_CLOSE, onDropdownClose);
            channel.register(WorkerMessageType.INLINE_DROPDOWN_STATE, onDropdownState);
            channel.register(WorkerMessageType.INLINE_DROPDOWN_ATTACH, onDropdownAttach);
            channel.register(WorkerMessageType.INLINE_NOTIFICATION_OPEN, onNotificationOpen);
            channel.register(WorkerMessageType.INLINE_DROPDOWN_FOCUS, onDropdownFocus);
        },

        setTheme: registry.setTheme,

        destroy: () => {
            registry.destroy();
            dropdown.destroy();
            icon.destroy();

            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_TOGGLE, onDropdownToggle);
            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_CLOSE, onDropdownClose);
            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_STATE, onDropdownState);
            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_ATTACH, onDropdownAttach);
            channel.unregister(WorkerMessageType.INLINE_NOTIFICATION_OPEN, onNotificationOpen);
            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_FOCUS, onDropdownFocus);
        },

        sync: withContext((ctx) => {
            if (!ctx) return;

            const { status } = ctx.getState();
            const locked = clientLocked(status);
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
