import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { WorkerMessageType, type WorkerMessageWithSender, type WorkerState, WorkerStatus } from '@proton/pass/types';
import { isMainFrame } from '@proton/pass/utils/dom';
import { safeCall } from '@proton/pass/utils/fp';
import { createListenerStore } from '@proton/pass/utils/listener';
import { logger } from '@proton/pass/utils/logger';
import { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';
import debounce from '@proton/utils/debounce';
import noop from '@proton/utils/noop';

import { INITIAL_SETTINGS } from '../../shared/constants';
import { ExtensionContext, type ExtensionContextType, setupExtensionContext } from '../../shared/extension';
import { CONTENT_SCRIPT_INJECTED_MESSAGE } from '../constants';
import CSContext, { ContentScriptContext } from '../context';
import { getAllFields } from '../handles/form';
import { DOMCleanUp } from '../injections/cleanup';
import { isIFrameRootAttached } from '../injections/iframe/create-iframe-root';
import { createFormManager } from './form/manager';
import { createDropdown } from './iframes/dropdown';
import { createNotification } from './iframes/notification';

export const createContentScriptService = (id: string) => {
    const listeners = createListenerStore();

    const createIFrames = () => ({
        dropdown: createDropdown(),
        notification: isMainFrame() ? createNotification() : null,
    });

    const context: ContentScriptContext = CSContext.set({
        id,
        active: true,
        formManager: createFormManager(),
        iframes: createIFrames(),
        settings: INITIAL_SETTINGS,
        state: { loggedIn: false, status: WorkerStatus.IDLE, UID: undefined },
    });

    /**
     * Disable sentry in the content-script for now to avoid
     * swarming external JS errors as sentry will catch them
        sentry({
            config,
            sentryConfig: {
                host: new URL(config.API_URL).host,
                release: config.APP_VERSION,
                environment: `browser-pass::content-script`,
            },
            ignore: () => false,
        });
    */

    const destroy = (options: { dom?: boolean; reason: string }) => {
        logger.info(`[ContentScript::${id}] destroying.. [reason: "${options.reason}"]`);

        listeners.removeAll();

        context.formManager.sleep();
        context.iframes.dropdown.close();
        context.iframes.notification?.close();
        context.active = false;

        /* may fail if context already invalidated */
        safeCall(ExtensionContext.get().port.disconnect);

        if (options.dom) {
            DOMCleanUp();
        }
    };

    const onWorkerStateChange = (workerState: WorkerState) => {
        const { loggedIn, UID } = workerState;
        setSentryUID(UID);

        context.state = workerState;
        context.iframes.dropdown.reset(workerState);

        context.formManager.getForms().forEach((form) => {
            const fields = getAllFields(form);
            fields.forEach((field) => {
                field.icon?.setStatus(workerState.status);
                return !loggedIn && field?.icon?.setCount(0);
            });
        });

        if (!loggedIn) {
            context.formManager.autofill.setLoginItemsCount(0);
            context.iframes.notification?.reset?.(workerState);
        }
    };

    const onSettingsChange = (settings: ProxiedSettings) => {
        context.settings = settings;
    };

    const onPortMessage = async (message: WorkerMessageWithSender): Promise<void> => {
        if (message.sender === 'background') {
            switch (message.type) {
                case WorkerMessageType.UNLOAD_CONTENT_SCRIPT:
                    return destroy({ dom: true, reason: 'unload script' });
                case WorkerMessageType.WORKER_STATUS:
                    return onWorkerStateChange(message.payload.state);
                case WorkerMessageType.SETTINGS_UPDATE:
                    return onSettingsChange(message.payload);
                case WorkerMessageType.AUTOFILL_SYNC:
                    return context.formManager.autofill.setLoginItemsCount(message.payload.count);
            }
        }
    };

    /* Some SPA websites might wipe the whole DOM on page change :
     * this will cause our IFrame root to be removed. If this is the
     * case we must re-init the injected frames with the current port
     * and the current worker state */
    const ensureIFramesAttached = () => {
        if (!isIFrameRootAttached()) {
            const { port } = ExtensionContext.get();
            context.iframes = createIFrames();
            context.iframes.dropdown.init(port).reset(context.state);
            context.iframes.notification?.init(port).reset(context.state);
        }
    };

    const handleStart = async ({ tabId, port }: ExtensionContextType) => {
        try {
            const res = await sendMessage(
                contentScriptMessage({
                    type: WorkerMessageType.WORKER_WAKEUP,
                    payload: { endpoint: 'content-script', tabId },
                })
            );

            context.iframes.dropdown.init(port);
            context.iframes.notification?.init(port);

            if (res.type === 'success') {
                const workerState = { loggedIn: res.loggedIn, status: res.status, UID: res.UID };
                logger.info(`[ContentScript::${id}] Worker status resolved "${workerState.status}"`);

                onWorkerStateChange(workerState);
                onSettingsChange(res.settings!);

                context.formManager.observe();
                context.formManager.detect('VisibilityChange');
                context.active = true;

                port.onMessage.addListener(onPortMessage);
                listeners.addObserver(debounce(ensureIFramesAttached, 500), document.body, { childList: true });
            }
        } catch (_) {
            context.active = false;
        }
    };

    const setup = async () => {
        try {
            const extensionContext = await setupExtensionContext({
                endpoint: 'content-script',
                onDisconnect: () => destroy({ dom: false, reason: 'port disconnected' }),
                onContextChange: (nextCtx) => handleStart(nextCtx).catch(noop),
            });

            logger.info(`[ContentScript::${id}] Registering content-script`);
            return extensionContext;
        } catch (e) {
            logger.warn(`[ContentScript::${id}] Setup error`, e);
        }
    };

    const handleVisibilityChange = async () => {
        try {
            switch (document.visibilityState) {
                case 'visible': {
                    const extensionContext = await setup();
                    return extensionContext && (await handleStart(extensionContext));
                }
                case 'hidden': {
                    return destroy({ dom: false, reason: 'visibility change' });
                }
            }
        } catch (e) {
            logger.warn(`[ContentScript::${id}] invalidation error`, e);
            /**
             * Reaching this catch block will likely happen
             * when the setup function fails due to an extension
             * update. At this point we should remove any listeners
             * in this now-stale content-script and delete any
             * allocated resources
             */
            context.active = false;
            destroy({ dom: true, reason: 'context invalidated' });
        }
    };

    /* If another content-script is being injected - if
     * the extension updates - we should destroy the current
     * one and let the incoming one take over. */
    const handlePostMessage = (message: MessageEvent) => {
        if (message.data?.type === CONTENT_SCRIPT_INJECTED_MESSAGE && message?.data?.id !== id) {
            logger.info(`[ContentScript::${id}] a newer content-script::${message.data.id} was detected !`);
            context.active = false;
            context.iframes.dropdown.destroy();
            context.iframes.notification?.destroy();

            window.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('message', handlePostMessage);

            destroy({ dom: true, reason: 'incoming injection' });
        }
    };

    window.addEventListener('message', handlePostMessage);

    return {
        watch: (mainFrame: boolean) => {
            setup()
                .then((extensionContext) => {
                    /* When browser recovers a browsing session (ie: upon
                     * restarting after an exit) content-scripts will be
                     * re-injected in all the recovered tabs. As such, we
                     * want to only "start" the content-script if the tab
                     * is visible to avoid swarming the worker with wake-ups  */
                    if (document.visibilityState === 'visible' && extensionContext && context.active) {
                        return handleStart(extensionContext);
                    }
                })
                .then(() => {
                    /* We only want to track visibility change on the
                     * root main frame to avoid unnecessary detections */
                    if (mainFrame) {
                        window.addEventListener('visibilitychange', handleVisibilityChange);
                    }
                })
                .catch(noop);
        },
    };
};
