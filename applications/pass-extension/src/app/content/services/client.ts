import type { ClientController } from 'proton-pass-extension/app/content/client.controller';
import { CLIENT_SCRIPT_READY_EVENT } from 'proton-pass-extension/app/content/constants.static';
import { CSContext } from 'proton-pass-extension/app/content/context/context';
import { createContentScriptContext } from 'proton-pass-extension/app/content/context/factory';
import { DOMCleanUp } from 'proton-pass-extension/app/content/injections/cleanup';
import { getFrameAttributes, getFrameElement } from 'proton-pass-extension/app/content/utils/frame';
import type { ExtensionContextType } from 'proton-pass-extension/lib/context/extension-context';
import { ExtensionContext, setupExtensionContext } from 'proton-pass-extension/lib/context/extension-context';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { matchExtensionMessage } from 'proton-pass-extension/lib/message/utils';
import { getNodePosition } from 'proton-pass-extension/lib/utils/dom';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { FeatureFlagState } from '@proton/pass/store/reducers';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { AppState } from '@proton/pass/types';
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
    controller: ClientController;
};

export const createContentScriptClient = ({
    scriptId,
    mainFrame,
    elements,
    controller,
}: CreateContentScriptOptions) => {
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
            context.service.webauthn?.destroy();
            TopLayerManager.disconnect();

            DOMCleanUp(elements);
            ExtensionContext.read()?.destroy();
        },
    });

    const reconciliate = async () => {
        context.service.formManager.sync();
        context.service.autofill.sync().catch(noop);
        context.service.inline.sync();
    };

    const onFeatureFlagsChange = (features: FeatureFlagState) => context.setFeatureFlags(features);

    const onSettingsChange = (settings: ProxiedSettings) => {
        context.setSettings(settings);
        context.service.inline.setTheme(settings.theme);
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
            context.service.inline.init();
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
            context.service.inline.setTheme(res.settings.theme);

            /* if the user has disabled every injection setting or added the current
             * domain to the pause list we can safely destroy the content-script context */
            const features = context.getFeatures();
            const enableDetector = context.service.detector.isEnabled(features);
            const enable = enableDetector || features.Passkeys;
            if (!enable) return context.destroy({ reason: 'injection settings' });

            /* if we're in an iframe and the initial detection should not
             * be triggered : destroy this content-script service */
            // if (!mainFrame) return context.destroy({ reason: 'subframe discarded' });

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
            controller.destroy();
        }
    });

    const client = {
        get context() {
            return context;
        },
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
                    onError: controller.destroy,
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

    controller.frameMessageBroker.register(WorkerMessageType.FRAME_TREE_WALK, ({ payload }, _, sendResponse) => {
        const target = getFrameElement(payload.frameId, payload.attributes);
        if (!target) return undefined;

        sendResponse({
            /** report the top/left coordinates of the target frame relative
             * to the current document which may be in turn another frame */
            coords: getNodePosition(target),
            /** if the current frame is another iframe: report back the frame
             * attributes to allow identification during tree-walk */
            attributes: getFrameAttributes(),
        });

        return true;
    });

    return client;
};

export type ContentScriptClient = ReturnType<typeof createContentScriptClient>;
