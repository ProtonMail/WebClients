import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { APPS } from '@proton/shared/lib/constants';

export const otherFallback = () => {
    window.addEventListener('message', async (message) => {
        try {
            if (
                message.data &&
                message.data?.type !== undefined &&
                message.data?.app === APPS.PROTONPASSBROWSEREXTENSION
            ) {
                switch (message.data.type) {
                    case WorkerMessageType.LOAD_CONTENT_SCRIPT_EXTERNAL:
                        return await sendMessage(
                            contentScriptMessage({ type: WorkerMessageType.LOAD_CONTENT_SCRIPT_EXTERNAL })
                        );
                    case WorkerMessageType.UNLOAD_CONTENT_SCRIPT_EXTERNAL:
                        return await sendMessage(
                            contentScriptMessage({ type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT_EXTERNAL })
                        );
                }
            }
        } catch (e) {
            logger.warn('[ContentScript::fallback]', e);
        }
    });
};
