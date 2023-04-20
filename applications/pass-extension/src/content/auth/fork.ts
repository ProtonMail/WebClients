import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { WorkerMessageType } from '@proton/pass/types';
import { isMainFrame } from '@proton/pass/utils/dom';
import { logger } from '@proton/pass/utils/logger';

/**
 * externally_connectable is not supported in Firefox MV3 :
 * in order to communicate with the account's app we fallback
 * to iframe postmessaging via the injected content-script
 */
export const handleForkFallback = () => {
    if (isMainFrame()) {
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
    }
};
