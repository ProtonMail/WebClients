import init, { App } from '@proton-meet/proton-meet-core';
import { createBrowserHistory } from 'history';
import type { ProtonThunkArguments } from 'packages/redux-shared-store-types';

import { registerSessionListener } from '@proton/account/accountSessions/registerSessionListener';
import { addressesThunk } from '@proton/account/addresses';
import * as bootstrap from '@proton/account/bootstrap';
import type { SessionPayloadData } from '@proton/account/bootstrap';
import { bootstrapEvent } from '@proton/account/bootstrap/action';
import { initEvent, serverEvent, userSettingsThunk, userThunk, welcomeFlagsActions } from '@proton/account/index';
import type { NotificationsManager } from '@proton/components/containers/notifications/manager';
import { setupGuestCrossStorage } from '@proton/cross-storage/account-impl/guestInstance';
import { FeatureCode, fetchFeatures } from '@proton/features/index';
import type { ApiWithListener } from '@proton/shared/lib/api/createApi';
import createApi from '@proton/shared/lib/api/createApi';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { handleLogoutFromURL } from '@proton/shared/lib/authentication/handleLogoutFromURL';
import {
    getPersistedSession,
    registerSessionRemovalListener,
} from '@proton/shared/lib/authentication/persistedSessionStorage';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import { createUnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import { appMode } from '@proton/shared/lib/webpack.constants';
import noop from '@proton/utils/noop';

import locales from './locales';
import type { MeetDispatch, MeetStore } from './store';
import { setupStore } from './store';
import { clearStoredDevices } from './utils/deviceStorage';
import { clearDisabledRotatePersonalMeeting } from './utils/disableRotatePersonalMeeting';

const initializeWasmApp = async (authentication: ProtonThunkArguments['authentication']): Promise<App> => {
    await init();

    const persistedSession = getPersistedSession(authentication.localID);
    const userID = persistedSession?.UserID ?? '';
    const uid = authentication.UID ?? '';

    const baseHostName = window.location.hostname.split('.').slice(1).join('.');
    const mlsSubdomain = 'meet-mls';
    const env = `${window.location.origin}/api`;
    const appVersion = 'web-meet@5.0.999.999';
    const userAgent = navigator.userAgent;
    const dbPath = '';
    const wsHost = `${mlsSubdomain}.${baseHostName}`;

    const appResult = await new App(env, appVersion, userAgent, dbPath, wsHost, userID ?? '', uid ?? '');

    return appResult;
};

const getApis = (config: ProtonConfig) => {
    const api = createApi({ config });
    const silentApi = getSilentApi(api);

    return { api, silentApi };
};

const getSession = async ({ authentication, api }: Pick<ProtonThunkArguments, 'authentication' | 'api'>) => {
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

    return sessionResult as SessionPayloadData;
};

const loadUserData = async (dispatch: MeetDispatch, appName: APP_NAMES) => {
    const [user, userSettings, features] = await Promise.all([
        dispatch(userThunk()),
        dispatch(userSettingsThunk()),
        dispatch(fetchFeatures([FeatureCode.EarlyAccessScope])),
    ]);

    dispatch(welcomeFlagsActions.initial(userSettings));

    const [scopes] = await Promise.all([
        bootstrap.initUser({ appName, user, userSettings }),
        bootstrap.loadLocales({ userSettings, locales }),
    ]);

    return { user, userSettings, earlyAccessScope: features[FeatureCode.EarlyAccessScope], scopes };
};

const eventManagerSetup = ({
    eventManager,
    store,
    signal,
    unleashClient,
}: {
    eventManager: ProtonThunkArguments['eventManager'];
    unleashClient: ProtonThunkArguments['unleashClient'];
    signal?: AbortSignal;
    store: MeetStore;
}) => {
    const unsubscribeEventManager = eventManager.subscribe((event) => {
        store.dispatch(serverEvent(event));
    });

    eventManager.start();

    bootstrap.onAbort(signal, () => {
        unsubscribeEventManager();
        eventManager.reset();
        unleashClient.stop();
        store.unsubscribe();
    });
};

export const initAppDependencies = async (
    config: ProtonConfig,
    authentication: ProtonThunkArguments['authentication']
): Promise<Omit<ProtonThunkArguments, 'config'> & { sessionResult: bootstrap.SessionPayloadData }> => {
    const { api, silentApi } = getApis(config);

    const unleashClient = bootstrap.createUnleash({ api: silentApi });
    const sessionResult = await getSession({ authentication, api });

    const eventManager = bootstrap.eventManager({ api: silentApi });

    const history = bootstrap.createHistory({ sessionResult, pathname: window.location.pathname });

    return { api, authentication, unleashClient, eventManager, history, sessionResult };
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
}: ProtonThunkArguments & {
    signal?: AbortSignal;
    store: MeetStore;
    sessionResult: bootstrap.SessionPayloadData;
    notificationsManager: NotificationsManager;
}) => {
    const dispatch = store.dispatch;

    if (sessionResult.session?.User) {
        dispatch(initEvent({ User: sessionResult.session.User }));
    }

    const [userData, wasmApp] = await Promise.all([
        loadUserData(dispatch, config.APP_NAME),
        initializeWasmApp(authentication),
        bootstrap.loadCrypto({ appName: config.APP_NAME, unleashClient }),
        bootstrap.unleashReady({ unleashClient }).catch(noop),
    ]);

    await bootstrap.postLoad({ appName: config.APP_NAME, authentication, ...userData, history });
    await dispatch(addressesThunk());

    eventManagerSetup({ store, signal, eventManager, unleashClient });

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
}: BootstrapParameters & Pick<ProtonThunkArguments, 'authentication'>) => {
    setupGuestCrossStorage({ appMode, appName: config.APP_NAME });

    const { sessionResult, ...restServices } = await initAppDependencies(config, authentication);

    initElectronClassnames();
    bootstrap.init({ config, authentication, locales });

    const store = setupStore({
        ...restServices,
        authentication,
        notificationsManager,
        config,
    });

    const { userData, wasmApp } = await completeAppBootstrap({
        ...restServices,
        authentication,
        notificationsManager,
        signal,
        store,
        config,
        sessionResult,
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

export const bootstrapGuestApp = async (config: ProtonConfig) => {
    const api = createApi({ config, sendLocaleHeaders: true });

    registerSessionListener({ type: 'all' });
    handleLogoutFromURL({ api });

    const authentication = bootstrap.createAuthentication({ initialAuth: false });
    bootstrap.init({ config, authentication, locales });

    const unauthenticatedApi = createUnauthenticatedApi(api);
    const unleashClient = bootstrap.createUnleash({ api: unauthenticatedApi.apiCallback });

    const [wasmApp] = await Promise.all([
        initializeWasmApp(authentication),
        bootstrap.loadCrypto({ appName: config.APP_NAME, unleashClient }),
    ]);

    const history = createBrowserHistory({ basename: '/guest' });

    await unleashClient.start();

    await unauthenticatedApi.startUnAuthFlow();

    // @ts-ignore
    const store = setupStore({
        api: unauthenticatedApi.apiCallback as ApiWithListener,
        authentication,
        unleashClient,
        config,
        history,
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
