import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { WorkerMessageType, type WorkerMessageWithSender, type WorkerState, WorkerStatus } from '@proton/pass/types';
import { isMainFrame } from '@proton/pass/utils/dom';
import { createListenerStore } from '@proton/pass/utils/listener';
import { logger } from '@proton/pass/utils/logger';
import { setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';
import debounce from '@proton/utils/debounce';

import { INITIAL_SETTINGS } from '../../shared/constants';
import { ExtensionContext, type ExtensionContextType, setupExtensionContext } from '../../shared/extension';
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

    /* Only destroy the injection DOM if we're not going to
     * recycle this content-script service.  */
    const destroy = (options: { reason: string; recycle?: boolean }) => {
        if (context.active) {
            logger.info(`[ContentScript::${id}] destroying.. [reason: "${options.reason}"]`, options.recycle);

            context.active = options.recycle ?? false;
            context.formManager.sleep();

            context.iframes.dropdown[options.recycle ? 'close' : 'destroy']();
            context.iframes.notification?.[options.recycle ? 'close' : 'destroy']();

            listeners.removeAll();
            ExtensionContext.read()?.port.disconnect();

            if (!options.recycle) DOMCleanUp();
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
                    return destroy({ recycle: false, reason: 'unload script' });
                case WorkerMessageType.WORKER_STATUS:
                    return onWorkerStateChange(message.payload.state);
                case WorkerMessageType.SETTINGS_UPDATE:
                    return onSettingsChange(message.payload);
                case WorkerMessageType.AUTOFILL_SYNC:
                    return context.formManager.autofill.setLoginItemsCount(message.payload.count);
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

        if (res.type === 'success' && context.active) {
            const workerState = { loggedIn: res.loggedIn, status: res.status, UID: res.UID };
            logger.info(`[ContentScript::${id}] Worker status resolved "${workerState.status}"`);

            ensureIFramesAttached();

            context.iframes.dropdown.init(port);
            context.iframes.notification?.init(port);

            onWorkerStateChange(workerState);
            onSettingsChange(res.settings!);

            context.formManager.detect('VisibilityChange');
            context.formManager.observe();

            port.onMessage.addListener(onPortMessage);
            listeners.addObserver(debounce(ensureIFramesAttached, 500), document.body, { childList: true });
        }
    };

    const start = async () => {
        try {
            const extensionContext = await setupExtensionContext({
                endpoint: 'content-script',
                onDisconnect: () => destroy({ recycle: true, reason: 'port disconnected' }),
                onContextChange: (nextCtx) => context.active && handleStart(nextCtx),
            });

            logger.info(`[ContentScript::${id}] Registering content-script`);
            return await handleStart(extensionContext);
        } catch (e) {
            logger.warn(`[ContentScript::${id}] Setup error`, e);
            destroy({ recycle: true, reason: 'setup error' });
        }
    };

    return { start, destroy };
};

export type ContentScriptService = ReturnType<typeof createContentScriptService>;
