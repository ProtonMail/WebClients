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
import { CSContext } from 'proton-pass-extension/app/content/context/context';
import { createContentScriptContext } from 'proton-pass-extension/app/content/context/factory';
import { DOMCleanUp } from 'proton-pass-extension/app/content/injections/cleanup';
import type { ExtensionContextType } from 'proton-pass-extension/lib/context/extension-context';
import { ExtensionContext, setupExtensionContext } from 'proton-pass-extension/lib/context/extension-context';

import { clientReady } from '@proton/pass/lib/client';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message';
import type { FeatureFlagState } from '@proton/pass/store/reducers';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { type AppState, WorkerMessageType, type WorkerMessageWithSender } from '@proton/pass/types';
import type { PassElementsConfig } from '@proton/pass/types/utils/dom';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

type CreateContentScriptOptions = {
    scriptId: string;
    mainFrame: boolean;
    elements: PassElementsConfig;
};
export const createContentScriptClient = ({ scriptId, mainFrame, elements }: CreateContentScriptOptions) => {
    const listeners = createListenerStore();

    const context = createContentScriptContext({
        elements,
        mainFrame,
        scriptId,
        destroy: (options) => {
            logger.info(`[ContentScript::${scriptId}] destroying.. [reason: "${options.reason}"]`);

            DOMCleanUp(elements);
            listeners.removeAll();
            context.service.formManager.destroy();
            context.service.iframe.destroy();

            ExtensionContext.read()?.destroy();
        },
    });

    const reconciliate = async () => {
        const { status, loggedIn } = context.getState();
        context.service.formManager.sync();

        if (!loggedIn) {
            /** If the user is unexpectedly logged out, clear autofill cached
             * data and detach any autosave notification that may be present */
            context.service.autofill.reset();
            context.service.iframe.detachNotification();
        } else if (clientReady(status)) await context.service.autofill.reconciliate();
    };

    const onFeatureFlagsChange = (features: FeatureFlagState) => context.setFeatureFlags(features);

    const onSettingsChange = (settings: ProxiedSettings) => {
        context.setSettings(settings);
        void reconciliate();
    };

    const onWorkerStateChange = (workerState: AppState) => {
        context.setState(workerState);
        void reconciliate();
    };

    const onPortMessage = async (message: WorkerMessageWithSender): Promise<void> => {
        if (message.sender === 'background') {
            switch (message.type) {
                case WorkerMessageType.AUTOFILL_SYNC:
                    return context.service.autofill.sync(message.payload);
                case WorkerMessageType.FEATURE_FLAGS_UPDATE:
                    return onFeatureFlagsChange(message.payload);
                case WorkerMessageType.SETTINGS_UPDATE:
                    return onSettingsChange(message.payload);
                case WorkerMessageType.WORKER_STATUS:
                    return onWorkerStateChange(message.payload.state);
                case WorkerMessageType.UNLOAD_CONTENT_SCRIPT:
                    return context.destroy({ reason: 'unload script' });
            }
        }
    };

    const handleStart = async ({ tabId, port }: ExtensionContextType) => {
        const res = await sendMessage(
            contentScriptMessage({
                type: WorkerMessageType.WORKER_WAKEUP,
                payload: { endpoint: 'contentscript', tabId },
            })
        );

        if (res.type === 'success') {
            logger.debug(`[ContentScript::${scriptId}] Worker status resolved "${res.status}"`);
            context.setState({ loggedIn: res.loggedIn, status: res.status, UID: res.UID });
            context.setSettings(res.settings);
            context.setFeatureFlags(res.features);
            context.service.iframe.reset();
            await reconciliate();

            /* if the user has disabled every injection setting or added the current
             * domain to the pause list we can safely destroy the content-script context */
            const enable = Object.values(context.getFeatures()).reduce((pass, feat) => pass || feat);
            if (!enable) return context.destroy({ reason: 'injection settings' });

            /* if we're in an iframe and the initial detection should not
             * be triggered : destroy this content-script service */
            if (!mainFrame) return context.destroy({ reason: 'subframe discarded' });

            port.onMessage.addListener(onPortMessage);
            context.service.formManager.observe();

            await context.service.formManager.detect({ reason: 'InitialLoad', flush: true }).catch(noop);
        }
    };

    return {
        /** Connects the content-script service to the extension context.
         * Will automatically try to recycle the extension context if the
         * port is disconnected if the service worker is killed */
        start: async () => {
            try {
                const extensionContext = await setupExtensionContext({
                    endpoint: 'contentscript',
                    onDisconnect: () => {
                        context.destroy({ reason: 'port disconnected' });
                        return { recycle: true };
                    },
                    onRecycle: handleStart,
                });

                logger.debug(`[ContentScript::${scriptId}] Starting content-script service`);
                return await handleStart(extensionContext);
            } catch (e) {
                logger.debug(`[ContentScript::${scriptId}] Setup error`, e);
                context.destroy({ reason: 'setup error' });
            }
        },
        /** Full destruction of the content-script and extension
         * context. Should only be called if we are unloading */
        destroy: (options: { reason: string }) => {
            context.destroy(options);
            CSContext.clear();
        },
    };
};

export type ContentScriptClientService = ReturnType<typeof createContentScriptClient>;
