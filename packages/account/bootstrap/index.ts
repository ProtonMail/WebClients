import { type History, createBrowserHistory } from 'history';

import type { EventLoop } from '@proton/account/eventLoop';
import { wrapUnloadError } from '@proton/components/containers/app/errorRefresh';
import { handleEarlyAccessDesynchronization } from '@proton/components/helpers/earlyAccessDesynchronization';
import { updateVersionCookie, versionCookieAtLoad } from '@proton/components/helpers/versionCookie';
import type { Feature } from '@proton/features';
import metrics from '@proton/metrics';
import type { ApiWithListener } from '@proton/shared/lib/api/createApi';
import {
    type CalendarEventV6Response,
    type ContactEventV6Response,
    type CoreEventV6Response,
    type MailEventV6Response,
    getCalendarEventsV6,
    getContactEventsV6,
    getCoreEventsV6,
    getEvents,
    getLatestCalendarEventIDV6,
    getLatestContactEventIDV6,
    getLatestCoreEventIDV6,
    getLatestID,
    getLatestMailEventIDV6,
    getMailEventsV6,
} from '@proton/shared/lib/api/events';
import { getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getLatestMeetEventID, getMeetEvents } from '@proton/shared/lib/api/meet';
import { getClientID } from '@proton/shared/lib/apps/helper';
import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
import createAuthenticationStore from '@proton/shared/lib/authentication/createAuthenticationStore';
import createSecureSessionStorage from '@proton/shared/lib/authentication/createSecureSessionStorage';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import {
    consumeFork,
    getConsumeForkParameters,
    getEmailSessionForkSearchParameter,
    removeHashParameters,
} from '@proton/shared/lib/authentication/fork';
import { getParsedCurrentUrl } from '@proton/shared/lib/authentication/fork/forkState';
import type { ExtraSessionForkData } from '@proton/shared/lib/authentication/interface';
import { handleInvalidSession } from '@proton/shared/lib/authentication/logout';
import {
    getLocalIDFromPathname,
    getParsedPathWithoutLocalIDBasename,
} from '@proton/shared/lib/authentication/pathnameHelper';
import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { resumeSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getReturnUrlParameter } from '@proton/shared/lib/authentication/returnUrl';
import { newVersionUpdater } from '@proton/shared/lib/busy';
import { getProdId, setVcalProdId } from '@proton/shared/lib/calendar/vcalConfig';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { SSO_PATHS } from '@proton/shared/lib/constants';
import { storeAppVersion } from '@proton/shared/lib/desktop/version';
import { resumeSessionDrawerApp } from '@proton/shared/lib/drawer/session';
import createCompatEventManager from '@proton/shared/lib/eventManager/compatEventManager';
import createEventManager from '@proton/shared/lib/eventManager/eventManager';
import type { FetchConfig } from '@proton/shared/lib/fetch/interface';
import { getCookie } from '@proton/shared/lib/helpers/cookies';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { setMetricsEnabled } from '@proton/shared/lib/helpers/metrics';
import sentry, { setSentryEnabled, setSentryTags, setUID as setSentryUID } from '@proton/shared/lib/helpers/sentry';
import { loadCryptoWorker } from '@proton/shared/lib/helpers/setupCryptoWorker';
import { getPathFromLocation } from '@proton/shared/lib/helpers/url';
import { getBrowserLocale, getClosestLocaleCode, getClosestLocaleMatch } from '@proton/shared/lib/i18n/helper';
import { loadLocales as loadLocalesI18n } from '@proton/shared/lib/i18n/loadLocale';
import { setTtagLocales } from '@proton/shared/lib/i18n/locales';
import type { Api, Environment, ProtonConfig, Unwrap, UserSettings } from '@proton/shared/lib/interfaces';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import type { MeetEventResponse } from '@proton/shared/lib/interfaces/Meet';
import initLogicalProperties from '@proton/shared/lib/logical/logical';
import { telemetry } from '@proton/shared/lib/telemetry';
import {
    EVENTS,
    UnleashClient,
    createCustomFetch,
    getUnleashConfig,
    setStandaloneUnleashClient,
} from '@proton/unleash';
import noop from '@proton/utils/noop';

import { getCryptoWorkerOptions } from './cryptoWorkerOptions';
import { getLastUsedLocalID, setLastUsedLocalID } from './lastUsedLocalID';

export class InvalidSessionError extends Error {
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
    telemetry.setAuthHeaders(UID || '');
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
    if (isElectronMail) {
        storeAppVersion(config.APP_NAME, config.APP_VERSION);
    }
    if (!authentication.UID) {
        setMetricsEnabled(true);
    }
    setTtagLocales(locales);
    newVersionUpdater(config);
    sentry({ config, UID: authentication.UID });
    setVcalProdId(getProdId(config));
    removeLoaderClassName();

    if (config.LOGICAL_SCSS) {
        initLogicalProperties();
    }

    const appTag = getCookie('Tag') ?? 'default';
    setSentryTags({ appTag });
};

export interface SessionPayloadData<IncludeUser extends boolean> {
    session: Unwrap<ReturnType<typeof resumeSession<IncludeUser>>> | ResumedSessionResult | undefined;
    basename: string | undefined;
    url?: string;
    reloadDocument?: boolean;
}

interface PerformanceMeasure {
    start: () => void;
    end: () => void;
    clear: () => void;
}

export const loadSession = async <IncludeUser extends boolean = false>({
    authentication,
    api,
    pathname,
    searchParams,
    unauthenticatedReturnUrl,
    localID: localIDParam,
    performanceMeasure,
    resumeOptions = { user: false as IncludeUser },
}: {
    pathname: string;
    authentication: AuthenticationStore;
    api: ApiWithListener;
    searchParams: URLSearchParams;
    unauthenticatedReturnUrl?: string;
    localID?: number;
    performanceMeasure?: {
        consumeFork: PerformanceMeasure;
        resumeSession: PerformanceMeasure;
    };
    resumeOptions?: Parameters<typeof resumeSession<IncludeUser>>[0]['options'];
}): Promise<SessionPayloadData<IncludeUser>> => {
    if (authentication.ready) {
        api.UID = authentication.UID;
        setLastUsedLocalID(authentication.localID);

        return {
            session: undefined,
            basename: authentication.basename,
        };
    }

    let localID = localIDParam ?? getLocalIDFromPathname(pathname);

    api.UID = undefined;

    const extra: ExtraSessionForkData = {
        localID,
        email: getEmailSessionForkSearchParameter(searchParams),
        returnUrl: getReturnUrlParameter(searchParams),
        pathname,
        unauthenticatedReturnUrl,
    };

    try {
        if (localID === undefined) {
            if (pathname.startsWith(SSO_PATHS.FORK)) {
                performanceMeasure?.consumeFork.start();
                const result = await maybeConsumeFork({ api, mode: authentication.mode });
                performanceMeasure?.consumeFork.end();

                if (result) {
                    authentication.login(result.session);
                    api.UID = authentication.UID;
                    setLastUsedLocalID(authentication.localID);

                    return {
                        session: result.session,
                        basename: authentication.basename,
                        url: result.forkState.url,
                        reloadDocument: result.forkState.reloadDocument,
                    };
                }
            }

            // Having a previously persisted localID potentially avoids a redirect to account.
            const lastUsedLocalID = getLastUsedLocalID();
            // If specifying an email address, ignore the last used local id. We don't know if that local id maps
            // to the email since we don't store all addresses.
            if (!extra.email && lastUsedLocalID >= 0) {
                localID = lastUsedLocalID;
            } else {
                throw new InvalidSessionError('Missing localID', extra);
            }
        }

        performanceMeasure?.resumeSession.start();
        const result = await resumeSession({ api, localID, options: resumeOptions });
        performanceMeasure?.resumeSession.end();

        authentication.login(result);
        api.UID = authentication.UID;
        setLastUsedLocalID(authentication.localID);
        const currentUrl = `/${getParsedPathWithoutLocalIDBasename(getPathFromLocation(window.location))}`;

        return {
            session: result,
            basename: authentication.basename,
            url: currentUrl,
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
}): Promise<SessionPayloadData<true> | undefined> => {
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
        const { tag, ...session } = await resumeSessionDrawerApp({ parentApp, localID });
        // When opening the drawer, we might need to set the tag of the app we are opening
        // Otherwise we will not open the correct version of the app (default instead of beta or alpha)
        if (tag && versionCookieAtLoad !== tag) {
            updateVersionCookie(tag, undefined);
            window.location.reload();
            return await new Promise(noop);
        }

        authentication.login(session);
        api.UID = authentication.UID;

        return {
            session,
            basename: authentication.basename,
        };
    } catch (error) {
        return undefined;
    }
};

export const createHistory = ({
    sessionResult: { basename, url, reloadDocument },
    pathname,
}: {
    sessionResult: Omit<SessionPayloadData<boolean>, 'session'>;
    pathname: string;
}) => {
    const history = createBrowserHistory({ basename });

    const path = url ? getParsedCurrentUrl(url) : '';

    if (path || (basename && !pathname.startsWith(basename))) {
        const safePath = `/${getParsedPathWithoutLocalIDBasename(path || '')}`;
        // Important that there's a history event even if no path is set so that basename gets properly set
        history.replace(safePath);
    }

    if (reloadDocument) {
        window.location.reload();
    }

    return history;
};

export const createUnleash = ({ api }: { api: Api }) => {
    const unleashClient = new UnleashClient(getUnleashConfig({ fetch: createCustomFetch(api) }));
    setStandaloneUnleashClient(unleashClient);
    return unleashClient;
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

export const unleashReady = async ({ unleashClient }: { unleashClient: UnleashClient }): Promise<void> => {
    // In case toggles exist (bootstrapped from storage), ignore waiting for them to get fetched
    if (unleashClient.getAllToggles().length > 0) {
        unleashClient.start().catch(noop);
        return;
    }
    const initPromise = new Promise<void>((resolve) => {
        unleashClient.once(EVENTS.INIT, () => resolve());
    });
    const startPromise = unleashClient.start();
    // Race between init and start in case it has missed the INIT event.
    await Promise.race([initPromise, startPromise]).catch(noop);
    return startPromise;
};

const defaultQuery = (eventID: string) => getEvents(eventID);
export const eventManager = ({
    api,
    query = defaultQuery,
    eventID: maybeEventID,
}: {
    api: Api;
    query?: (eventID: string) => FetchConfig;
    eventID?: string;
}) => {
    return createEventManager<EventLoop>({
        eventID: maybeEventID,
        getLatestEventID: (options) =>
            api<{
                EventID: string;
            }>({ ...getLatestID(), ...options }).then(({ EventID }) => EventID),
        getEvents: ({ eventID, ...rest }) => {
            return api<EventLoop>({ ...query(eventID), ...rest });
        },
    });
};

export const loadCrypto = ({
    appName,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    unleashClient,
}: {
    appName: APP_NAMES;
    unleashClient: UnleashClient | undefined;
}) => {
    return loadCryptoWorker(getCryptoWorkerOptions(appName, {}));
};

export const coreEventManagerV6 = ({ api }: { api: Api }) => {
    return createEventManager<CoreEventV6Response>({
        getLatestEventID: (options) =>
            api<{
                EventID: string;
            }>({ ...getLatestCoreEventIDV6(), ...options }).then(({ EventID }) => EventID),
        getEvents: ({ eventID, ...rest }) => {
            return api<CoreEventV6Response>({ ...getCoreEventsV6(eventID), ...rest });
        },
    });
};

export const mailEventManagerV6 = ({ api }: { api: Api }) => {
    return createEventManager<MailEventV6Response>({
        getLatestEventID: (options) =>
            api<{
                EventID: string;
            }>({ ...getLatestMailEventIDV6(), ...options }).then(({ EventID }) => EventID),
        getEvents: ({ eventID, ...rest }) => {
            return api<MailEventV6Response>({ ...getMailEventsV6(eventID), ...rest });
        },
    });
};

export const contactEventManagerV6 = ({ api }: { api: Api }) => {
    return createEventManager<ContactEventV6Response>({
        getLatestEventID: (options) =>
            api<{
                EventID: string;
            }>({ ...getLatestContactEventIDV6(), ...options }).then(({ EventID }) => EventID),
        getEvents: ({ eventID, ...rest }) => {
            return api<ContactEventV6Response>({ ...getContactEventsV6(eventID), ...rest });
        },
    });
};

export const calendarEventManagerV6 = ({ api }: { api: Api }) => {
    return createEventManager<CalendarEventV6Response>({
        getLatestEventID: (options) =>
            api<{
                EventID: string;
            }>({ ...getLatestCalendarEventIDV6(), ...options }).then(({ EventID }) => EventID),
        getEvents: ({ eventID, ...rest }) => {
            return api<CalendarEventV6Response>({ ...getCalendarEventsV6(eventID), ...rest });
        },
    });
};

export const compatEventManagerV6 = (parameters: Parameters<typeof createCompatEventManager>[0]) => {
    return createCompatEventManager<any>(parameters);
};

export const meetEventManager = ({ api }: { api: Api }) => {
    return createEventManager<MeetEventResponse>({
        getLatestEventID: (options) =>
            api<{
                EventID: string;
            }>({ ...getLatestMeetEventID(), ...options }).then(({ EventID }) => EventID),
        getEvents: ({ eventID, ...rest }) => {
            return api<MeetEventResponse>({ ...getMeetEvents(eventID), ...rest });
        },
    });
};

export const loadLocales = ({
    locales,
    userSettings,
}: {
    locales: TtagLocaleMap;
    userSettings: Pick<UserSettings, 'Locale' | 'TimeFormat' | 'DateFormat' | 'WeekStart'>;
}) => {
    return loadLocalesI18n({ locale: userSettings.Locale, locales, userSettings });
};

export const enableTelemetryBasedOnUserSettings = ({ userSettings }: { userSettings: UserSettings }) => {
    setSentryEnabled(!!userSettings.CrashReports);
    setMetricsEnabled(!!userSettings.Telemetry);

    metrics.setReportMetrics(!!userSettings.Telemetry);
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

export const postLoad = async (
    args: Parameters<typeof initEarlyAccess>[0] & {
        history: History;
        authentication: AuthenticationStore;
    }
) => {
    await initEarlyAccess(args);
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

export const getLocaleCodePublicApp = ({
    locales,
    pathLocale,
    searchParams,
}: {
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
    return { localeCode, browserLocale };
};

export const loadLocalesPublicApp = ({
    localeCode,
    browserLocale,
    locales,
}: {
    localeCode: string;
    browserLocale: string;
    locales: TtagLocaleMap;
}) => {
    return loadLocalesI18n({
        locales,
        locale: localeCode,
        browserLocaleCode: browserLocale,
        userSettings: undefined,
    });
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
    const { localeCode, browserLocale } = getLocaleCodePublicApp({
        locales,
        searchParams,
        pathLocale,
    });

    return Promise.all([
        loadCrypto({ appName: app, unleashClient: undefined }),
        loadLocalesPublicApp({ locales, localeCode, browserLocale }),
    ]);
};
