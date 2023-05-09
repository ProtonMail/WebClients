import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { WorkerMessageType, type WorkerMessageWithSender, type WorkerState } from '@proton/pass/types';
import { createListenerStore } from '@proton/pass/utils/listener';
import { logger } from '@proton/pass/utils/logger';
import { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';

import { ExtensionContext, type ExtensionContextType, setupExtensionContext } from '../../shared/extension';
import { createContentScriptContext } from '../context/factory';
import { DOMCleanUp } from '../injections/cleanup';

export const createContentScriptService = (scriptId: string, mainFrame: boolean) => {
    const context = createContentScriptContext(scriptId, mainFrame);
    const listeners = createListenerStore();

    /* Only destroy the injection DOM if we're not going to
     * recycle this content-script service.  */
    const destroy = (options: { reason: string; recycle?: boolean }) => {
        if (context.getState().active) {
            logger.info(`[ContentScript::${scriptId}] destroying.. [reason: "${options.reason}"]`, options.recycle);

            listeners.removeAll();
            context.setState({ active: options.recycle ?? false });
            context.service.formManager.destroy();

            if (!options.recycle) {
                context.service.iframe.destroy();
                DOMCleanUp();
            }

            ExtensionContext.read()?.destroy();
        }
    };

    const onWorkerStateChange = (workerState: WorkerState) => {
        const { loggedIn, UID } = workerState;
        setSentryUID(UID);

        context.setState(workerState);
        context.service.iframe.reset();
        context.service.formManager.sync();

        if (!loggedIn) context.service.autofill.setLoginItemsCount(0);
    };

    const onSettingsChange = (settings: ProxiedSettings) => {
        context.setSettings(settings);
        context.service.iframe.reset();
        context.service.formManager.sync();

        void context.service.autofill.queryItems();
    };

    const onPortMessage = async (message: WorkerMessageWithSender): Promise<void> => {
        if (message.sender === 'background') {
            switch (message.type) {
                case WorkerMessageType.UNLOAD_CONTENT_SCRIPT:
                    return destroy({ recycle: false, reason: 'unload script' });
                case WorkerMessageType.WORKER_STATUS:
                    return onWorkerStateChange(message.payload.state);
                case WorkerMessageType.SETTINGS_UPDATE:
                    return onSettingsChange(message.payload);
                case WorkerMessageType.AUTOFILL_SYNC:
                    return context.service.autofill.setLoginItemsCount(message.payload.count);
            }
        }
    };

    const handleStart = async ({ tabId, port }: ExtensionContextType) => {
        const res = await sendMessage(
            contentScriptMessage({
                type: WorkerMessageType.WORKER_WAKEUP,
                payload: { endpoint: 'content-script', tabId },
            })
        );

        if (res.type === 'success' && context.getState().active) {
            const workerState = { loggedIn: res.loggedIn, status: res.status, UID: res.UID };
            logger.info(`[ContentScript::${scriptId}] Worker status resolved "${workerState.status}"`);

            onWorkerStateChange(workerState);
            onSettingsChange(res.settings!);

            if (!mainFrame) {
                const { runDetection } = context.service.detector.assess([]);
                if (!runDetection) return destroy({ reason: 'subframe discarded', recycle: false });
            }

            context.service.formManager.detect('VisibilityChange');
            context.service.formManager.observe();

            port.onMessage.addListener(onPortMessage);
        }
    };

    const start = async () => {
        try {
            const extensionContext = await setupExtensionContext({
                endpoint: 'content-script',
                onDisconnect: () => destroy({ recycle: true, reason: 'port disconnected' }),
                onContextChange: (nextCtx) => context.getState().active && handleStart(nextCtx),
            });

            logger.info(`[ContentScript::${scriptId}] Starting content-script service`);
            return await handleStart(extensionContext);
        } catch (e) {
            logger.warn(`[ContentScript::${scriptId}] Setup error`, e);
            destroy({ recycle: true, reason: 'setup error' });
        }
    };

    return { start, destroy };
};

export type ContentScriptService = ReturnType<typeof createContentScriptService>;
