import { contentScriptMessage, sendMessage, successMessage } from '@proton/pass/lib/extension/message/send-message';
import { WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { APPS } from '@proton/shared/lib/constants';

export const authFallback = () => {
    window.addEventListener('message', async (message) => {
        try {
            if (
                message.data &&
                message.data?.type !== undefined &&
                message.data?.app === APPS.PROTONPASSBROWSEREXTENSION
            ) {
                switch (message.data.type) {
                    case WorkerMessageType.ACCOUNT_FORK:
                        const { keyPassword, selector, state, persistent, trusted } = message.data.payload;
                        return await sendMessage.on(
                            contentScriptMessage({
                                type: WorkerMessageType.ACCOUNT_FORK,
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

                    case WorkerMessageType.ACCOUNT_EXTENSION:
                        return await sendMessage(contentScriptMessage({ type: WorkerMessageType.ACCOUNT_EXTENSION }));

                    case WorkerMessageType.ACCOUNT_ONBOARDING:
                        return await sendMessage(contentScriptMessage({ type: WorkerMessageType.ACCOUNT_ONBOARDING }));

                    case WorkerMessageType.ACCOUNT_PROBE:
                        return window.postMessage(successMessage({ token: message.data?.token }));
                }
            }
        } catch (e) {
            logger.warn('[ContentScript::Fork]', e);
        }
    });
};
