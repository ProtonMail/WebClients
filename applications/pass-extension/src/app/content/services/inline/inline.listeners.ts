import type {
    FrameMessageBroker,
    FrameMessageHandler,
} from 'proton-pass-extension/app/content/services/client/client.channel';
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
export const createPassiveInlineListeners = (channel: FrameMessageBroker) => {
    const listeners = createListenerStore();

    /** Handles dropdown opens from child frames where payload.passive = true.
     * Intermediate frames in the frame chain register listeners to intercept auto-closing
     * events that the dropdown frame cannot detect (parent frame scroll/focus changes). */
    const onDropdownOpened: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_OPENED> = ({ payload }) => {
        if (payload.type === 'relay' && payload.passive) {
            const { frameId, fieldId, formId } = payload;

            const close = () => {
                listeners.removeAll();
                sendMessage(
                    contentScriptMessage({
                        type: WorkerMessageType.INLINE_DROPDOWN_CLOSE,
                        payload: { field: { frameId, fieldId, formId } },
                    })
                ).catch(noop);
            };

            listeners.addListener(window, 'scroll', close, { passive: true, once: true, capture: true });
            listeners.addListener(window, 'focus', close, { once: true });
        }
    };

    const onInlineDropdownClosed: FrameMessageHandler<WorkerMessageType.INLINE_DROPDOWN_CLOSED> = () => {
        listeners.removeAll();
    };

    return {
        init: () => {
            channel.register(WorkerMessageType.INLINE_DROPDOWN_OPENED, onDropdownOpened);
            channel.register(WorkerMessageType.INLINE_DROPDOWN_CLOSED, onInlineDropdownClosed);
        },

        destroy: () => {
            listeners.removeAll();
            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_OPENED, onDropdownOpened);
            channel.unregister(WorkerMessageType.INLINE_DROPDOWN_CLOSED, onInlineDropdownClosed);
        },
    };
};
