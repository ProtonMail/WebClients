import {
    addressesThunk,
    initEvent,
    serverEvent,
    userSettingsThunk,
    userThunk,
    welcomeFlagsActions,
} from '@proton/account';
import * as bootstrap from '@proton/account/bootstrap';
import { setupGuestCrossStorage } from '@proton/cross-storage/account-impl/guestInstance';
import { FeatureCode, fetchFeatures } from '@proton/features';
import createApi from '@proton/shared/lib/api/createApi';
import { queryUserSettings } from '@proton/shared/lib/api/drive/userSettings';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { loadAllowedTimeZones } from '@proton/shared/lib/date/timezone';
import { ProtonConfig } from '@proton/shared/lib/interfaces';
import { UserSettingsResponse } from '@proton/shared/lib/interfaces/drive/userSettings';
import noop from '@proton/utils/noop';

import locales from './locales';
import { extendStore, setupStore } from './redux-store/store';
import { sendErrorReport } from './utils/errorHandling';
import { getRefreshError } from './utils/errorHandling/RefreshError';

const getAppContainer = () =>
    import(/* webpackChunkName: "MainContainer" */ './containers/MainContainer')
        .then((result) => result.default)
        .catch((e) => {
            console.warn(e);
            sendErrorReport(e);

            return Promise.reject(getRefreshError());
        });

export const bootstrapApp = async ({ config, signal }: { config: ProtonConfig; signal?: AbortSignal }) => {
    const pathname = window.location.pathname;
    const api = createApi({ config });
    const silentApi = getSilentApi(api);
    const authentication = bootstrap.createAuthentication();
    bootstrap.init({ config, authentication, locales });
    setupGuestCrossStorage();
    const appName = config.APP_NAME;

    const run = async () => {
        const appContainer = getAppContainer();
        const session = await bootstrap.loadSession({ authentication, api, pathname });
        const history = bootstrap.createHistory({ basename: session.payload.basename, path: session.payload.path });
        const unleashClient = bootstrap.createUnleash({ api: silentApi });

        extendStore({ config, api, authentication, unleashClient, history });
        const store = setupStore();
        const dispatch = store.dispatch;

        if (session.payload?.User) {
            dispatch(initEvent({ User: session.payload.User }));
        }

        const setupModels = async () => {
            const [user, userSettings, features] = await Promise.all([
                dispatch(userThunk()),
                dispatch(userSettingsThunk()),
                dispatch(fetchFeatures([FeatureCode.EarlyAccessScope])),
                dispatch(addressesThunk()),
            ]);

            dispatch(welcomeFlagsActions.initial(userSettings));

            const [scopes] = await Promise.all([
                bootstrap.initUser({ appName, user, userSettings }),
                bootstrap.loadLocales({ userSettings, locales }),
            ]);

            return { user, userSettings, earlyAccessScope: features[FeatureCode.EarlyAccessScope], scopes };
        };
        const ignored = () => {
            loadAllowedTimeZones(silentApi).catch(noop);
        };

        const [models, eventManager, driveUserSettings] = await Promise.all([
            setupModels(),
            bootstrap.eventManager({ api: silentApi }),
            api<UserSettingsResponse>(queryUserSettings()),
            bootstrap.unleashReady({ unleashClient }),
            ignored(),
        ]);

        // Needs unleash to be loaded.
        await bootstrap.loadCrypto({ appName, unleashClient });
        const MainContainer = await appContainer;
        // Needs everything to be loaded.
        await bootstrap.postLoad({ appName, authentication, ...models, history });

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
            ...models,
            eventManager,
            driveUserSettings,
            unleashClient,
            history,
            store,
            MainContainer,
        };
    };

    return bootstrap.wrap({ appName, authentication }, run());
};
