import init, { App } from '@proton-meet/proton-meet-core';
import { createBrowserHistory } from 'history';

import { registerSessionListener } from '@proton/account/accountSessions/registerSessionListener';
import { readAccountSessions } from '@proton/account/accountSessions/storage';
import { addressesThunk } from '@proton/account/addresses';
import * as bootstrap from '@proton/account/bootstrap';
import { bootstrapEvent } from '@proton/account/bootstrap/action';
import { initEvent, serverEvent, userSettingsThunk, userThunk, welcomeFlagsActions } from '@proton/account/index';
import { getDecryptedPersistedState } from '@proton/account/persist/helper';
import type { NotificationsManager } from '@proton/app-context/notifications/manager';
import { setupGuestCrossStorage } from '@proton/cross-storage/account/guest';
import { FeatureCode, fetchFeatures } from '@proton/features/index';
import { logger } from '@proton/logger';
import { ALL_CONSOLE_LEVELS } from '@proton/logger/constants';
import { setMeetCoreErrorResolver } from '@proton/meet/hooks/useMeetErrorReporting';
import { meetEventLoop } from '@proton/meet/store/meetEventLoop';
import type { MeetDispatch, MeetExtraThunkArguments, MeetState, MeetStore } from '@proton/meet/store/store';
import { setupStore } from '@proton/meet/store/store';
import { initMeetTelemetry } from '@proton/meet/telemetry/meetTelemetry';
import type { ApiWithListener } from '@proton/shared/lib/api/createApi';
import createApi from '@proton/shared/lib/api/createApi';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { generateLoggerKey } from '@proton/shared/lib/authentication/loggerKey';
import { cleanupInactivePersistedSessions } from '@proton/shared/lib/authentication/persistedSessionHelper';
import {
    getPersistedSession,
    getPersistedSessions,
    registerSessionRemovalListener,
} from '@proton/shared/lib/authentication/persistedSessionStorage';
import { getAppVersionStr } from '@proton/shared/lib/fetch/headers';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';
import { captureMessage, isProduction } from '@proton/shared/lib/helpers/sentry';
import { getBrowserLocale } from '@proton/shared/lib/i18n/helper';
import { loadLocales } from '@proton/shared/lib/i18n/loadLocale';
import type { ProtonConfig, Unwrap } from '@proton/shared/lib/interfaces';
import { telemetry } from '@proton/shared/lib/telemetry';
import { appMode } from '@proton/shared/lib/webpack.constants';
import noop from '@proton/utils/noop';

import { purgeUserRecordings } from './hooks/useMeetingRecorder/recordingStorage/purge';
import locales from './locales';
import { markBootstrapEnd, markBootstrapStart, measureLoadPhase, setWasmMode } from './telemetry/loadPerformance';
import { meetTelemetryConfig } from './telemetryConfig';
import { pruneOrphanBackgroundCaches, purgeUserBackgrounds } from './utils/customBackgrounds/purge';
import { clearStoredDevices } from './utils/deviceStorage';
import { clearDisabledRotatePersonalMeeting } from './utils/disableRotatePersonalMeeting';
import { startMeetingInfoPreload } from './utils/startMeetingInfoPreload';
import { installWaitingRoomCallbackNamespaces } from './utils/wasmUtils';
import { DirectMeetCoreClient } from './wasm/DirectMeetCoreClient';
import type { MeetCoreClient } from './wasm/MeetCoreClient';
import { MeetCoreWorkerClient } from './wasm/MeetCoreWorkerClient';
import { getMeetCoreErrorName } from './wasm/meetCoreError';
import type { MeetCoreInitParams } from './wasm/meetCoreWorkerProtocol';

setMeetCoreErrorResolver(getMeetCoreErrorName);

const MEET_CORE_WORKER_FLAG = 'MeetCoreWorker';
const MEET_USE_CACHED_SERVER_TIME_FLAG = 'MeetUseCachedServerTime';
const MEET_EXTENDED_TELEMETRY_FLAG = 'MeetExtendedTelemetry';

const getMeetCoreInitParams = (
    authentication: MeetExtraThunkArguments['authentication'],
    appVersion: string
): Omit<MeetCoreInitParams, 'useCachedServerTime'> => {
    const persistedSession = getPersistedSession(authentication.localID);
    const userId = persistedSession?.UserID ?? '';
    const uid = authentication.UID ?? '';

    const env = `${window.location.origin}/api`;
    const userAgent = navigator.userAgent;
    const dbPath = '';
    const host = `${window.location.hostname}/meet/api/`;

    return { env, appVersion, userAgent, dbPath, httpHost: host, wsHost: host, userId, uid };
};

const createDirectMeetCoreClient = async (params: MeetCoreInitParams): Promise<DirectMeetCoreClient> => {
    await init();
    const app = await new App(
        params.env,
        params.appVersion,
        params.userAgent,
        params.dbPath,
        params.httpHost,
        params.wsHost,
        params.userId,
        params.uid
    );
    app.setUseCachedServerTime(params.useCachedServerTime);

    // The worker client installs them in its own global scope on init, this is the direct equivalent.
    installWaitingRoomCallbackNamespaces();

    return new DirectMeetCoreClient(app);
};

const createWorkerMeetCoreClient = async (params: MeetCoreInitParams): Promise<MeetCoreWorkerClient> => {
    const workerClient = new MeetCoreWorkerClient();
    try {
        await workerClient.init(params);
        return workerClient;
    } catch (error) {
        workerClient.dispose();
        throw error;
    }
};

const initializeMeetCoreClient = async ({
    authentication,
    appVersion,
    meetCoreWorkerEnabled,
    useCachedServerTime,
}: {
    authentication: MeetExtraThunkArguments['authentication'];
    appVersion: string;
    meetCoreWorkerEnabled: boolean;
    useCachedServerTime: boolean;
}): Promise<MeetCoreClient> => {
    const params = { ...getMeetCoreInitParams(authentication, appVersion), useCachedServerTime };

    if (!meetCoreWorkerEnabled) {
        return createDirectMeetCoreClient(params);
    }

    try {
        return await createWorkerMeetCoreClient(params);
    } catch (error) {
        captureMessage('Meet core worker init failed, falling back to direct meet core client', {
            level: 'error',
            extra: { error },
        });
        return createDirectMeetCoreClient(params);
    }
};

const getApis = (config: ProtonConfig) => {
    const api = createApi({ config });
    const silentApi = getSilentApi(api);

    return { api, silentApi };
};

const getSession = async ({ authentication, api }: Pick<MeetExtraThunkArguments, 'authentication' | 'api'>) => {
    const guestUrl = '/guest' + window.location.pathname + window.location.search + window.location.hash;

    const sessionResult = await bootstrap.loadSession({
        authentication,
        api,
        pathname: window.location.pathname,
        searchParams: new URLSearchParams(window.location.search),
        unauthenticatedReturnUrl:
            !window.location.pathname.includes('guest') && !window.location.pathname.includes('login')
                ? guestUrl
                : undefined,
    });

    return sessionResult;
};

const loadUserData = async (dispatch: MeetDispatch) => {
    const [user, userSettings, features] = await Promise.all([
        dispatch(userThunk()),
        dispatch(userSettingsThunk()),
        dispatch(fetchFeatures([FeatureCode.EarlyAccessScope])),
    ]);

    dispatch(welcomeFlagsActions.initial(userSettings));

    bootstrap.enableTelemetryBasedOnUserSettings({ userSettings });
    await bootstrap.loadLocales({ userSettings, locales });

    return { user, userSettings, earlyAccessScope: features[FeatureCode.EarlyAccessScope] };
};

const initializeLogger = ({
    api,
    authentication,
    unleashClient,
    appName,
}: Pick<MeetExtraThunkArguments, 'api' | 'authentication' | 'unleashClient'> & {
    appName: ProtonConfig['APP_NAME'];
}) => {
    if (!unleashClient.isEnabled('CollectLogs') || unleashClient.isEnabled('MeetCollectLogsKillSwitch')) {
        return;
    }

    void generateLoggerKey(authentication).then(({ key, ID }) =>
        logger.initialize({
            encryptionKey: key,
            appName,
            loggerID: ID,
            loggerName: 'meet',
            consoleLevels: isProduction(window.location.host) ? undefined : ALL_CONSOLE_LEVELS,
        })
    );

    api.addEventListener((event) => {
        if (event.type === 'api-error') {
            const isPing = event.payload.apiInfo.url === 'tests/ping';
            if (!isPing) {
                logger.error(event.payload.apiInfo.url || 'unknown URL', event.payload);
            }
        }
        return false;
    });
};

const eventManagerSetup = ({
    eventManager,
    store,
    signal,
    unleashClient,
    meetEventManager,
}: {
    eventManager: MeetExtraThunkArguments['eventManager'];
    unleashClient: MeetExtraThunkArguments['unleashClient'];
    signal?: AbortSignal;
    store: MeetStore;
    meetEventManager: MeetExtraThunkArguments['meetEventManager'];
}) => {
    const unsubscribeEventManager = eventManager.subscribe((event) => {
        store.dispatch(serverEvent(event));
    });

    const unsubscribeMeetEventManager = meetEventManager?.subscribe(async (event) => {
        const promises: Promise<void>[] = [];
        store.dispatch(meetEventLoop({ event, promises }));
        await Promise.all(promises);
    });

    eventManager.start();
    meetEventManager.start();

    bootstrap.onAbort(signal, () => {
        unsubscribeEventManager();
        unsubscribeMeetEventManager();
        eventManager.reset();
        meetEventManager.reset();
        unleashClient.stop();
        store.unsubscribe();
    });
};

const initAppDependencies = async (
    config: ProtonConfig,
    authentication: MeetExtraThunkArguments['authentication']
): Promise<
    Omit<MeetExtraThunkArguments, 'config'> & {
        sessionResult: Unwrap<ReturnType<typeof bootstrap.loadSession<false>>>;
        appVersion: string;
    }
> => {
    const { api, silentApi } = getApis(config);

    const unleashClient = bootstrap.createUnleash({ api: silentApi });
    const sessionResult = await measureLoadPhase('sessionMs', getSession({ authentication, api }));

    const eventManager = bootstrap.eventManager({ api: silentApi });
    const meetEventManager = bootstrap.meetEventManager({ api: silentApi });

    const history = bootstrap.createHistory({ sessionResult, pathname: window.location.pathname });

    const appVersion = getAppVersionStr(getClientID(config.APP_NAME), config.APP_VERSION);

    return { api, authentication, unleashClient, eventManager, history, sessionResult, appVersion, meetEventManager };
};

const completeAppBootstrap = async ({
    api,
    store,
    authentication,
    unleashClient,
    eventManager,
    signal,
    config,
    sessionResult,
    history,
    appVersion,
    meetEventManager,
}: MeetExtraThunkArguments & {
    signal?: AbortSignal;
    store: MeetStore;
    sessionResult: Unwrap<ReturnType<typeof bootstrap.loadSession<false>>>;
    notificationsManager: NotificationsManager;
    appVersion: string;
}) => {
    const dispatch = store.dispatch;

    if (sessionResult.session?.User) {
        dispatch(initEvent({ User: sessionResult.session.User }));
    }

    const cryptoPromise = measureLoadPhase(
        'cryptoInitMs',
        bootstrap.loadCrypto({ appName: config.APP_NAME, unleashClient })
    );

    startMeetingInfoPreload({ dispatch, cryptoReady: cryptoPromise });

    const [userData] = await Promise.all([
        measureLoadPhase('sessionMs', loadUserData(dispatch)),
        cryptoPromise,
        measureLoadPhase('unleashMs', bootstrap.unleashReady({ unleashClient })).catch(noop),
    ]);
    initializeLogger({ api, authentication, unleashClient, appName: config.APP_NAME });
    const meetCoreWorkerEnabled = unleashClient.isEnabled(MEET_CORE_WORKER_FLAG);
    const useCachedServerTime = unleashClient.isEnabled(MEET_USE_CACHED_SERVER_TIME_FLAG);
    const meetCoreClient = await measureLoadPhase(
        'wasmInitMs',
        initializeMeetCoreClient({ authentication, appVersion, meetCoreWorkerEnabled, useCachedServerTime })
    );
    setWasmMode(meetCoreClient);
    bootstrap.onAbort(signal, () => meetCoreClient.dispose());

    if (!!userData.userSettings.Telemetry) {
        telemetry.init({
            config,
            uid: authentication.UID,
            ...meetTelemetryConfig,
        });
    }

    await bootstrap.postLoad({ appName: config.APP_NAME, authentication, ...userData, history });
    await dispatch(addressesThunk());

    eventManagerSetup({ store, signal, eventManager, unleashClient, meetEventManager });

    dispatch(bootstrapEvent({ type: 'complete' }));

    registerSessionRemovalListener(async (persistedSession) => {
        await logger.clearLogs();
        clearStoredDevices();
        clearDisabledRotatePersonalMeeting();
        await purgeUserRecordings(persistedSession.UserID);
        await purgeUserBackgrounds(persistedSession.UserID);
    });

    void pruneOrphanBackgroundCaches();

    return { userData, meetCoreClient };
};

interface BootstrapParameters {
    config: ProtonConfig;
    signal?: AbortSignal;
    notificationsManager: NotificationsManager;
}

const executeBootstrapSteps = async ({
    config,
    signal,
    notificationsManager,
    authentication,
}: BootstrapParameters & Pick<MeetExtraThunkArguments, 'authentication'>) => {
    setupGuestCrossStorage({ appMode, appName: config.APP_NAME });

    const { sessionResult, appVersion, ...restServices } = await initAppDependencies(config, authentication);

    initElectronClassnames();
    bootstrap.init({ config, authentication, locales });

    const persistedState = await getDecryptedPersistedState<Partial<MeetState>>({
        authentication,
        user: sessionResult.session?.User,
    });

    const store = setupStore({
        extraThunkArguments: {
            ...restServices,
            authentication,
            notificationsManager,
            config,
        },
        preloadedState: persistedState?.state,
        persist: true,
    });

    initMeetTelemetry({
        api: restServices.api,
        getState: store.getState,
        isEnabled: () => restServices.unleashClient.isEnabled(MEET_EXTENDED_TELEMETRY_FLAG),
    });

    const { userData, meetCoreClient } = await completeAppBootstrap({
        ...restServices,
        authentication,
        notificationsManager,
        signal,
        store,
        config,
        sessionResult,
        appVersion,
    });

    return {
        ...restServices,
        ...userData,
        store,
        authentication,
        meetCoreClient,
    };
};

export const bootstrapApp = async (parameters: BootstrapParameters) => {
    markBootstrapStart();

    const authentication = bootstrap.createAuthentication();

    const result = await bootstrap.wrap(
        { appName: parameters.config.APP_NAME, authentication },
        executeBootstrapSteps({ ...parameters, authentication })
    );

    markBootstrapEnd();

    return result;
};

const assertNoSessions = async (api: ApiWithListener) => {
    // First ensure all inactive persisted sessions are cleared.
    await cleanupInactivePersistedSessions({ api, persistedSessions: getPersistedSessions(), delay: 50 }).catch(noop);
    // Read session cookie from account.
    const accountSessions = readAccountSessions();
    // If account reports any sessions, that value takes precedence. Otherwise, the locally persisted sessions do.
    const maybeHasSessions = accountSessions ? accountSessions.length >= 0 : getPersistedSessions().length > 0;

    // No sessions, all good to proceed with guest.
    if (!maybeHasSessions) {
        return;
    }

    const { pathname, search, hash } = window.location;
    const cleanPath = pathname.replace('/guest', '');

    // Redirect to join container so that the login logic proceeds.
    if (cleanPath.startsWith('/join')) {
        window.location.href = cleanPath + search + hash;
    } else {
        window.location.href = '/dashboard';
    }
    // Promise that never resolves to wait for the redirect.
    return new Promise(noop);
};

export const bootstrapGuestApp = async (
    config: ProtonConfig,
    notificationsManager: NotificationsManager,
    signal?: AbortSignal
) => {
    markBootstrapStart();

    const api = createApi({ config });

    api.addEventListener((event) => {
        if (event.type === 'notification') {
            notificationsManager.createNotification(event.payload);
            return true;
        }
        return false;
    });

    registerSessionListener({ type: 'all' });

    await assertNoSessions(api);

    const authentication = bootstrap.createAuthentication({ initialAuth: false });
    bootstrap.init({ config, authentication, locales });

    const unauthenticatedApi = bootstrap.createUnauthenticatedApi(api);
    const unleashClient = bootstrap.createUnleash({ api: unauthenticatedApi.apiCallback });
    const appVersion = getAppVersionStr(getClientID(config.APP_NAME), config.APP_VERSION);

    telemetry.init({
        config,
        uid: authentication.UID,
        ...meetTelemetryConfig,
    });

    await measureLoadPhase('unleashMs', unleashClient.start());

    const meetCoreWorkerEnabled = unleashClient.isEnabled(MEET_CORE_WORKER_FLAG);
    const useCachedServerTime = unleashClient.isEnabled(MEET_USE_CACHED_SERVER_TIME_FLAG);
    const [meetCoreClient] = await Promise.all([
        measureLoadPhase(
            'wasmInitMs',
            initializeMeetCoreClient({ authentication, appVersion, meetCoreWorkerEnabled, useCachedServerTime })
        ),
        measureLoadPhase('cryptoInitMs', bootstrap.loadCrypto({ appName: config.APP_NAME, unleashClient })),
        loadLocales({ locale: getBrowserLocale(), locales, userSettings: undefined }),
    ]);
    setWasmMode(meetCoreClient);
    bootstrap.onAbort(signal, () => meetCoreClient.dispose());

    const history = createBrowserHistory({ basename: '/guest' });

    await measureLoadPhase('sessionMs', unauthenticatedApi.startUnAuthFlow());

    void pruneOrphanBackgroundCaches();

    const store = setupStore({
        extraThunkArguments: {
            api: unauthenticatedApi.apiCallback as ApiWithListener,
            authentication,
            unleashClient,
            config,
            history,
            eventManager: undefined as any,
            notificationsManager,
            meetEventManager: undefined as any,
        },
    });

    initMeetTelemetry({
        api: unauthenticatedApi.apiCallback,
        getState: store.getState,
        isEnabled: () => unleashClient.isEnabled(MEET_EXTENDED_TELEMETRY_FLAG),
    });

    startMeetingInfoPreload({ dispatch: store.dispatch });

    markBootstrapEnd();

    return {
        authentication,
        store,
        unauthenticatedApi,
        history,
        unleashClient,
        meetCoreClient,
    };
};
