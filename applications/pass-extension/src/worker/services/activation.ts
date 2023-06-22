import { type Runtime } from 'webextension-polyfill';

import { getPersistedSession } from '@proton/pass/auth';
import type { MessageHandlerCallback } from '@proton/pass/extension/message';
import { backgroundMessage } from '@proton/pass/extension/message';
import { browserLocalStorage, browserSessionStorage } from '@proton/pass/extension/storage';
import browser from '@proton/pass/globals/browser';
import { selectItemDraft, selectPopupFilters, selectPopupTabState } from '@proton/pass/store';
import { boot, wakeup } from '@proton/pass/store/actions';
import type { MaybeNull, WorkerInitMessage, WorkerMessageWithSender, WorkerWakeUpMessage } from '@proton/pass/types';
import { WorkerMessageType, WorkerStatus } from '@proton/pass/types';
import { getErrorMessage } from '@proton/pass/utils/errors';
import { logger } from '@proton/pass/utils/logger';
import { UNIX_HOUR, getEpoch } from '@proton/pass/utils/time';
import { parseUrl } from '@proton/pass/utils/url';
import { workerCanBoot } from '@proton/pass/utils/worker';

import { checkExtensionPermissions } from '../../shared/extension/permissions';
import { isPopupPort } from '../../shared/extension/port';
import WorkerMessageBroker from '../channel';
import { withContext } from '../context';
import store from '../store';

type ActivationServiceState = {
    updateAvailable: MaybeNull<string>;
    checkedUpdateAt: number;
    permissionsGranted: boolean;
};
const UPDATE_ALARM_NAME = 'PassUpdateAlarm';

export const createActivationService = () => {
    const state: ActivationServiceState = { updateAvailable: null, checkedUpdateAt: 0, permissionsGranted: false };

    /* Safety-net around worker boot-sequence :
     * Ensures no on-going booting sequence */
    const handleBoot = withContext((ctx) => {
        if (workerCanBoot(ctx.status)) {
            ctx.setStatus(WorkerStatus.BOOTING);

            store.dispatch(boot({}));
        }
    });

    const checkAvailableUpdate = async (): Promise<boolean> => {
        const now = getEpoch();

        try {
            if (now - state.checkedUpdateAt > UNIX_HOUR) {
                const [updateStatus] = await browser.runtime.requestUpdateCheck();

                if (updateStatus === 'update_available') {
                    logger.info('[Worker::Activation] update detected');
                    return true;
                }
            }

            return false;
        } catch (_) {
            return false;
        } finally {
            state.checkedUpdateAt = now;
        }
    };

    /* Try recovering the session when browser starts up
     * if any session was locally persisted
     * if not in production - use sync.html session to workaround the
     * the SSL handshake (net:ERR_SSL_CLIENT_AUTH_CERT_NEEDED) */
    const handleStartup = withContext(async (ctx) => {
        const { loggedIn } = (await ctx.init({ force: true })).getState();

        if (ENV === 'development' && RESUME_FALLBACK) {
            if (!loggedIn && (await getPersistedSession())) {
                const url = browser.runtime.getURL('/onboarding.html#/resume');
                return browser.windows.create({ url, type: 'popup', height: 600, width: 540 });
            }
        }
    });

    /* On extension update :
     * - Re-init so as to resume session as soon as possible
     * - Re-inject content-scripts to avoid stale extension contexts
     *   only on Chrome as Firefox handles content-script re-injection */
    const handleInstall = withContext(async (ctx, details: Runtime.OnInstalledDetailsType) => {
        if (details.reason === 'update') {
            if (ENV === 'production') {
                /* in production clear the cache on each extension
                 * update in case the state/snapshot data-structure
                 * has changed. FIXME: use version migrations */
                await browserLocalStorage.removeItems(['salt', 'state', 'snapshot']);
            }

            if (BUILD_TARGET === 'chrome') void ctx.service.injection.updateInjections();

            ctx.service.onboarding.onUpdate();
            return ctx.init({ force: true });
        }

        if (details.reason === 'install') {
            try {
                await Promise.all([browserLocalStorage.clear(), browserSessionStorage.clear()]);
                const url = browser.runtime.getURL('/onboarding.html#/success');
                await browser.tabs.create({ url });
            } catch (error: any) {
                logger.warn(`[Worker::Activation] requesting fork failed: ${getErrorMessage(error)}`);
            }

            void ctx.service.settings.onInstall();
            void ctx.service.onboarding.onInstall();
            if (BUILD_TARGET === 'chrome') void ctx.service.injection.updateInjections();
        }
    });

    const handleOnUpdateAvailable = (details: Runtime.OnUpdateAvailableDetailsType) => {
        if (details.version) {
            logger.info(`[Worker::Activation] update available ${details.version}`);
            state.updateAvailable = details.version;

            const popupPorts = WorkerMessageBroker.ports.query(isPopupPort());
            /* on available update : only reload the runtime to force the
             * the extension update if the popup is not opened to avoid
             * discarding any ongoing user operations*/
            if (popupPorts.length === 0) return browser.runtime.reload();

            /* if we have ports opened to a popup : notify them in order
             * to manually prompt the user for a runtime reload */
            logger.info(`[Worker::Activation] update deferred because popup is active`);
            popupPorts.forEach((port) =>
                port.postMessage(
                    backgroundMessage({
                        type: WorkerMessageType.UPDATE_AVAILABLE,
                    })
                )
            );
        }
    };

    const checkPermissionsUpdate = async () => {
        logger.info(`[Worker::Activation] extension permissions change detected`);

        state.permissionsGranted = await checkExtensionPermissions();
        if (!state.permissionsGranted) logger.info(`[Worker::Activation] missing permissions`);

        WorkerMessageBroker.ports.broadcast(
            backgroundMessage({
                type: WorkerMessageType.PERMISSIONS_UPDATE,
                payload: { check: state.permissionsGranted },
            })
        );
    };

    /* When waking up from the pop-up (or page) we need to trigger the background wakeup
     * saga while immediately resolving the worker state so the UI can respond to state
     * changes as soon as possible. Regarding the content-script, we simply wait for a
     * ready state as its less "critical" */
    const handleWakeup = withContext<MessageHandlerCallback<WorkerMessageType.WORKER_WAKEUP>>(
        async (ctx, message: WorkerMessageWithSender<WorkerWakeUpMessage>) => {
            const { sender: endpoint, payload } = message;
            const { tabId } = payload;
            const { status } = await ctx.init({});

            /* dispatch a wakeup action for this specific receiver.
             * tracking the wakeup's request metadata can be consumed
             * in the UI to infer wakeup result - see `wakeup.saga.ts`
             * no need for any redux operations on content-script wakeup
             * as it doesn't hold any store. */
            if (message.sender === 'popup' || message.sender === 'page') {
                store.dispatch(wakeup({ status }, endpoint, tabId));
            }

            if (message.sender === 'popup') {
                WorkerMessageBroker.buffer.flush().forEach((notification) => {
                    WorkerMessageBroker.ports
                        .query(isPopupPort(tabId))
                        .forEach((port) => port.postMessage(notification));
                });
            }

            return { ...ctx.getState(), settings: await ctx.service.settings.resolve() };
        }
    );

    const handleWorkerInit = withContext(async (ctx, message: WorkerMessageWithSender<WorkerInitMessage>) =>
        (await ctx.init({ sync: message.payload.sync })).getState()
    );

    const handlePopupInit = withContext<MessageHandlerCallback<WorkerMessageType.POPUP_INIT>>(async (ctx, message) => {
        const { payload } = message;
        const { tabId } = payload;

        /* dispatch a wakeup action for this specific receiver.
         * tracking the wakeup's request metadata can be consumed
         * in the UI to infer wakeup result - see `wakeup.saga.ts` */
        const tab = await browser.tabs.get(tabId);
        const parsedUrl = parseUrl(tab.url ?? '');
        const { subdomain, domain } = parsedUrl;
        const items = ctx.service.autofill.getAutofillCandidates(parsedUrl);
        const hasAutofillCandidates = items.length > 0;

        const tabState = selectPopupTabState(tabId)(store.getState());
        const filters = selectPopupFilters(store.getState());
        const pushTabState = tabState !== undefined && [subdomain, domain].includes(tabState.domain);
        const searchForAutofill = hasAutofillCandidates && domain ? domain : '';

        return {
            search: pushTabState ? tabState!.search : searchForAutofill,
            draft: selectItemDraft(store.getState()),
            selectedItem: pushTabState ? tabState!.selectedItem : null,
            filters: filters,
        };
    });

    /* throttle update checks for updates every hour */
    browser.alarms.create(UPDATE_ALARM_NAME, { periodInMinutes: 60 });
    browser.alarms.onAlarm.addListener(({ name }) => name === UPDATE_ALARM_NAME && checkAvailableUpdate());
    browser.permissions.onAdded.addListener(checkPermissionsUpdate);
    browser.permissions.onRemoved.addListener(checkPermissionsUpdate);

    WorkerMessageBroker.registerMessage(WorkerMessageType.WORKER_WAKEUP, handleWakeup);
    WorkerMessageBroker.registerMessage(WorkerMessageType.WORKER_INIT, handleWorkerInit);
    WorkerMessageBroker.registerMessage(WorkerMessageType.POPUP_INIT, handlePopupInit);
    WorkerMessageBroker.registerMessage(WorkerMessageType.RESOLVE_TAB, (_, { tab }) => ({ tab }));
    WorkerMessageBroker.registerMessage(WorkerMessageType.ACCOUNT_PROBE, () => true);

    if (ENV === 'development') {
        /* there is no way to test the update sequence locally without
         * creating a custom `update_url` server. In dev mode, trigger
         * the `handleOnUpdateAvailable` callback from the settings */
        WorkerMessageBroker.registerMessage(WorkerMessageType.UPDATE_AVAILABLE, () => {
            handleOnUpdateAvailable({ version: browser.runtime.getManifest().version });
            return true;
        });
    }

    void checkAvailableUpdate();
    void checkPermissionsUpdate();

    return {
        boot: handleBoot,
        onInstall: handleInstall,
        onStartup: handleStartup,
        onUpdateAvailable: handleOnUpdateAvailable,
        getAvailableUpdate: () => state.updateAvailable,
        getPermissionsGranted: () => state.permissionsGranted,
    };
};

export type ActivationService = ReturnType<typeof createActivationService>;
