import { CLIENT_SCRIPT_READY_EVENT } from 'proton-pass-extension/app/content/constants.static';
import { CSContext } from 'proton-pass-extension/app/content/context/context';
import { createContentScriptContext } from 'proton-pass-extension/app/content/context/factory';
import { DOMCleanUp } from 'proton-pass-extension/app/content/injections/cleanup';
import { NotificationAction } from 'proton-pass-extension/app/content/types/notification';
import type { ExtensionContextType } from 'proton-pass-extension/lib/context/extension-context';
import { ExtensionContext, setupExtensionContext } from 'proton-pass-extension/lib/context/extension-context';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { matchExtensionMessage } from 'proton-pass-extension/lib/message/utils';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { clientNeedsSession, clientSessionLocked } from '@proton/pass/lib/client';
import type { FeatureFlagState } from '@proton/pass/store/reducers';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { type AppState } from '@proton/pass/types';
import type { PassElementsConfig } from '@proton/pass/types/utils/dom';
import { TopLayerManager } from '@proton/pass/utils/dom/popover';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

type CreateContentScriptOptions = {
    scriptId: string;
    mainFrame: boolean;
    /** Current content-script custom elements unique hashes */
    elements: PassElementsConfig;
    /** Called when content script fails to start or recycle. Passed
     * to the `ExtensionContext` to handle invalidation cases where
     * unload events can't be caught, like during SW termination */
    onError: (error: unknown) => void;
};

export const createContentScriptClient = ({ scriptId, mainFrame, elements, onError }: CreateContentScriptOptions) => {
    const context = createContentScriptContext({
        elements,
        mainFrame,
        scriptId,
        destroy: (options) => {
            logger.info(`[ContentScript::${scriptId}] destroying.. [reason: "${options.reason}"]`);
            context.setState({ stale: true });

            context.service.formManager.destroy();
            context.service.iframe.destroy();
            context.service.webauthn?.destroy();
            TopLayerManager.disconnect();

            DOMCleanUp(elements);

            ExtensionContext.read()?.destroy();
        },
    });

    const reconciliate = async () => {
        const { status } = context.getState();
        context.service.formManager.sync();

        const locked = clientSessionLocked(status);
        const loggedOut = clientNeedsSession(status);

        if (loggedOut || locked) {
            const action = context.service.iframe.notification?.getState().action;
            const unlockable = [NotificationAction.PASSKEY_CREATE, NotificationAction.PASSKEY_GET];
            const shouldDestroy = !locked || (action && !unlockable.includes(action));
            if (shouldDestroy) context.service.iframe.notification?.destroy();
        }
    };

    const onFeatureFlagsChange = (features: FeatureFlagState) => context.setFeatureFlags(features);

    const onSettingsChange = (settings: ProxiedSettings) => {
        context.setSettings(settings);
        context.service.iframe.setTheme(settings.theme);
        void reconciliate();
    };

    const onWorkerStateChange = (workerState: AppState) => {
        context.setState(workerState);
        void reconciliate();
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
            context.service.iframe.init();
            context.service.webauthn?.init();

            const res = await sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.CLIENT_INIT,
                    payload: { endpoint: 'contentscript', tabId },
                })
            );

            if (res.type === 'error') throw new Error();

            context.setState({ ...res.state, ready: true, stale: false });
            context.setSettings(res.settings);
            context.setFeatureFlags(res.features);
            context.service.iframe.setTheme(res.settings.theme);

            /* if the user has disabled every injection setting or added the current
             * domain to the pause list we can safely destroy the content-script context */
            const features = context.getFeatures();
            const enableDetector = context.service.detector.isEnabled(features);
            const enable = enableDetector || features.Passkeys;
            if (!enable) return context.destroy({ reason: 'injection settings' });

            /* if we're in an iframe and the initial detection should not
             * be triggered : destroy this content-script service */
            if (!mainFrame) return context.destroy({ reason: 'subframe discarded' });

            logger.debug(`[ContentScript::${scriptId}] Worker status resolved "${res.state.status}"`);
            window.postMessage({ type: CLIENT_SCRIPT_READY_EVENT });

            await reconciliate();
            port.onMessage.addListener(onPortMessage);

            if (enableDetector) {
                context.service.formManager.observe();
                await context.service.detector.init();
                await context.service.formManager.detect({ reason: 'InitialLoad' }).catch(noop);
            }
        } catch (err) {
            context.destroy({ reason: 'startup failure' });
            onError(err);
        }
    });

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
                    onError,
                    onRecycle: handleStart,
                });

                logger.debug(`[ContentScript::${scriptId}] Starting content-script service`);
                if (!context.getState().stale) await handleStart(extensionContext);
            } catch {}
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
