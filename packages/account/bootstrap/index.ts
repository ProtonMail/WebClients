import { createBrowserHistory } from 'history';
import { History } from 'history';
import { EVENTS, UnleashClient } from 'unleash-proxy-client';

import { getCryptoWorkerOptions } from '@proton/components/containers/app/cryptoWorkerOptions';
import { wrapUnloadError } from '@proton/components/containers/app/errorRefresh';
import { getSessionTrackingEnabled } from '@proton/components/containers/app/helper';
import { createCustomFetch, getUnleashConfig } from '@proton/components/containers/unleash/UnleashFlagProvider';
import { handleEarlyAccessDesynchronization } from '@proton/components/helpers/earlyAccessDesynchronization';
import type { Feature } from '@proton/features';
import metrics from '@proton/metrics';
import { ApiWithListener } from '@proton/shared/lib/api/createApi';
import { getEvents, getLatestID } from '@proton/shared/lib/api/events';
import { getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { appLink } from '@proton/shared/lib/apps/appLink';
import { getPublicUserProtonAddressApps, getSSOVPNOnlyAccountApps } from '@proton/shared/lib/apps/apps';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { requiresNonDelinquent } from '@proton/shared/lib/authentication/apps';
import createAuthenticationStore, {
    AuthenticationStore,
    getSafePath,
} from '@proton/shared/lib/authentication/createAuthenticationStore';
import createSecureSessionStorage from '@proton/shared/lib/authentication/createSecureSessionStorage';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import { handleInvalidSession } from '@proton/shared/lib/authentication/logout';
import { getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { ResumedSessionResult, resumeSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import {
    consumeFork,
    getConsumeForkParameters,
    removeHashParameters,
} from '@proton/shared/lib/authentication/sessionForking';
import { newVersionUpdater } from '@proton/shared/lib/busy';
import { getProdId, setVcalProdId } from '@proton/shared/lib/calendar/vcalConfig';
import { APPS, APP_NAMES, SETUP_ADDRESS_PATH, SSO_PATHS } from '@proton/shared/lib/constants';
import { resumeSessionDrawerApp } from '@proton/shared/lib/drawer/session';
import createEventManager from '@proton/shared/lib/eventManager/eventManager';
import { getCookie } from '@proton/shared/lib/helpers/cookies';
import { setMetricsEnabled } from '@proton/shared/lib/helpers/metrics';
import sentry, { setSentryEnabled, setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';
import { loadCryptoWorker } from '@proton/shared/lib/helpers/setupCryptoWorker';
import { getBrowserLocale, getClosestLocaleCode, getClosestLocaleMatch } from '@proton/shared/lib/i18n/helper';
import { loadDateLocale, loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';
import { Api, Environment, ProtonConfig, User, UserSettings } from '@proton/shared/lib/interfaces';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import {
    getIsPublicUserWithoutProtonAddress,
    getIsSSOVPNOnlyAccount,
    getRequiresAddressSetup,
} from '@proton/shared/lib/keys';
import { getHasNonDelinquentScope } from '@proton/shared/lib/user/helpers';
import noop from '@proton/utils/noop';

export * from './action';

class InvalidSessionError extends Error {
    public localID: number | undefined;

    constructor(message: string, localID: number | undefined) {
        super(['Invalid session', message].filter(Boolean).join(':'));
        this.localID = localID;
        Object.setPrototypeOf(this, InvalidSessionError.prototype);
    }
}

export const maybeConsumeFork = async ({ api, mode }: Pick<Parameters<typeof consumeFork>[0], 'api' | 'mode'>) => {
    const { state, selector, key, persistent, trusted, payloadVersion } = getConsumeForkParameters();
    if (!state && !selector && !key) {
        return null;
    }
    if (!state || !selector || !key) {
        return null;
    }
    try {
        const result = await consumeFork({ selector, api, state, key, persistent, trusted, payloadVersion, mode });
        return result;
    } catch (e: any) {
        removeHashParameters();
        throw e;
    }
};

const handleUID = (UID: string | undefined) => {
    setSentryUID(UID);
    metrics.setAuthHeaders(UID || '');
};

export const createAuthentication = (args?: Partial<Parameters<typeof createAuthenticationStore>[0]>) => {
    return createAuthenticationStore({
        store: createSecureSessionStorage(),
        onUID: handleUID,
        ...args,
    });
};

export const removeLoaderClassName = () => {
    document.querySelector('.app-root-loader')?.classList.add('hidden');
};

export const init = ({
    config,
    authentication,
    locales,
}: {
    config: ProtonConfig;
    authentication: AuthenticationStore;
    locales: TtagLocaleMap;
}) => {
    metrics.setVersionHeaders(getClientID(config.APP_NAME), config.APP_VERSION);
    if (!authentication.UID) {
        setMetricsEnabled(true);
    }
    setTtagLocales(locales);
    newVersionUpdater(config);
    sentry({ config, UID: authentication.UID, sessionTracking: getSessionTrackingEnabled() });
    setVcalProdId(getProdId(config));
    removeLoaderClassName();
};

export const loadSession = async ({
    authentication,
    api,
    pathname,
}: {
    pathname: string;
    authentication: AuthenticationStore;
    api: ApiWithListener;
}): Promise<{
    type: 'ok';
    payload: Partial<ResumedSessionResult & { path: string; basename: string }>;
}> => {
    if (authentication.ready) {
        api.UID = authentication.UID;

        return {
            type: 'ok' as const,
            payload: {
                basename: authentication.basename,
            },
        };
    }

    const localID = getLocalIDFromPathname(pathname);

    api.UID = undefined;

    try {
        if (localID === undefined) {
            if (pathname.startsWith(SSO_PATHS.FORK)) {
                const result = await maybeConsumeFork({ api, mode: authentication.mode });
                if (result) {
                    authentication.login(result);
                    api.UID = authentication.UID;

                    return {
                        type: 'ok' as const,
                        payload: { ...result, basename: authentication.basename },
                    };
                }
            }
            throw new InvalidSessionError('Missing localID', undefined);
        }

        const result = await resumeSession(api, localID);
        authentication.login(result);
        api.UID = authentication.UID;

        return {
            type: 'ok' as const,
            payload: { ...result, basename: authentication.basename, path: undefined },
        };
    } catch (e: any) {
        if (e instanceof InvalidPersistentSessionError || getIs401Error(e)) {
            throw new InvalidSessionError('Missing localID', localID);
        }
        throw e;
    }
};

export const loadDrawerSession = async ({
    parentApp,
    authentication,
    api,
    pathname,
}: {
    pathname: string;
    parentApp: APP_NAMES;
    authentication: AuthenticationStore;
    api: ApiWithListener;
}): Promise<
    | {
          type: 'ok';
          payload: Partial<ResumedSessionResult & { path: string; basename: string }>;
      }
    | undefined
> => {
    if (authentication.ready) {
        return {
            type: 'ok' as const,
            payload: {},
        };
    }

    const localID = getLocalIDFromPathname(pathname);

    try {
        if (localID === undefined) {
            throw new Error('Missing local id');
        }
        const result = await resumeSessionDrawerApp({ parentApp, localID });
        authentication.login(result);
        api.UID = authentication.UID;

        return {
            type: 'ok' as const,
            payload: { ...result, basename: authentication.basename, path: undefined },
        };
    } catch (error) {
        return undefined;
    }
};

export const createHistory = ({ basename, path }: Partial<{ basename: string; path: string }>) => {
    const history = createBrowserHistory({ basename });
    if (path) {
        history.push(getSafePath(path));
    }
    return history;
};

export const createUnleash = ({ api }: { api: Api }) => {
    return new UnleashClient(getUnleashConfig({ fetch: createCustomFetch(api) }));
};

export const onAbort = (signal: AbortSignal | undefined, cb: () => void) => {
    if (!signal) {
        return;
    }
    signal.addEventListener('abort', () => cb());
    if (signal.aborted) {
        cb();
    }
};

export const unleashReady = async ({ unleashClient }: { unleashClient: UnleashClient }) => {
    const initPromise = new Promise<void>((resolve) => {
        unleashClient.once(EVENTS.INIT, () => resolve());
    });
    const startPromise = unleashClient.start();
    // Race between init and start in case it has missed the INIT event.
    await Promise.race([initPromise, startPromise]).catch(noop);
    // In case toggles exist (bootstrapped from storage), ignore waiting for them to get fetched
    if (unleashClient.getAllToggles().length > 0) {
        return;
    }
    return startPromise;
};

const defaultQuery = (eventID: string) => getEvents(eventID);
export const eventManager = async ({
    api,
    query = defaultQuery,
    eventID: maybeEventID,
}: {
    api: Api;
    query?: Parameters<typeof createEventManager>[0]['query'];
    eventID?: string;
}) => {
    const eventID = maybeEventID
        ? maybeEventID
        : await api<{
              EventID: string;
          }>(getLatestID()).then(({ EventID }) => EventID);

    const eventManager = createEventManager({
        api: api,
        eventID,
        query: query,
    });

    return eventManager;
};

export const loadCrypto = ({ appName, unleashClient }: { unleashClient: UnleashClient; appName: APP_NAMES }) => {
    return loadCryptoWorker(
        getCryptoWorkerOptions(appName, {
            checkEdDSAFaultySignatures: unleashClient.isEnabled('EdDSAFaultySignatureCheck'),
            v6Canary: unleashClient.isEnabled('CryptoCanaryOpenPGPjsV6'),
        })
    );
};

export const loadLocales = ({ locales, userSettings }: { locales: TtagLocaleMap; userSettings: UserSettings }) => {
    const browserLocale = getBrowserLocale();
    const localeCode = getClosestLocaleCode(userSettings.Locale, locales);
    return Promise.all([loadLocale(localeCode, locales), loadDateLocale(localeCode, browserLocale, userSettings)]);
};

export const initUser = ({
    appName,
    user,
    userSettings,
}: {
    appName: APP_NAMES;
    user: User;
    userSettings: UserSettings;
}) => {
    setSentryEnabled(!!userSettings.CrashReports);
    setMetricsEnabled(!!userSettings.Telemetry);

    metrics.setReportMetrics(!!userSettings.Telemetry);

    const hasNonDelinquentRequirement = requiresNonDelinquent.includes(appName);
    const hasNonDelinquentScope = getHasNonDelinquentScope(user);

    return {
        delinquent: hasNonDelinquentRequirement && !hasNonDelinquentScope,
    };
};

const initEarlyAccess = ({
    userSettings,
    earlyAccessScope,
    appName,
}: {
    appName: APP_NAMES;
    userSettings: UserSettings;
    earlyAccessScope: Feature<Environment> | undefined;
}) => {
    const refresh = handleEarlyAccessDesynchronization({
        userSettings,
        earlyAccessScope,
        appName,
    });
    if (refresh) {
        refresh();
        return new Promise(noop);
    }
};

export const maybeRedirect = async ({
    appName,
    authentication,
    user,
    history,
}: {
    appName: APP_NAMES;
    authentication: AuthenticationStore;
    user: User;
    history: History;
}) => {
    if (getRequiresAddressSetup(appName, user)) {
        appLink({
            to: `${SETUP_ADDRESS_PATH}?to=${appName}`,
            toApp: APPS.PROTONACCOUNT,
            app: appName,
            history,
            authentication,
        });
        await new Promise(noop);
    }

    if (getIsSSOVPNOnlyAccount(user) && ![APPS.PROTONACCOUNT, ...getSSOVPNOnlyAccountApps()].includes(appName as any)) {
        appLink({ to: '/vpn', toApp: APPS.PROTONACCOUNT, app: appName, history, authentication });
        await new Promise(noop);
    }

    if (
        getIsPublicUserWithoutProtonAddress(user) &&
        ![APPS.PROTONACCOUNT, ...getPublicUserProtonAddressApps()].includes(appName as any)
    ) {
        appLink({ to: '/pass', toApp: APPS.PROTONACCOUNT, app: appName, history, authentication });
        await new Promise(noop);
    }
};

export const postLoad = async (args: Parameters<typeof initEarlyAccess>[0] & Parameters<typeof maybeRedirect>[0]) => {
    await initEarlyAccess(args);
    await maybeRedirect(args);
};

export const wrap = async <T>(
    {
        appName,
        authentication,
    }: {
        appName: APP_NAMES;
        authentication: AuthenticationStore;
    },
    promise: Promise<T>
) => {
    const run = async () => {
        try {
            const result = await promise;
            return result;
        } catch (error) {
            if (getIs401Error(error) || error instanceof InvalidSessionError) {
                handleInvalidSession({
                    appName,
                    authentication,
                    localID: error instanceof InvalidSessionError ? error.localID : undefined,
                });
                await new Promise(noop);
            }
            throw error;
        }
    };

    return wrapUnloadError<T>(run());
};

export const publicApp = ({
    app,
    locales,
    pathLocale,
    searchParams,
}: {
    app: APP_NAMES;
    locales: TtagLocaleMap;
    pathLocale: string;
    searchParams: URLSearchParams;
}) => {
    const languageParams = searchParams.get('language');
    const languageCookie = getCookie('Locale');
    const browserLocale = getBrowserLocale();
    const localeCode =
        getClosestLocaleMatch(pathLocale || languageParams || languageCookie || '', locales) ||
        getClosestLocaleCode(browserLocale, locales);
    return Promise.all([
        loadCryptoWorker(getCryptoWorkerOptions(app, {})),
        loadLocale(localeCode, locales),
        loadDateLocale(localeCode, browserLocale),
    ]);
};
