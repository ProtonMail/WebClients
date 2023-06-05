import { contentScriptMessage, sendMessage, successMessage } from '@proton/pass/extension/message';
import { WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { APPS, EXTENSIONS } from '@proton/shared/lib/constants';

export const authFallback = () => {
    window.addEventListener('message', async (message) => {
        try {
            if (
                message.data &&
                message.data?.type !== undefined &&
                message.data?.extension === EXTENSIONS[APPS.PROTONPASSBROWSEREXTENSION].ID
            ) {
                switch (message.data.type) {
                    case WorkerMessageType.FORK: {
                        const { keyPassword, selector, state, persistent, trusted } = message.data.payload;
                        return await sendMessage.on(
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

                    case WorkerMessageType.AUTH_EXT: {
                        return await sendMessage(
                            contentScriptMessage({
                                type: WorkerMessageType.AUTH_EXT,
                            })
                        );
                    }

                    case WorkerMessageType.PASS_INSTALLED: {
                        return window.postMessage(successMessage({}));
                    }
                }
            }
        } catch (e) {
            logger.warn('[ContentScript::Fork]', e);
        }
    });
};
