import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { EXTENSION_KEY } from 'proton-pass-extension/app/worker/constants';
import { withContext } from 'proton-pass-extension/app/worker/context';
import store from 'proton-pass-extension/app/worker/store';
import { checkExtensionPermissions } from 'proton-pass-extension/lib/utils/permissions';
import { isPopupPort } from 'proton-pass-extension/lib/utils/port';
import { isVivaldiBrowser } from 'proton-pass-extension/lib/utils/vivaldi';
import { type Runtime } from 'webextension-polyfill';

import { MIN_CACHE_VERSION } from '@proton/pass/constants';
import { api } from '@proton/pass/lib/api/api';
import { clientCanBoot, clientErrored, clientStale } from '@proton/pass/lib/client';
import type { MessageHandlerCallback } from '@proton/pass/lib/extension/message';
import { backgroundMessage } from '@proton/pass/lib/extension/message';
import browser from '@proton/pass/lib/globals/browser';
import { bootIntent, wakeupIntent } from '@proton/pass/store/actions';
import { selectFeatureFlags, selectItem, selectPopupFilters, selectPopupTabState } from '@proton/pass/store/selectors';
import type { MaybeNull, WorkerMessageWithSender, WorkerWakeUpMessage } from '@proton/pass/types';
import { AppStatus, WorkerMessageType } from '@proton/pass/types';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import { semver } from '@proton/pass/utils/string/semver';
import { UNIX_HOUR } from '@proton/pass/utils/time/constants';
import { getEpoch, msToEpoch } from '@proton/pass/utils/time/epoch';
import { parseUrl } from '@proton/pass/utils/url/parser';

import { getSessionResumeAlarm, getSessionResumeDelay, shouldForceLock } from './auth';

type ActivationServiceState = {
    updateAvailable: MaybeNull<string>;
    checkedUpdateAt: number;
    permissionsGranted: boolean;
};

export const RUNTIME_RELOAD_THROTTLE = 10; /* seconds */
const UPDATE_ALARM_NAME = 'PassUpdateAlarm';

export const createActivationService = () => {
    const state: ActivationServiceState = { updateAvailable: null, checkedUpdateAt: 0, permissionsGranted: false };

    /* Safety-net around worker boot-sequence :
     * Ensures no on-going booting sequence */
    const handleBoot = withContext((ctx) => {
        if (clientCanBoot(ctx.status)) {
            ctx.setStatus(AppStatus.BOOTING);
            store.dispatch(bootIntent());
        }
    });

    const checkAvailableUpdate = async (): Promise<boolean> => {
        const now = getEpoch();

        try {
            if (now - state.checkedUpdateAt > UNIX_HOUR) {
                const [updateStatus] = await browser.runtime.requestUpdateCheck();

                if (updateStatus === 'update_available') {
                    logger.info('[Activation] update detected');
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

    /* throttle update checks for updates every hour */
    const handleActivation = async () => {
        try {
            logger.info('[Activation] activating worker [alarms cleared - checking for update]');
            await browser.alarms.clearAll();
            const alarmRegistered = await browser.alarms.get(UPDATE_ALARM_NAME);
            if (!alarmRegistered) browser.alarms.create(UPDATE_ALARM_NAME, { periodInMinutes: 60 });
        } catch {}
    };

    /* Try recovering the session when browser starts up
     * if any session was locally persisted
     * if not in production - use sync.html session to workaround the
     * the SSL handshake (net:ERR_SSL_CLIENT_AUTH_CERT_NEEDED) */
    const handleStartup = withContext(async (ctx) => {
        await handleActivation();

        /* set `forceLock` flag for subsequent authentication inits to
         * account for startup artifically force locking the session */
        await ctx.service.storage.local.setItem('forceLock', true);
        const loggedIn = await ctx.service.auth.init({ forceLock: true, retryable: true });

        if (ENV === 'development' && RESUME_FALLBACK) {
            if (!loggedIn) {
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
        await handleActivation();

        if (details.reason === 'update') {
            const previous = await ctx.service.storage.local.getItem('version');
            logger.info(`[Activation] update [before=${previous},after=${VERSION}]`);

            /* clear the cache if the previous cache version does not match
             * this build's minimum cache version validity. FIXME: use migrations */
            if (!previous || semver(previous) < semver(MIN_CACHE_VERSION)) {
                logger.info(`[Activation] update requires cache clear [before=${previous},min=${MIN_CACHE_VERSION}]`);
                await ctx.service.storage.local.removeItems(['salt', 'state', 'snapshot']);
            }

            void ctx.service.injection.updateInjections();
            ctx.service.onboarding.onUpdate();

            return ctx.service.auth.init({ forceLock: await shouldForceLock(), retryable: true });
        }

        if (details.reason === 'install') {
            try {
                await Promise.all([ctx.service.storage.local.clear(), ctx.service.storage.session.clear()]);
                const url = browser.runtime.getURL('/onboarding.html#/success');
                await browser.tabs.create({ url });
            } catch (error: any) {
                logger.warn(`[Activation] requesting fork failed: ${getErrorMessage(error)}`);
            }

            void ctx.service.settings.onInstall();
            void ctx.service.onboarding.onInstall();
            void ctx.service.injection.updateInjections();
        }
    });

    const checkPermissionsUpdate = async () => {
        state.permissionsGranted = await checkExtensionPermissions();
        if (!state.permissionsGranted) logger.info(`[Activation] missing permissions`);

        WorkerMessageBroker.ports.broadcast(
            backgroundMessage({
                type: WorkerMessageType.PERMISSIONS_UPDATE,
                payload: { check: state.permissionsGranted },
            })
        );
    };

    /* Vivaldi browser does not support setting the extension badge text
     * color and does not infer it correctly through background color.
     * On vivaldi, fallback to the default badge theme */
    const setupExtensionBadge = async () => {
        if (!(await isVivaldiBrowser())) {
            return browser.action.setBadgeBackgroundColor({ color: '#FFFFFF' });
        }
    };

    /* When waking up from the pop-up (or page) we need to trigger the background wakeup
     * saga while immediately resolving the worker state so the UI can respond to state
     * changes as soon as possible. Regarding the content-script, we simply wait for a
     * ready state as its less "critical" */
    const handleWakeup = withContext<MessageHandlerCallback<WorkerMessageType.WORKER_WAKEUP>>(
        async (ctx, message: WorkerMessageWithSender<WorkerWakeUpMessage>) => {
            const { sender: endpoint, payload } = message;
            const { tabId } = payload;
            const { status } = ctx.getState();

            /* Resume the session immediately if the worker is stale/idle or if the wakeup request
             * originated from the popup. For wake-up calls from other extension endpoints (e.g.,
             * content-script), determine based on the current session resuming state. If an ongoing
             * alarm exists or if we haven't reached the next session resume delay, take no action */
            const shouldResume = await (async (): Promise<boolean> => {
                if (clientStale(status)) return true;

                if (clientErrored(status)) {
                    if (endpoint === 'popup') return true;
                    else {
                        const { lastCalledAt, callCount } = ctx.service.auth.resumeSession;
                        const nextDelay = getSessionResumeDelay(callCount);
                        const resumeAlarm = await getSessionResumeAlarm();

                        const scheduledTime = resumeAlarm
                            ? msToEpoch(resumeAlarm.scheduledTime)
                            : (lastCalledAt ?? 0) + nextDelay;

                        const delay = scheduledTime - getEpoch();
                        if (!resumeAlarm && delay <= 0) return true;

                        logger.info(`[Activation] Automatic session resume stalled for ${delay}s`);
                    }
                }

                return false;
            })();

            if (shouldResume) void ctx.service.auth.init({ forceLock: await shouldForceLock(), retryable: false });

            /* dispatch a wakeup action for this specific receiver.
             * tracking the wakeup's request metadata can be consumed
             * in the UI to infer wakeup result - see `wakeup.saga.ts`
             * no need for any redux operations on content-script wakeup
             * as it doesn't hold any store. */
            if (message.sender === 'popup' || message.sender === 'page') {
                store.dispatch(wakeupIntent({ status }, { endpoint, tabId }));
            }

            if (message.sender === 'popup') {
                WorkerMessageBroker.buffer.flush().forEach((notification) => {
                    WorkerMessageBroker.ports
                        .query(isPopupPort(tabId))
                        .forEach((port) => port.postMessage(notification));
                });
            }

            return {
                state: ctx.getState(),
                features: selectFeatureFlags(store.getState()) ?? {},
                settings: await ctx.service.settings.resolve(),
            };
        }
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
        const items = ctx.service.autofill.getLoginCandidates(parsedUrl);
        const hasAutofillCandidates = items.length > 0;

        const state = store.getState();
        const tabState = selectPopupTabState(tabId)(state);
        const filters = selectPopupFilters(state);
        const pushTabState = tabState !== undefined && [subdomain, domain].includes(tabState.domain);
        const searchForAutofill = hasAutofillCandidates && domain ? domain : '';

        const validItem = tabState?.selectedItem
            ? selectItem(tabState.selectedItem.shareId, tabState.selectedItem.itemId) !== undefined
            : false;

        return {
            search: pushTabState ? tabState!.search : searchForAutofill,
            selectedItem: pushTabState && validItem ? tabState!.selectedItem : null,
            filters,
        };
    });

    /** Chromium browsers apply some heuristics to detect suspicious runtime reloading.
     * Ensure Pass never reloads the runtime suspiciously to avoid being disabled.
     * see: https://source.chromium.org/chromium/chromium/src/+/main:chrome/browser/extensions/api/runtime/chrome_runtime_api_delegate.cc;l=54 */
    const reload = asyncLock(
        withContext<() => Promise<boolean>>(async (ctx) => {
            const now = getEpoch();
            const lastReload = (await ctx.service.storage.local.getItem('lastReload')) ?? 0;
            if (lastReload + RUNTIME_RELOAD_THROTTLE > now) return false;

            await api.idle(); /* wait for API idle before reloading in case a refresh was ongoing */
            await ctx.service.storage.local.setItem('lastReload', now);
            browser.runtime.reload();
            return true;
        })
    );

    const handleOnUpdateAvailable = (details: Runtime.OnUpdateAvailableDetailsType) => {
        if (details.version) {
            logger.info(`[Activation] update available ${details.version}`);
            state.updateAvailable = details.version;

            const popupPorts = WorkerMessageBroker.ports.query(isPopupPort());
            /* on available update : only reload the runtime to force the
             * the extension update if the popup is not opened to avoid
             * discarding any ongoing user operations*/
            if (popupPorts.length === 0) return reload();

            /* if we have ports opened to a popup : notify them in order
             * to manually prompt the user for a runtime reload */
            logger.info(`[Activation] update deferred because popup is active`);
            popupPorts.forEach((port) =>
                port.postMessage(
                    backgroundMessage({
                        type: WorkerMessageType.UPDATE_AVAILABLE,
                    })
                )
            );
        }
    };

    browser.permissions.onAdded.addListener(checkPermissionsUpdate);
    browser.permissions.onRemoved.addListener(checkPermissionsUpdate);
    browser.alarms.onAlarm.addListener(({ name }) => name === UPDATE_ALARM_NAME && checkAvailableUpdate());

    WorkerMessageBroker.registerMessage(WorkerMessageType.WORKER_WAKEUP, handleWakeup);
    WorkerMessageBroker.registerMessage(WorkerMessageType.POPUP_INIT, handlePopupInit);
    WorkerMessageBroker.registerMessage(WorkerMessageType.RESOLVE_TAB, (_, { tab }) => ({ tab }));
    WorkerMessageBroker.registerMessage(WorkerMessageType.WORKER_RELOAD, reload);
    WorkerMessageBroker.registerMessage(WorkerMessageType.PING, () => Promise.resolve(true));
    WorkerMessageBroker.registerMessage(WorkerMessageType.RESOLVE_EXTENSION_KEY, () => ({ key: EXTENSION_KEY }));

    void checkAvailableUpdate();
    void checkPermissionsUpdate();
    void setupExtensionBadge();

    return {
        boot: handleBoot,
        onInstall: handleInstall,
        onStartup: handleStartup,
        onUpdateAvailable: handleOnUpdateAvailable,
        getAvailableUpdate: () => state.updateAvailable,
        getPermissionsGranted: () => state.permissionsGranted,
        reload,
    };
};

export type ActivationService = ReturnType<typeof createActivationService>;
