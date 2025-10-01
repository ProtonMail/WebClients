import type {
    FrameMessageBroker,
    FrameMessageHandler,
} from 'proton-pass-extension/app/content/utils/frame.message-broker';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { createListenerStore } from '@proton/pass/utils/listener/factory';
import noop from '@proton/utils/noop';

/**
 * Cross-frame event handling for dropdown auto-close UX edge-cases :
 *
 * <frame0>
 *   <frame1/>
 *   <frame2> <-- scrollable frame2
 *      <frame3/> <-- field triggers dropdown
 *   </frame2>
 * </frame0>
 *
 * When frame2 scrolls, we need to close the dropdown, but frame3
 * can't catch parent frame events. Solution: set up listeners in
 * all parent frames when dropdown opens in any child frame.
 */
export const createInlineFrameListeners = (channel: FrameMessageBroker) => {
    const listeners = createListenerStore();

    const onInlineDropdownOpened: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_OPENED> = ({
        payload: field,
    }) => {
        const close = () => {
            listeners.removeAll();
            sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.INLINE_DROPDOWN_CLOSE,
                    payload: { field },
                })
            ).catch(noop);
        };

        listeners.addListener(document, 'scroll', close, { passive: true, once: true, capture: true });
        listeners.addListener(window, 'focus', close, { passive: true, once: true, capture: true });
    };

    const onInlineDropdownClosed: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_CLOSED> = () => {
        listeners.removeAll();
    };

    return {
        init: () => {
            channel.register(WorkerMessageType.INLINE_DROPDOWN_OPENED, onInlineDropdownOpened);
            channel.register(WorkerMessageType.INLINE_DROPDOWN_CLOSED, onInlineDropdownClosed);
        },

        destroy: () => {
            listeners.removeAll();
            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_OPENED, onInlineDropdownOpened);
            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_CLOSED, onInlineDropdownClosed);
        },
    };
};
