import config from 'proton-pass-extension/app/config';
import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { EXTENSION_KEY } from 'proton-pass-extension/app/worker/constants';
import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import type { MessageHandlerCallback } from 'proton-pass-extension/lib/message/message-broker';
import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import { resolveEndpointContext } from 'proton-pass-extension/lib/utils/endpoint';
import { hasHostPermissions } from 'proton-pass-extension/lib/utils/permissions';
import { isPopupPort } from 'proton-pass-extension/lib/utils/port';
import { isVivaldiBrowser } from 'proton-pass-extension/lib/utils/vivaldi';
import type { ClientInitMessage, WorkerMessageWithSender } from 'proton-pass-extension/types/messages';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';
import type { Runtime } from 'webextension-polyfill';

import { MIN_CACHE_VERSION, RUNTIME_RELOAD_THROTTLE } from '@proton/pass/constants';
import { api } from '@proton/pass/lib/api/api';
import { requestFork } from '@proton/pass/lib/auth/fork';
import type { AuthSession } from '@proton/pass/lib/auth/session';
import { clientCanBoot, clientErrored, clientPasswordLocked, clientStale } from '@proton/pass/lib/client';
import browser from '@proton/pass/lib/globals/browser';
import { sanitizeSettings } from '@proton/pass/lib/settings/utils';
import { bootIntent, clientInit } from '@proton/pass/store/actions/creators/client';
import { selectFilters, selectTabState } from '@proton/pass/store/selectors/filters';
import { selectItem } from '@proton/pass/store/selectors/items';
import type { MaybeNull } from '@proton/pass/types/utils/index';
import { AppStatus } from '@proton/pass/types/worker/state';
import { first } from '@proton/pass/utils/array/first';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import { safeAsyncCall } from '@proton/pass/utils/fp/safe-call';
import { logger } from '@proton/pass/utils/logger';
import { semver } from '@proton/pass/utils/string/semver';
import { UNIX_HOUR } from '@proton/pass/utils/time/constants';
import { getEpoch, msToEpoch } from '@proton/pass/utils/time/epoch';
import { parseUrl } from '@proton/pass/utils/url/parser';
import { intoDomainWithPort } from '@proton/pass/utils/url/utils';
import { ForkType } from '@proton/shared/lib/authentication/fork/constants';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { getAutoResumeDelay } from './auth/auth.alarms';
import { shouldForceLock } from './auth/auth.utils';

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
            if (!alarmRegistered) void browser.alarms.create(UPDATE_ALARM_NAME, { periodInMinutes: 60 });
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

            void ctx.service.injection.updateScripts();
            ctx.service.spotlight.onUpdate();

            return ctx.service.auth.init({ forceLock: await shouldForceLock(), retryable: true });
        }

        /** NOTE: Safari might trigger the `install` event when clearing the
         * browser cookies/history on the next service-worker reload */
        if (details.reason === 'install') {
            const hasSession = (await ctx.service.storage.local.getItem('ps')) !== null;

            /** Run updateScripts() before opening the onboarding tab to prevent a harmless console error
             * due to race condition. On fresh extension install, chrome.runtime.id may be undefined,
             * so injecting client.js in the onboarding tab would cause webextension-polyfill to throw. */
            await ctx.service.injection.updateScripts();

            if (!hasSession) {
                const fork = (forkType: ForkType) =>
                    requestFork({
                        host: config.SSO_URL,
                        app: APPS.PROTONPASSBROWSEREXTENSION,
                        forkType,
                        plan: BUILD_TARGET === 'safari' && forkType === ForkType.SIGNUP ? 'free' : undefined,
                    });

                /* Extract URL parameters of fork
                 * (without the hostname which will be built later for security) */
                const loginParams = new URL(fork(ForkType.LOGIN).url).searchParams.toString();
                const signupParams = new URL(fork(ForkType.SIGNUP).url).searchParams.toString();

                const searchParams = new URLSearchParams();
                searchParams.append('loginParams', loginParams);
                searchParams.append('signupParams', signupParams);

                const url = `${config.SSO_URL}${SSO_PATHS.PASS_EXTENSION_ONBOARDING}?${searchParams.toString()}`;

                await browser.tabs.create({ url }).catch(noop);
                void ctx.service.settings.onInstall();
                void ctx.service.spotlight.onInstall();
            }
        }
    });

    /** Checks host permissions required for Pass to function properly.
     * Broadcasts permission status to all connected clients via PERMISSIONS_UPDATE. */
    const checkPermissionsUpdate = async () => {
        state.permissionsGranted = await hasHostPermissions();
        if (!state.permissionsGranted) logger.info(`[Activation] missing permissions`);

        WorkerMessageBroker.ports.broadcast(
            backgroundMessage({
                type: WorkerMessageType.PERMISSIONS_UPDATE,
                payload: { granted: state.permissionsGranted },
            })
        );
    };

    /* Vivaldi browser does not support setting the extension badge text
     * color and does not infer it correctly through background color.
     * On vivaldi, fallback to the default badge theme */
    const setupExtensionBadge = safeAsyncCall(async () => {
        if (!(await isVivaldiBrowser())) browser.action.setBadgeBackgroundColor({ color: '#FFFFFF' }).catch(noop);
    });

    /* When waking up from the pop-up (or page) we need to trigger the background wakeup
     * saga while immediately resolving the worker state so the UI can respond to state
     * changes as soon as possible. Regarding the content-script, we simply wait for a
     * ready state as its less "critical" */
    const handleClientInit = withContext<MessageHandlerCallback<WorkerMessageType.CLIENT_INIT>>(
        async (ctx, message: WorkerMessageWithSender<ClientInitMessage>) => {
            const { sender: endpoint, payload } = message;
            const { tabId } = payload;
            const { status } = ctx.getState();
            const clientApp = message.sender === 'popup' || message.sender === 'page';

            /* Resume the session immediately if the worker is stale/idle or if the wakeup request
             * originated from the popup. For wake-up calls from other extension endpoints (e.g.,
             * content-script), determine based on the current session resuming state. If an ongoing
             * alarm exists or if we haven't reached the next session resume delay, take no action */
            const shouldResume = await (async (): Promise<boolean> => {
                if (clientStale(status)) return true;

                if (clientPasswordLocked(status)) {
                    if (endpoint === 'popup') {
                        return ctx.service.connectivity.online;
                    }
                }

                if (clientErrored(status)) {
                    if (endpoint === 'popup') return true;

                    /* Non-popup clients (content-scripts, settings page, etc.) should not trigger
                     * concurrent resume attempts. We check if an alarm is already  managing the
                     * retry schedule - if so, defer to it. Even without an alarm, we respect the
                     * backoff delay based on `lastCalledAt` to prevent hammering the resume logic. */
                    const alarmTime = await ctx.service.auth.alarms.autoResumeAlarm.when();

                    if (alarmTime !== undefined) {
                        const delay = msToEpoch(alarmTime) - getEpoch();
                        logger.info(`[Activation] Automatic session resume scheduled in ${delay}s`);
                        return false;
                    }

                    const { lastCalledAt, callCount } = ctx.service.auth.resumeSession;
                    const nextResumeTime = (lastCalledAt ?? 0) + getAutoResumeDelay(callCount);
                    const delay = nextResumeTime - getEpoch();

                    if (delay > 0) {
                        logger.info(`[Activation] Automatic session resume stalled for ${delay}s`);
                        return false;
                    }

                    return true;
                }

                return false;
            })();

            if (shouldResume) void ctx.service.auth.init({ forceLock: await shouldForceLock(), retryable: false });

            /** Dispatch a wakeup action for client app receivers. Tracking the wakeup's request metadata
             * can be consumed in the UI to infer wakeup result - see `wakeup.saga.ts` no need for any redux
             * operations on content-script wakeup as it doesn't hold any state. */
            if (clientApp) await ctx.service.store.dispatchAsyncRequest(clientInit, { status, endpoint, tabId });

            if (message.sender === 'popup') {
                WorkerMessageBroker.buffer.flush().forEach((notification) => {
                    WorkerMessageBroker.ports
                        .query((name) => isPopupPort(name, tabId))
                        .forEach((port) => port.postMessage(notification));
                });
            }

            const resolved = await ctx.service.settings.resolve();
            const settings = sanitizeSettings(resolved, ctx.service.store.getState());
            // Note: in the future we can modify this to add featureFlags variants in the extension content script
            const { features } = await ctx.service.featureFlags.resolve();
            const connectivity = ctx.service.connectivity.getStatus();
            const session: Partial<AuthSession> = clientApp ? ctx.service.auth.config.authStore.getSession() : {};

            return { state: ctx.getState(), features, settings, connectivity, session };
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

    const handleEndpointInit: MessageHandlerCallback<WorkerMessageType.ENDPOINT_INIT> = async (
        { payload },
        { tab, frameId = -1 }
    ) => {
        if (payload.popup) {
            /** POPUP specific: the popup uses the same ENDPOINT_INIT sequence to setup its
             * ExtensionContext. In this instance, the `tabUrl` and `frameUrl` will always
             * refer to the underlying active tab below the popup. In the popup, this will
             * be used for hydrating the initial filters and default URL on item creation. */
            const current = first(await browser.tabs.query({ active: true, currentWindow: true }));
            if (!(current && current?.id)) throw new Error('No active tabs');
            const tabUrl = parseUrl(current.url);
            const senderTabId = tab?.id ?? 0; /** NOTE: on firefox, popup does not have a tab */
            return { tabId: current.id, frameUrl: tabUrl, tabUrl, senderTabId, frameId };
        }

        return resolveEndpointContext(tab, frameId);
    };

    browser.permissions.onAdded.addListener(checkPermissionsUpdate);
    browser.permissions.onRemoved.addListener(checkPermissionsUpdate);
    browser.alarms.onAlarm.addListener(({ name }) => name === UPDATE_ALARM_NAME && checkAvailableUpdate());

    WorkerMessageBroker.registerMessage(WorkerMessageType.CLIENT_INIT, handleClientInit);
    WorkerMessageBroker.registerMessage(WorkerMessageType.POPUP_INIT, handlePopupInit);
    WorkerMessageBroker.registerMessage(WorkerMessageType.ENDPOINT_INIT, handleEndpointInit);
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
