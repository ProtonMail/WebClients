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
import { registerSessionRemovalListener } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import type { UserSettingsResponse } from '@proton/shared/lib/interfaces/drive/userSettings';
import { appMode } from '@proton/shared/lib/webpack.constants';
import noop from '@proton/utils/noop';

import locales from './locales';
import { extendStore, setupStore } from './redux-store/store';
import { getMetricsUserPlan } from './store/_user/getMetricsUserPlan';
import { userSuccessMetrics } from './utils/metrics/userSuccessMetrics';
import { clearOPFS } from './utils/opfs';
import { Features, measureFeaturePerformance } from './utils/telemetry';
import { loadStreamsPolyfill } from './utils/webSteamsPolyfill';
import { unleashVanillaStore } from './zustand/unleash/unleash.store';

export const bootstrapApp = async ({ config, signal }: { config: ProtonConfig; signal?: AbortSignal }) => {
    const appName = config.APP_NAME;
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const api = createApi({ config });
    const silentApi = getSilentApi(api);
    const authentication = bootstrap.createAuthentication();
    bootstrap.init({ config, authentication, locales });
    await userSuccessMetrics.init();
    setupGuestCrossStorage({ appMode, appName });

    initSafariFontFixClassnames();

    const run = async () => {
        const sessionResult = await bootstrap.loadSession({ authentication, api, pathname, searchParams });
        const history = bootstrap.createHistory({ sessionResult, pathname });
        const unleashClient = bootstrap.createUnleash({ api: silentApi });
        const user = sessionResult.session?.User;
        extendStore({ config, api, authentication, unleashClient, history });
        unleashVanillaStore.getState().setClient(unleashClient);
        const store = setupStore();
        const dispatch = store.dispatch;

        if (user) {
            dispatch(initEvent({ User: user }));
        }

        const loadUser = async () => {
            const userFeature = measureFeaturePerformance(api, Features.globalBootstrapAppUserSettings);
            const [user, userSettings, features] = await Promise.all([
                dispatch(userThunk()),
                dispatch(userSettingsThunk()),
                dispatch(fetchFeatures([FeatureCode.EarlyAccessScope])),
            ]);
            userFeature.end();

            dispatch(welcomeFlagsActions.initial(userSettings));

            const userInitFeature = measureFeaturePerformance(api, Features.globalBootstrapAppUserInit);
            const [scopes] = await Promise.all([
                bootstrap.initUser({ appName, user, userSettings }),
                bootstrap.loadLocales({ userSettings, locales }),
            ]);
            userInitFeature.end();

            await userSuccessMetrics.setVersionHeaders(getClientID(config.APP_NAME), config.APP_VERSION);
            await userSuccessMetrics.setLocalUser(
                authentication.getUID(),
                getMetricsUserPlan({ user, isPublicContext: false })
            );
            return { user, userSettings, earlyAccessScope: features[FeatureCode.EarlyAccessScope], scopes };
        };

        const loadUserFeature = measureFeaturePerformance(api, Features.globalBootstrapAppLoadUser);
        const userPromise = loadUser().finally(() => {
            loadUserFeature.end();
        });
        const unleashFeature = measureFeaturePerformance(api, Features.globalBootstrapAppUnleash);
        const unleashPromise = bootstrap
            .unleashReady({ unleashClient })
            .catch(noop)
            .finally(() => {
                unleashFeature.end();
            });
        const cryptoFeature = measureFeaturePerformance(api, Features.globalBootstrapAppCrypto);
        const cryptoPromise = bootstrap.loadCrypto({ appName }).finally(() => {
            cryptoFeature.end();
        });

        const userDataFeature = measureFeaturePerformance(api, Features.globalBootstrapAppUserData);
        const [userData] = await Promise.all([userPromise, cryptoPromise, unleashPromise]);
        userDataFeature.end();

        const postLoadFeature = measureFeaturePerformance(api, Features.globalBootstrapAppPostLoad);
        // postLoad needs everything to be loaded.
        await bootstrap.postLoad({ appName, authentication, ...userData, history });
        postLoadFeature.end();

        const userSettingFeature = measureFeaturePerformance(api, Features.globalBootstrapAppUserSettingsAddress);
        // Preloaded models are not needed until the app starts, and also important do it postLoad as these requests might fail due to missing scopes.
        const [driveUserSettings] = await Promise.all([
            api<UserSettingsResponse>(queryUserSettings()),
            dispatch(addressesThunk()),
            loadStreamsPolyfill(),
        ]).finally(() => {
            userSettingFeature.end();
        });

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

        // Register callback to clear OPFS entries on logout
        const isOPFSEnabled = unleashVanillaStore.getState().isEnabled('DriveWebOPFSDownloadMechanism');
        if (isOPFSEnabled) {
            registerSessionRemovalListener(clearOPFS);
        }

        return {
            ...userData,
            eventManager,
            driveUserSettings,
            unleashClient,
            history,
            store,
        };
    };

    return bootstrap.wrap({ appName, authentication }, run());
};
