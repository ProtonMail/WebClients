import { CLIENT_SCRIPT_READY_EVENT } from 'proton-pass-extension/app/content/constants.static';
import { CSContext } from 'proton-pass-extension/app/content/context/context';
import { createContentScriptContext } from 'proton-pass-extension/app/content/context/factory';
import type { ContentScriptContext } from 'proton-pass-extension/app/content/context/types';
import type { ClientController } from 'proton-pass-extension/app/content/services/client/client.controller';
import { DOMCleanUp } from 'proton-pass-extension/app/content/services/inline/inline.cleanup';
import type { ExtensionContextType } from 'proton-pass-extension/lib/context/extension-context';
import { ExtensionContext, setupExtensionContext } from 'proton-pass-extension/lib/context/extension-context';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { matchExtensionMessage } from 'proton-pass-extension/lib/message/utils';
import { shouldEnableDetector, shouldInjectContentScript } from 'proton-pass-extension/lib/utils/features';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { FeatureFlagState } from '@proton/pass/store/reducers';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { AppState } from '@proton/pass/types';
import type { PassElementsConfig } from '@proton/pass/types/utils/dom';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

export type ContentScriptClientFactoryOptions = {
    /** Random uuid to identify current client */
    scriptId: string;
    /** Wether the content-script is in the top-frame */
    mainFrame: boolean;
    /** Current content-script custom elements unique hashes */
    elements: PassElementsConfig;
    /** Parent controller orchestrating lifecycle */
    controller: ClientController;
};

export type ContentScriptClient = {
    context: ContentScriptContext;
    start: () => void;
    destroy: (options: { reason: string }) => void;
};

export const createContentScriptClient = ({
    scriptId,
    mainFrame,
    elements,
    controller,
}: ContentScriptClientFactoryOptions): ContentScriptClient => {
    const context = createContentScriptContext({
        controller,
        elements,
        mainFrame,
        scriptId,
        destroy: (options) => {
            logger.info(`[ContentScript::${scriptId}] destroying.. [reason: "${options.reason}"]`);
            context.setState({ stale: true });

            context.service.formManager.destroy();
            context.service.inline.destroy();
            context.service.autofill.destroy();
            context.service.passkey?.destroy();
            context.service.autosave.destroy();

            DOMCleanUp(elements);
            ExtensionContext.read()?.destroy();
        },
    });

    const reconciliate = safeCall(() => {
        context.service.formManager.sync();
        context.service.autofill.sync().catch(noop);
        context.service.inline.sync();
    });

    const onFeatureFlagsChange = (features: FeatureFlagState) => context.setFeatureFlags(features);

    const onSettingsChange = (settings: ProxiedSettings) => {
        context.setSettings(settings);
        context.service.inline.setTheme(settings.theme);
        reconciliate();
    };

    const onWorkerStateChange = (workerState: AppState) => {
        context.setState(workerState);
        reconciliate();
    };

    const onPortMessage = async (message: unknown): Promise<void> => {
        if (matchExtensionMessage(message, { sender: 'background' })) {
            switch (message.type) {
                case WorkerMessageType.AUTOFILL_SYNC:
                    return context.service.autofill.sync({ forceSync: true });
                case WorkerMessageType.FEATURE_FLAGS_UPDATE:
                    return onFeatureFlagsChange(message.payload);
                case WorkerMessageType.SETTINGS_UPDATE:
                    return onSettingsChange(message.payload);
                case WorkerMessageType.WORKER_STATE_CHANGE:
                    return onWorkerStateChange(message.payload.state);
                case WorkerMessageType.UNLOAD_CONTENT_SCRIPT:
                    return context.destroy({ reason: 'unload script' });
            }
        }
    };

    const handleStart = asyncLock(async ({ tabId, port }: ExtensionContextType) => {
        try {
            /** init the webauthn service optimistically even if the
             * initialization of the content-script fails. As we are injecting
             * the webauthn interceptors in the main-world on `document_start` we
             * need to avoid missing on events of the `MessageBridge` */
            context.service.inline.init();
            context.service.passkey?.init();

            const res = await sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.CLIENT_INIT,
                    payload: { endpoint: 'contentscript', tabId },
                })
            );

            if (res.type === 'error') throw new Error('Client initialization failure');

            /** NOTE: set settings/features BEFORE calling `getFeatures` in order
             * to properly resolve the content-script behaviours to activate */
            context.setSettings(res.settings);
            context.setFeatureFlags(res.features);
            context.service.inline.setTheme(res.settings.theme);

            const features = context.getFeatures();

            if (!shouldInjectContentScript(features)) {
                /** if the user has disabled every injection setting or added the current
                 * domain to the pause list we can safely destroy the content-script context.
                 * This is also handled in the `LOAD_CONTENT_SCRIPT` handler sw-side. */
                return context.destroy({ reason: 'injection settings' });
            }

            context.setState({ ...res.state, ready: true, stale: false });
            reconciliate();

            /** Notify the message bridge that the content-script is now ready. This
             * is required as the webauthn message bridge is injected in the main world.*/
            if (context.mainFrame) window.postMessage({ type: CLIENT_SCRIPT_READY_EVENT });
            port.onMessage.addListener(onPortMessage);

            logger.debug(`[ContentScript::${scriptId}] Worker status resolved "${res.state.status}"`);

            if (shouldEnableDetector(features)) {
                await context.service.detector.init();
                await context.service.formManager.detect({ reason: 'InitialLoad' }).catch(noop);

                /** Start the page observer and hook up any effects
                 * to the formManager detection triggers */
                controller.observer.subscribe(
                    (evt) => evt.type === 'mutation' && context.service.formManager.detect({ reason: evt.reason })
                );
            }
        } catch (err) {
            context.destroy({ reason: 'startup failure' });
        }
    });

    const client: ContentScriptClient = {
        get context() {
            return context;
        },

        /** Connects the content-script service to the extension context.
         * Will automatically try to recycle the extension context if the
         * port is disconnected if the service worker is killed. */
        start: async () => {
            try {
                const ext = await setupExtensionContext({
                    endpoint: 'contentscript',

                    onDisconnect: () => {
                        /** Restart the controller. SW re-registration timeout is
                         * handled by `controller.start` debounce (350ms). */
                        controller.stop('port disconnected');
                        controller.start();
                    },

                    /** if the extension context errors out: destroy the parent
                     * controller. This will cascade to remove both the extension
                     * context and the content-script context */
                    onError: controller.destroy,
                });

                logger.debug(`[ContentScript::${scriptId}] Starting content-script service`);
                if (!context.getState().stale) await handleStart(ext);
            } catch {}
        },

        /** Full destruction of the content-script and extension
         * context. Should only be called if we are unloading */
        destroy: (options: { reason: string }) => {
            context.destroy(options);
            CSContext.clear();
        },
    };

    return client;
};
