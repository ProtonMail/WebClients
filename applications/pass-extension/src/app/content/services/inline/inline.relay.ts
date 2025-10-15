import { withContext } from 'proton-pass-extension/app/content/context/context';
import type { ContentScriptContextFactoryOptions } from 'proton-pass-extension/app/content/context/factory';
import { onFieldDropdownClose } from 'proton-pass-extension/app/content/services/inline/dropdown/dropdown.utils';
import type { FrameMessageHandler } from 'proton-pass-extension/app/content/utils/frame.message-broker';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { isShadowRoot } from '@proton/pass/fathom';
import type { MaybeNull } from '@proton/pass/types';
import { isMainFrame } from '@proton/pass/utils/dom/is-main-frame';
import { truthy } from '@proton/pass/utils/fp/predicates';
import noop from '@proton/utils/noop';

import { createDropdownRelayHandler } from './dropdown/dropdown.relay';
import type { AbstractInlineService } from './inline.abstract';
import { createPassiveInlineListeners } from './inline.listeners';
import { createNotificationRelayHandler } from './notification/notification.relay';

export const createInlineRelay = ({ controller }: ContentScriptContextFactoryOptions): AbstractInlineService => {
    /** NOTE: This should only be spawned in sub-frames */
    if (isMainFrame()) throw new Error('InlineRelay should only be created in sub-frames');

    const { channel } = controller;

    const passiveListeners = createPassiveInlineListeners(channel);
    const dropdown = createDropdownRelayHandler();
    const notification = createNotificationRelayHandler();

    const onDropdownOpened: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_OPENED> = withContext(
        (ctx, { payload }) => {
            if (!(payload.type === 'result' && !payload.passive)) return;

            const { fieldId, formId } = payload;
            const form = ctx?.service.formManager.getFormById(formId);
            const field = form?.getFieldById(fieldId);

            if (!(form && field)) return;

            const close = () => dropdown.close({ type: 'field', field });

            /** Intercept scroll events in sub-frames. It is too costly to try to reposition
             * any injected UI elements in the top-frame via messaging. */
            const scrollParent = form.scrollParent;
            const scrollOptions = { capture: true, once: true, passive: true } as const;

            dropdown.listeners.addListener(window, 'scroll', close, scrollOptions);
            dropdown.listeners.addListener(scrollParent, 'scroll', close, scrollOptions);

            /** Intercept backdrop clicks in sub-frames. The backdrop click
             * handler in the top-frame will not catch clicks in sub-frames.
             * FIXME: this should be factorized */
            dropdown.listeners.addListener(window, 'mousedown', (event: Event) => {
                const target = event.target as MaybeNull<HTMLElement>;
                const rootNode = field.element.getRootNode();

                const host = isShadowRoot(rootNode) ? rootNode.host : null;
                const excludes = [field.icon?.element, field.element, host].filter(truthy);

                if (!target || !excludes.includes(target)) close();
            });
        }
    );

    const onDropdownClosed: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_CLOSED> = withContext(
        (ctx, { payload }) => {
            if (!(payload.type === 'result' && !payload.passive)) return;

            dropdown.listeners.removeAll();

            const { fieldId, formId } = payload;
            const form = ctx?.service.formManager.getFormById(formId);
            const field = form?.getFieldById(fieldId);

            if (field) onFieldDropdownClose(field, payload.refocus);
        }
    );

    return {
        init: () => {
            channel.register(WorkerMessageType.INLINE_DROPDOWN_OPENED, onDropdownOpened);
            channel.register(WorkerMessageType.INLINE_DROPDOWN_CLOSED, onDropdownClosed);
            passiveListeners.init();
        },
        destroy: () => {
            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_OPENED, onDropdownOpened);
            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_CLOSED, onDropdownClosed);
            dropdown.destroy();
            passiveListeners.destroy();
        },

        setTheme: noop,
        sync: noop,

        dropdown,
        notification,
    };
};
