import { createBrowserHistory } from 'history';
import type { History } from 'history';

import { wrapUnloadError } from '@proton/components/containers/app/errorRefresh';
import { handleEarlyAccessDesynchronization } from '@proton/components/helpers/earlyAccessDesynchronization';
import type { Feature } from '@proton/features';
import metrics from '@proton/metrics';
import type { ApiWithListener } from '@proton/shared/lib/api/createApi';
import { getEvents, getLatestID } from '@proton/shared/lib/api/events';
import { getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { appLink } from '@proton/shared/lib/apps/appLink';
import { getPublicUserProtonAddressApps, getSSOVPNOnlyAccountApps } from '@proton/shared/lib/apps/apps';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { requiresNonDelinquent } from '@proton/shared/lib/authentication/apps';
import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
import createAuthenticationStore, {
    getParsedPathWithoutLocalIDBasename,
} from '@proton/shared/lib/authentication/createAuthenticationStore';
import createSecureSessionStorage from '@proton/shared/lib/authentication/createSecureSessionStorage';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import {
    consumeFork,
    getConsumeForkParameters,
    getEmailSessionForkSearchParameter,
    getReturnUrlParameter,
    removeHashParameters,
} from '@proton/shared/lib/authentication/fork';
import type { ForkState } from '@proton/shared/lib/authentication/fork/forkState';
import { getParsedCurrentUrl } from '@proton/shared/lib/authentication/fork/forkState';
import type { ExtraSessionForkData } from '@proton/shared/lib/authentication/interface';
import { handleInvalidSession } from '@proton/shared/lib/authentication/logout';
import { getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { resumeSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { newVersionUpdater } from '@proton/shared/lib/busy';
import { getProdId, setVcalProdId } from '@proton/shared/lib/calendar/vcalConfig';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, SETUP_ADDRESS_PATH, SSO_PATHS } from '@proton/shared/lib/constants';
import { resumeSessionDrawerApp } from '@proton/shared/lib/drawer/session';
import createEventManager from '@proton/shared/lib/eventManager/eventManager';
import { getCookie } from '@proton/shared/lib/helpers/cookies';
import { setMetricsEnabled } from '@proton/shared/lib/helpers/metrics';
import sentry, { setSentryEnabled, setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';
import { loadCryptoWorker } from '@proton/shared/lib/helpers/setupCryptoWorker';
import { getBrowserLocale, getClosestLocaleCode, getClosestLocaleMatch } from '@proton/shared/lib/i18n/helper';
import { loadDateLocale, loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';
import type { Api, Environment, ProtonConfig, User, UserSettings } from '@proton/shared/lib/interfaces';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import {
    getIsPublicUserWithoutProtonAddress,
    getIsSSOVPNOnlyAccount,
    getRequiresAddressSetup,
} from '@proton/shared/lib/keys';
import { getHasNonDelinquentScope } from '@proton/shared/lib/user/helpers';
import { createCustomFetch, getUnleashConfig } from '@proton/unleash';
import { EVENTS, UnleashClient } from '@proton/unleash';
import noop from '@proton/utils/noop';

import { getCryptoWorkerOptions } from './cryptoWorkerOptions';

export * from './action';

class InvalidSessionError extends Error {
    public extra: ExtraSessionForkData = {};

    constructor(message: string, extra: ExtraSessionForkData) {
        super(['Invalid session', message].filter(Boolean).join(':'));
        this.extra = extra;
        Object.setPrototypeOf(this, InvalidSessionError.prototype);
    }
}

export const maybeConsumeFork = async ({ api, mode }: Pick<Parameters<typeof consumeFork>[0], 'api' | 'mode'>) => {
    try {
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const parameters = getConsumeForkParameters(hashParams);
        if (!parameters) {
            return null;
        }
        return await consumeFork({
            api,
            mode,
            parameters,
        });
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
    sentry({ config, UID: authentication.UID });
    setVcalProdId(getProdId(config));
    removeLoaderClassName();
};

export interface SessionPayloadData {
    session: ResumedSessionResult | undefined;
    basename: string | undefined;
    forkState?: ForkState;
}

export const loadSession = async ({
    authentication,
    api,
    pathname,
    searchParams,
}: {
    pathname: string;
    authentication: AuthenticationStore;
    api: ApiWithListener;
    searchParams: URLSearchParams;
}): Promise<SessionPayloadData> => {
    if (authentication.ready) {
        api.UID = authentication.UID;

        return {
            session: undefined,
            basename: authentication.basename,
        };
    }

    const localID = getLocalIDFromPathname(pathname);

    api.UID = undefined;

    const extra = {
        localID,
        email: getEmailSessionForkSearchParameter(searchParams),
        returnUrl: getReturnUrlParameter(searchParams),
        pathname,
    };

    try {
        if (localID === undefined) {
            if (pathname.startsWith(SSO_PATHS.FORK)) {
                const result = await maybeConsumeFork({ api, mode: authentication.mode });
                if (result) {
                    authentication.login(result.session);
                    api.UID = authentication.UID;

                    return {
                        session: result.session,
                        basename: authentication.basename,
                        forkState: result.forkState,
                    };
                }
            }
            throw new InvalidSessionError('Missing localID', extra);
        }

        const result = await resumeSession({ api, localID });
        authentication.login(result);
        api.UID = authentication.UID;

        return {
            session: result,
            basename: authentication.basename,
        };
    } catch (e: any) {
        if (e instanceof InvalidPersistentSessionError || getIs401Error(e)) {
            throw new InvalidSessionError('Set localID', extra);
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
}): Promise<SessionPayloadData | undefined> => {
    if (authentication.ready) {
        return {
            session: undefined,
            basename: authentication.basename,
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
            session: result,
            basename: authentication.basename,
        };
    } catch (error) {
        return undefined;
    }
};

export const createHistory = ({
    sessionResult: { basename, forkState },
    pathname,
}: {
    sessionResult: SessionPayloadData;
    pathname: string;
}) => {
    const history = createBrowserHistory({ basename });

    const path = forkState?.url ? getParsedCurrentUrl(forkState.url) : '';

    if (path || (basename && !pathname.startsWith(basename))) {
        const safePath = `/${getParsedPathWithoutLocalIDBasename(path || '')}`;
        // Important that there's a history event even if no path is set so that basename gets properly set
        history.replace(safePath);
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
        ![APPS.PROTONACCOUNT, ...getPublicUserProtonAddressApps('app')].includes(appName as any)
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
                    extra: error instanceof InvalidSessionError ? error.extra : undefined,
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
