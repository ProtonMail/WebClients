import {
    addressesThunk,
    initEvent,
    serverEvent,
    userSettingsThunk,
    userThunk,
    welcomeFlagsActions,
} from '@proton/account';
import * as bootstrap from '@proton/account/bootstrap';
import { bootstrapEvent } from '@proton/account/bootstrap/action';
import { WasmProtonWalletApiClient } from '@proton/andromeda';
import { type NotificationsManager } from '@proton/components/containers/notifications/manager';
import { setupGuestCrossStorage } from '@proton/cross-storage/account-impl/guestInstance';
import { FeatureCode, fetchFeatures } from '@proton/features';
import createApi from '@proton/shared/lib/api/createApi';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import {
    getPersistedSession,
    registerSessionRemovalListener,
} from '@proton/shared/lib/authentication/persistedSessionStorage';
import { createDrawerApi } from '@proton/shared/lib/drawer/createDrawerApi';
import { getIsAuthorizedApp } from '@proton/shared/lib/drawer/helpers';
import { getAppVersionStr } from '@proton/shared/lib/fetch/headers';
import { getIsIframe } from '@proton/shared/lib/helpers/browser';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import { appMode } from '@proton/shared/lib/webpack.constants';
import noop from '@proton/utils/noop';
import { clearSettings } from '@proton/wallet';
import { extendStore, setupStore } from '@proton/wallet/store';

import locales from './locales';

const getAppContainer = () =>
    import(/* webpackChunkName: "MainContainer" */ './containers/MainContainer').then((result) => result.default);

export const bootstrapApp = async ({
    config,
    signal,
    notificationsManager,
}: {
    config: ProtonConfig;
    signal?: AbortSignal;
    notificationsManager: NotificationsManager;
}) => {
    const appName = config.APP_NAME;
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const isIframe = getIsIframe();
    const parentApp = getAppFromPathnameSafe(pathname);
    const isDrawerApp = isIframe && parentApp && getIsAuthorizedApp(parentApp);

    const api = isDrawerApp ? createDrawerApi({ parentApp, appVersion: config.APP_VERSION }) : createApi({ config });
    const silentApi = getSilentApi(api);
    const authentication = bootstrap.createAuthentication();
    bootstrap.init({ config, authentication, locales });
    setupGuestCrossStorage({ appMode, appName });

    initElectronClassnames();

    const run = async () => {
        const appContainerPromise = getAppContainer();

        const sessionResult =
            (isDrawerApp
                ? await bootstrap.loadDrawerSession({
                      authentication,
                      api,
                      parentApp,
                      pathname,
                  })
                : undefined) || (await bootstrap.loadSession({ authentication, api, pathname, searchParams }));

        const persistedSession = sessionResult.session?.persistedSession || getPersistedSession(authentication.localID);

        const appVersion = getAppVersionStr(getClientID(config.APP_NAME), config.APP_VERSION);

        const walletApi = new WasmProtonWalletApiClient(
            appVersion,
            navigator.userAgent,
            persistedSession?.UserID,
            authentication.UID,
            window.location.origin,
            config.API_URL
        );

        const history = bootstrap.createHistory({ sessionResult, pathname });
        const unleashClient = bootstrap.createUnleash({ api: silentApi });

        extendStore({ config, api, authentication, unleashClient, history, walletApi, notificationsManager });

        const store = setupStore();
        const dispatch = store.dispatch;

        if (sessionResult.session?.User) {
            dispatch(initEvent({ User: sessionResult.session.User }));
        }

        const loadUser = async () => {
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

        const loadPreload = () => {
            return Promise.all([dispatch(addressesThunk())]);
        };

        const userPromise = loadUser();
        const preloadPromise = loadPreload();
        const unleashPromise = bootstrap.unleashReady({ unleashClient }).catch(noop);

        const [MainContainer, userData] = await Promise.all([
            appContainerPromise,
            userPromise,
            bootstrap.loadCrypto({ appName, unleashClient }),
            unleashPromise,
        ]);
        // Needs everything to be loaded.
        await bootstrap.postLoad({ appName, authentication, ...userData, history });
        // Preloaded models are not needed until the app starts, and also important do it postLoad as these requests might fail due to missing scopes.
        await preloadPromise;

        const eventManager = bootstrap.eventManager({ api: silentApi });
        extendStore({ eventManager });
        const unsubscribeEventManager = eventManager.subscribe((event) => {
            dispatch(serverEvent(event));
        });
        eventManager.start();

        bootstrap.onAbort(signal, () => {
            unsubscribeEventManager();
            eventManager.reset();
            unleashClient.stop();
            store.unsubscribe();
        });

        dispatch(bootstrapEvent({ type: 'complete' }));

        // Register callback to clear settings entries on logout
        registerSessionRemovalListener(async () => {
            clearSettings();
        });

        return {
            ...userData,
            eventManager,
            unleashClient,
            history,
            store,
            MainContainer,
        };
    };

    return bootstrap.wrap({ appName, authentication }, run());
};
