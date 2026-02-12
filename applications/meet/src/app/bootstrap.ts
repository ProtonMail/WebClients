import init, { App } from '@proton-meet/proton-meet-core';
import { createBrowserHistory } from 'history';

import { registerSessionListener } from '@proton/account/accountSessions/registerSessionListener';
import { readAccountSessions } from '@proton/account/accountSessions/storage';
import { addressesThunk } from '@proton/account/addresses';
import * as bootstrap from '@proton/account/bootstrap';
import { bootstrapEvent } from '@proton/account/bootstrap/action';
import { initEvent, serverEvent, userSettingsThunk, userThunk, welcomeFlagsActions } from '@proton/account/index';
import { getDecryptedPersistedState } from '@proton/account/persist/helper';
import type { NotificationsManager } from '@proton/components/containers/notifications/manager';
import { setupGuestCrossStorage } from '@proton/cross-storage/account-impl/guestInstance';
import { FeatureCode, fetchFeatures } from '@proton/features/index';
import { meetEventLoop } from '@proton/meet/store/meetEventLoop';
import type { MeetDispatch, MeetExtraThunkArguments, MeetState, MeetStore } from '@proton/meet/store/store';
import { setupStore } from '@proton/meet/store/store';
import type { ApiWithListener } from '@proton/shared/lib/api/createApi';
import createApi from '@proton/shared/lib/api/createApi';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { cleanupInactivePersistedSessions } from '@proton/shared/lib/authentication/persistedSessionHelper';
import {
    getPersistedSession,
    getPersistedSessions,
    registerSessionRemovalListener,
} from '@proton/shared/lib/authentication/persistedSessionStorage';
import { getAppVersionStr } from '@proton/shared/lib/fetch/headers';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';
import type { ProtonConfig, Unwrap } from '@proton/shared/lib/interfaces';
import { createUnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import { appMode } from '@proton/shared/lib/webpack.constants';
import noop from '@proton/utils/noop';

import locales from './locales';
import { clearStoredDevices } from './utils/deviceStorage';
import { clearDisabledRotatePersonalMeeting } from './utils/disableRotatePersonalMeeting';

const initializeWasmApp = async (
    authentication: MeetExtraThunkArguments['authentication'],
    appVersion: string
): Promise<App> => {
    await init();

    const persistedSession = getPersistedSession(authentication.localID);
    const userID = persistedSession?.UserID ?? '';
    const uid = authentication.UID ?? '';

    const env = `${window.location.origin}/api`;
    const userAgent = navigator.userAgent;
    const dbPath = '';
    const host = `${window.location.hostname}/meet/api/`;

    const appResult = await new App(env, appVersion, userAgent, dbPath, host, host, userID ?? '', uid ?? '');

    return appResult;
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

    const [scopes] = await Promise.all([
        bootstrap.enableTelemetryBasedOnUserSettings({ userSettings }),
        bootstrap.loadLocales({ userSettings, locales }),
    ]);

    return { user, userSettings, earlyAccessScope: features[FeatureCode.EarlyAccessScope], scopes };
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

export const initAppDependencies = async (
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
    const sessionResult = await getSession({ authentication, api });

    const eventManager = bootstrap.eventManager({ api: silentApi });
    const meetEventManager = bootstrap.meetEventManager({ api: silentApi });

    const history = bootstrap.createHistory({ sessionResult, pathname: window.location.pathname });

    const appVersion = getAppVersionStr(getClientID(config.APP_NAME), config.APP_VERSION);

    return { api, authentication, unleashClient, eventManager, history, sessionResult, appVersion, meetEventManager };
};

const completeAppBootstrap = async ({
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

    const [userData, wasmApp] = await Promise.all([
        loadUserData(dispatch),
        initializeWasmApp(authentication, appVersion),
        bootstrap.loadCrypto({ appName: config.APP_NAME, unleashClient }),
        bootstrap.unleashReady({ unleashClient }).catch(noop),
    ]);

    await bootstrap.postLoad({ appName: config.APP_NAME, authentication, ...userData, history });
    await dispatch(addressesThunk());

    eventManagerSetup({ store, signal, eventManager, unleashClient, meetEventManager });

    dispatch(bootstrapEvent({ type: 'complete' }));

    // Register callback to clear settings entries on logout
    registerSessionRemovalListener(async () => {
        clearStoredDevices();
        clearDisabledRotatePersonalMeeting();
    });

    return { userData, wasmApp };
};

interface BootstrapParameters {
    config: ProtonConfig;
    signal?: AbortSignal;
    notificationsManager: NotificationsManager;
}

export const executeBootstrapSteps = async ({
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

    const { userData, wasmApp } = await completeAppBootstrap({
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
        wasmApp,
    };
};

export const bootstrapApp = async (parameters: BootstrapParameters) => {
    const authentication = bootstrap.createAuthentication();

    return bootstrap.wrap(
        { appName: parameters.config.APP_NAME, authentication },
        executeBootstrapSteps({ ...parameters, authentication })
    );
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

export const bootstrapGuestApp = async (config: ProtonConfig, notificationsManager: NotificationsManager) => {
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

    const unauthenticatedApi = createUnauthenticatedApi(api);
    const unleashClient = bootstrap.createUnleash({ api: unauthenticatedApi.apiCallback });
    const appVersion = getAppVersionStr(getClientID(config.APP_NAME), config.APP_VERSION);

    const [wasmApp] = await Promise.all([
        initializeWasmApp(authentication, appVersion),
        bootstrap.loadCrypto({ appName: config.APP_NAME, unleashClient }),
    ]);

    const history = createBrowserHistory({ basename: '/guest' });

    await unleashClient.start();

    await unauthenticatedApi.startUnAuthFlow();

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

    return {
        authentication,
        store,
        unauthenticatedApi,
        history,
        unleashClient,
        wasmApp,
    };
};
