import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { ContentScriptContextFactoryOptions } from 'proton-pass-extension/app/content/context/factory';
import type { FrameMessageHandler } from 'proton-pass-extension/app/content/services/client/client.channel';
import type { InlineFieldTarget } from 'proton-pass-extension/app/content/services/inline/dropdown/dropdown.abstract';
import {
    onBackdropClick,
    onCloseEffects,
    onFocusChangeFactory,
} from 'proton-pass-extension/app/content/services/inline/dropdown/dropdown.utils';
import { createIconRegistry } from 'proton-pass-extension/app/content/services/inline/icon/icon.registry';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { cons } from '@proton/pass/utils/fp/lens';
import noop from '@proton/utils/noop';

import { createDropdownRelayHandler } from './dropdown/dropdown.relay';
import type { AbstractInlineService } from './inline.abstract';
import { createPassiveInlineListeners } from './inline.listeners';
import { createNotificationRelayHandler } from './notification/notification.relay';

export const createInlineRelay = ({
    controller,
    elements,
    mainFrame,
}: ContentScriptContextFactoryOptions): AbstractInlineService => {
    /** NOTE: This should only be spawned in sub-frames */
    if (mainFrame) throw new Error('InlineRelay should only be created in sub-frames');

    const { channel } = controller;

    const passiveListeners = createPassiveInlineListeners(channel);
    const dropdown = createDropdownRelayHandler();
    const notification = createNotificationRelayHandler();
    const icon = createIconRegistry({ channel, dropdown, tag: elements.control, mainFrame });

    const onDropdownOpened: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_OPENED> = withContext(
        (ctx, { payload }) => {
            /** Only handle dropdown opens for this frame (payload.passive = false).
             * Parent frames handle passive opens via `inline.listeners.ts` */
            if (!(payload.type === 'relay' && !payload.passive)) return;

            const { fieldId, formId } = payload;
            const form = ctx?.service.formManager.getFormById(formId);
            const field = form?.getFieldById(fieldId);

            if (!(form && field)) return;

            const target: InlineFieldTarget = { type: 'field', field };
            const close = () => dropdown.close(target);
            const onFocusChange = onFocusChangeFactory(dropdown, target);

            /** Sub-frame scroll handling: close dropdown immediately instead of
             * expensive cross-frame repositioning. Top-frame UI elements cannot
             * be efficiently repositioned via messaging. */
            const scrollParent = form.scrollParent;
            const scrollOptions = { capture: true, once: true, passive: true } as const;

            dropdown.listeners.addListener(window, 'scroll', close, scrollOptions);
            dropdown.listeners.addListener(window, 'blur', onFocusChange);
            dropdown.listeners.addListener(window, 'focus', onFocusChange);
            dropdown.listeners.addListener(scrollParent, 'scroll', close, scrollOptions);
            dropdown.listeners.addListener(window, 'mousedown', onBackdropClick(cons(field), close));
        }
    );

    const onDropdownClosed: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_CLOSED> = withContext(
        (ctx, { payload }) => {
            if (!(payload.type === 'relay' && !payload.passive)) return;

            dropdown.listeners.removeAll();

            const { fieldId, formId } = payload;
            const form = ctx?.service.formManager.getFormById(formId);
            const field = form?.getFieldById(fieldId);

            if (field) onCloseEffects(field, payload);
        }
    );

    return {
        init: () => {
            channel.register(WorkerMessageType.INLINE_DROPDOWN_OPENED, onDropdownOpened);
            channel.register(WorkerMessageType.INLINE_DROPDOWN_CLOSED, onDropdownClosed);
            passiveListeners.init();
        },
        destroy: () => {
            dropdown.destroy();
            notification.destroy();
            icon.destroy();

            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_OPENED, onDropdownOpened);
            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_CLOSED, onDropdownClosed);
            passiveListeners.destroy();
        },

        setTheme: noop,
        sync: noop,

        icon,
        dropdown,
        notification,
    };
};
