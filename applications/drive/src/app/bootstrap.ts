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
import { setupGuestCrossStorage } from '@proton/cross-storage/account-impl/guestInstance';
import { FeatureCode, fetchFeatures } from '@proton/features';
import createApi from '@proton/shared/lib/api/createApi';
import { queryUserSettings } from '@proton/shared/lib/api/drive/user';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import type { UserSettingsResponse } from '@proton/shared/lib/interfaces/drive/userSettings';
import type { UnleashClient } from '@proton/unleash';
import noop from '@proton/utils/noop';

import locales from './locales';
import { extendStore, setupStore } from './redux-store/store';
import { sendErrorReport } from './utils/errorHandling';
import { getWebpackChunkFailedToLoadError } from './utils/errorHandling/WebpackChunkFailedToLoadError';
import { initDriveWorker } from './utils/initDriveWorker';
import { userSuccessMetrics } from './utils/metrics/userSuccessMetrics';

const getAppContainer = () =>
    import(/* webpackChunkName: "MainContainer" */ './containers/MainContainer')
        .then((result) => result.default)
        .catch((e) => {
            const report = getWebpackChunkFailedToLoadError(e, 'MainContainer');
            console.warn(report);
            sendErrorReport(report);
            return Promise.reject(report);
        });

/* TODO: To be removed after test DRVWEB-4375 */
const setIsSWForSafariEnabled = (unleashClient: UnleashClient) => {
    if (typeof window !== 'undefined') {
        (window as any).isSWForSafariEnabled = unleashClient.isEnabled('DriveWebDownloadSWModernBrowsers');
    }
};

export const bootstrapApp = async ({ config, signal }: { config: ProtonConfig; signal?: AbortSignal }) => {
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const api = createApi({ config });
    const silentApi = getSilentApi(api);
    const authentication = bootstrap.createAuthentication();
    bootstrap.init({ config, authentication, locales });
    await userSuccessMetrics.init();
    setupGuestCrossStorage();
    const appName = config.APP_NAME;

    initSafariFontFixClassnames();
    initDriveWorker();

    const run = async () => {
        const appContainerPromise = getAppContainer();
        const sessionResult = await bootstrap.loadSession({ authentication, api, pathname, searchParams });
        const history = bootstrap.createHistory({ sessionResult, pathname });
        const unleashClient = bootstrap.createUnleash({ api: silentApi });
        /* TODO: To be removed after test DRVWEB-4375 */
        setIsSWForSafariEnabled(unleashClient);
        const user = sessionResult.session?.User;
        extendStore({ config, api, authentication, unleashClient, history });
        const store = setupStore();
        const dispatch = store.dispatch;

        if (user) {
            dispatch(initEvent({ User: user }));
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

            await userSuccessMetrics.setVersionHeaders(getClientID(config.APP_NAME), config.APP_VERSION);
            await userSuccessMetrics.setLocalUser(authentication.getUID(), user.isPaid);
            return { user, userSettings, earlyAccessScope: features[FeatureCode.EarlyAccessScope], scopes };
        };

        const loadPreload = () => {
            return Promise.all([api<UserSettingsResponse>(queryUserSettings()), dispatch(addressesThunk())]);
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
        const [driveUserSettings] = await preloadPromise;

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

        return {
            ...userData,
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
