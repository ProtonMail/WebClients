import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { EXTENSION_KEY } from 'proton-pass-extension/app/worker/constants';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import type { MessageHandlerCallback } from 'proton-pass-extension/lib/message/message-broker';
import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import { checkExtensionPermissions } from 'proton-pass-extension/lib/utils/permissions';
import { isPopupPort } from 'proton-pass-extension/lib/utils/port';
import { isVivaldiBrowser } from 'proton-pass-extension/lib/utils/vivaldi';
import type { ClientInitMessage, WorkerMessageWithSender } from 'proton-pass-extension/types/messages';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import { type Runtime } from 'webextension-polyfill';

import { MIN_CACHE_VERSION, RUNTIME_RELOAD_THROTTLE } from '@proton/pass/constants';
import { api } from '@proton/pass/lib/api/api';
import { clientCanBoot, clientErrored, clientStale } from '@proton/pass/lib/client';
import browser from '@proton/pass/lib/globals/browser';
import { sanitizeSettings } from '@proton/pass/lib/settings/utils';
import { bootIntent, clientInit } from '@proton/pass/store/actions';
import {
    selectCanCreateItems,
    selectFeatureFlags,
    selectFilters,
    selectItem,
    selectTabState,
} from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { AppStatus } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import { semver } from '@proton/pass/utils/string/semver';
import { UNIX_HOUR } from '@proton/pass/utils/time/constants';
import { getEpoch, msToEpoch } from '@proton/pass/utils/time/epoch';
import { parseUrl } from '@proton/pass/utils/url/parser';
import { intoDomainWithPort } from '@proton/pass/utils/url/utils';
import noop from '@proton/utils/noop';

import { getSessionResumeAlarm, getSessionResumeDelay, shouldForceLock } from './auth';

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
        if (clientCanBoot(ctx.status)) {
            ctx.setStatus(AppStatus.BOOTING);
            ctx.service.store.dispatch(bootIntent());
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
            ctx.service.spotlight.onUpdate();

            return ctx.service.auth.init({ forceLock: await shouldForceLock(), retryable: true });
        }

        /** NOTE: Safari might trigger the `install` event when clearing the
         * browser cookies/history on the next service-worker reload */
        if (details.reason === 'install') {
            const hasSession = (await ctx.service.storage.local.getItem('ps')) !== null;

            if (!hasSession) {
                const url = browser.runtime.getURL('/onboarding.html#/success');
                await browser.tabs.create({ url }).catch(noop);
                void ctx.service.settings.onInstall();
                void ctx.service.spotlight.onInstall();
            }

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
    const handleClientInit = withContext<MessageHandlerCallback<WorkerMessageType.CLIENT_INIT>>(
        async (ctx, message: WorkerMessageWithSender<ClientInitMessage>) => {
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
             * as it doesn't hold any state. */
            if (message.sender === 'popup' || message.sender === 'page') {
                await ctx.service.store.dispatchAsyncRequest(clientInit, {
                    status,
                    endpoint,
                    tabId,
                });
            }

            if (message.sender === 'popup') {
                WorkerMessageBroker.buffer.flush().forEach((notification) => {
                    WorkerMessageBroker.ports
                        .query((name) => isPopupPort(name, tabId))
                        .forEach((port) => port.postMessage(notification));
                });
            }

            const state = ctx.service.store.getState();
            const canCreateItems = selectCanCreateItems(state);
            const settings = await ctx.service.settings.resolve();

            return {
                state: ctx.getState(),
                features: selectFeatureFlags(state) ?? {},
                settings: sanitizeSettings(settings, { canCreateItems }),
            };
        }
    );

    const handlePopupInit = withContext<MessageHandlerCallback<WorkerMessageType.POPUP_INIT>>(async (ctx, message) => {
        const { payload } = message;
        const { tabId } = payload;

        /* dispatch a wakeup action for this specific receiver.
         * tracking the wakeup's request metadata can be consumed
         * in the UI to infer wakeup result - see `wakeup.saga.ts` */
        const tab = await browser.tabs.get(tabId).catch(noop);
        const url = tab?.url ?? '';
        const parsedUrl = parseUrl(url);
        const { subdomain, domain, port, protocol } = parsedUrl;
        const items = ctx.service.autofill.getLoginCandidates({ url });
        const hasAutofillCandidates = items.length > 0;

        const state = ctx.service.store.getState();
        const tabState = selectTabState(tabId)(state);
        const filters = selectFilters(state);
        const pushTabState = tabState !== undefined && [subdomain, domain].includes(tabState.domain);
        const searchForAutofill =
            hasAutofillCandidates && domain ? (intoDomainWithPort({ domain, port, protocol, as: 'host' }) ?? '') : '';

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

            const popupPorts = WorkerMessageBroker.ports.query(isPopupPort);
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

    /** If the `current` flag is passed : resolve the active tab for the
     * current window (ie when requesting the active tab for the popup).
     * Else parse the sender data (ie: content-script) */
    const handleResolveTab: MessageHandlerCallback<WorkerMessageType.TABS_QUERY> = async ({ payload }, sender) => {
        if (payload.current) {
            const tab = first(await browser.tabs.query({ active: true, currentWindow: true }));
            if (!(tab && tab?.id)) throw new Error('No active tabs');
            return { tabId: tab.id, url: parseUrl(tab.url), senderTabId: sender.tab?.id };
        }

        if (!sender.tab?.id) throw new Error('Invalid sender tab');
        return { tabId: sender.tab.id, url: parseUrl(sender.tab.url), senderTabId: sender.tab.id };
    };

    browser.permissions.onAdded.addListener(checkPermissionsUpdate);
    browser.permissions.onRemoved.addListener(checkPermissionsUpdate);
    browser.alarms.onAlarm.addListener(({ name }) => name === UPDATE_ALARM_NAME && checkAvailableUpdate());

    WorkerMessageBroker.registerMessage(WorkerMessageType.CLIENT_INIT, handleClientInit);
    WorkerMessageBroker.registerMessage(WorkerMessageType.POPUP_INIT, handlePopupInit);
    WorkerMessageBroker.registerMessage(WorkerMessageType.TABS_QUERY, handleResolveTab);
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
