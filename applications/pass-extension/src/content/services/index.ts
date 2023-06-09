/* This file defines the core client code for the browser extension's content script.
 * The client sets up the context, manages the state and provides functions to start and destroy
 * the content script service. It listens to messages from the background script,
 * and registers or unregisters the content script service based on state changes / errors.
 *
 * Sequences:
 * - Normal start: client is registered with the background script and starts normally.
 * - Unregister request: background requests to unregister -> client destroys itself.
 * - Successful recovery: extension context change with successful recovery (i.e., port disconnected).
 * - Failed recovery: extension context change with failed recovery -> destroy.
 * - Error during setup: client encounters an error during setup -> destroy.
 */
import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { WorkerMessageType, type WorkerMessageWithSender, type WorkerState } from '@proton/pass/types';
import { createListenerStore } from '@proton/pass/utils/listener';
import { logger } from '@proton/pass/utils/logger';
import { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';

import { ExtensionContext, type ExtensionContextType, setupExtensionContext } from '../../shared/extension';
import { CSContext } from '../context/context';
import { createContentScriptContext } from '../context/factory';
import { DOMCleanUp } from '../injections/cleanup';

import '../injections/styles/injection.scss';

export const createContentScriptClient = (scriptId: string, mainFrame: boolean) => {
    const context = createContentScriptContext(scriptId, mainFrame);
    const listeners = createListenerStore();

    /* Only destroy the injection DOM if we're not going to
     * recycle this content-script service.  */
    const destroy = (options: { reason: string; recycle?: boolean }) => {
        if (context.getState().active) {
            logger.debug(`[ContentScript::${scriptId}] destroying.. [reason: "${options.reason}"]`, options.recycle);

            listeners.removeAll();
            context.setState({ active: options.recycle ?? false });
            context.service.formManager.destroy();

            if (!options.recycle) {
                context.service.iframe.destroy();
                CSContext.clear();
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
            logger.debug(`[ContentScript::${scriptId}] Worker status resolved "${workerState.status}"`);

            onWorkerStateChange(workerState);
            onSettingsChange(res.settings!);

            /* if we're in an iframe and the initial detection should not
             * be triggered : destroy this content-script service */
            if (!mainFrame) return destroy({ reason: 'subframe discarded', recycle: false });

            port.onMessage.addListener(onPortMessage);

            context.service.formManager.observe();
            const didDetect = await context.service.formManager.detect('InitialLoad');
            if (!didDetect) await context.service.formManager.reconciliate();
        }
    };

    const start = async () => {
        try {
            const extensionContext = await setupExtensionContext({
                endpoint: 'content-script',
                onDisconnect: () => destroy({ recycle: true, reason: 'port disconnected' }),
                onContextChange: (nextCtx) => context.getState().active && handleStart(nextCtx),
            });

            logger.debug(`[ContentScript::${scriptId}] Starting content-script service`);
            return await handleStart(extensionContext);
        } catch (e) {
            logger.debug(`[ContentScript::${scriptId}] Setup error`, e);
            destroy({ recycle: false, reason: 'setup error' });
        }
    };

    return { start, destroy };
};

export type ContentScriptClientService = ReturnType<typeof createContentScriptClient>;
