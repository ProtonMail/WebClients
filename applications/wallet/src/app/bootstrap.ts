import {
    addressesThunk,
    initEvent,
    serverEvent,
    userSettingsThunk,
    userThunk,
    welcomeFlagsActions,
} from '@proton/account';
import * as bootstrap from '@proton/account/bootstrap';
import { WasmAuthData, WasmProtonWalletApiClient } from '@proton/andromeda';
import { setupGuestCrossStorage } from '@proton/cross-storage/account-impl/guestInstance';
import { FeatureCode, fetchFeatures } from '@proton/features';
import createApi from '@proton/shared/lib/api/createApi';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { createDrawerApi } from '@proton/shared/lib/drawer/createDrawerApi';
import { getIsAuthorizedApp } from '@proton/shared/lib/drawer/helpers';
import { getIsIframe } from '@proton/shared/lib/helpers/browser';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';
import { ProtonConfig } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import locales from './locales';
import { extendStore, setupStore } from './store/store';

const getAppContainer = () =>
    import(/* webpackChunkName: "MainContainer" */ './containers/MainContainer').then((result) => result.default);

export const bootstrapApp = async ({ config, signal }: { config: ProtonConfig; signal?: AbortSignal }) => {
    const pathname = window.location.pathname;
    const isIframe = getIsIframe();
    const parentApp = getAppFromPathnameSafe(pathname);
    const isDrawerApp = isIframe && parentApp && getIsAuthorizedApp(parentApp);

    const api = isDrawerApp ? createDrawerApi({ parentApp, appVersion: config.APP_VERSION }) : createApi({ config });
    const silentApi = getSilentApi(api);
    const authentication = bootstrap.createAuthentication();
    bootstrap.init({ config, authentication, locales });

    // TODO: remove useless arguments when WasmAuthData's contructor signature has changed
    const authData = authentication.UID ? new WasmAuthData(authentication.UID, '', '', []) : undefined;
    const rustApi = new WasmProtonWalletApiClient(authData);

    extendStore({ rustApi });

    setupGuestCrossStorage();
    initElectronClassnames();

    const appName = config.APP_NAME;

    const run = async () => {
        const appContainerPromise = getAppContainer();

        const session =
            (isDrawerApp
                ? await bootstrap.loadDrawerSession({
                      authentication,
                      api,
                      parentApp,
                      pathname,
                  })
                : undefined) || (await bootstrap.loadSession({ authentication, api, pathname }));

        const history = bootstrap.createHistory({ basename: session.payload.basename, path: session.payload.path });
        const unleashClient = bootstrap.createUnleash({ api: silentApi });

        extendStore({ config, api, authentication, unleashClient, history });

        const store = setupStore();
        const dispatch = store.dispatch;

        if (session.payload?.User) {
            dispatch(initEvent({ User: session.payload.User }));
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
        const evPromise = bootstrap.eventManager({ api: silentApi });
        const unleashPromise = bootstrap.unleashReady({ unleashClient }).catch(noop);

        await unleashPromise;
        // Needs unleash to be loaded.
        await bootstrap.loadCrypto({ appName, unleashClient });
        const [MainContainer, userData, eventManager] = await Promise.all([
            appContainerPromise,
            userPromise,
            evPromise,
        ]);
        // Needs everything to be loaded.
        await bootstrap.postLoad({ appName, authentication, ...userData, history });
        // Preloaded models are not needed until the app starts, and also important do it postLoad as these requests might fail due to missing scopes.
        await preloadPromise;

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
