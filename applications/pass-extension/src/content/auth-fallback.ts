import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

export const handleForkFallback = () =>
    window.addEventListener('message', async (message) => {
        try {
            if (message.data && message.data.type === 'fork') {
                const { keyPassword, selector, state, persistent, trusted } = message.data.payload;
                await sendMessage.onSuccess(
                    contentScriptMessage({
                        type: WorkerMessageType.FORK,
                        payload: {
                            selector,
                            state,
                            keyPassword,
                            persistent,
                            trusted,
                        },
                    }),
                    () => window.postMessage({ fork: 'success' })
                );
            }
        } catch (e) {
            logger.warn('[ContentScript::Fork]', e);
        }
    });
