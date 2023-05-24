import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { APPS, EXTENSIONS } from '@proton/shared/lib/constants';

export const authFallback = () => {
    window.addEventListener('message', async (message) => {
        try {
            if (
                message.data &&
                message.data?.type === 'fork' &&
                message.data?.extension === EXTENSIONS[APPS.PROTONPASSBROWSEREXTENSION].ID
            ) {
                const { keyPassword, selector, state, persistent, trusted } = message.data.payload;
                await sendMessage.on(
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
                    (response) => window.postMessage({ token: message.data?.token, ...response })
                );
            }
        } catch (e) {
            logger.warn('[ContentScript::Fork]', e);
        }
    });
};
