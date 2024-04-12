import { initEvent, serverEvent, userSettingsThunk, userThunk, welcomeFlagsActions } from '@proton/account';
import * as bootstrap from '@proton/account/bootstrap';
import { getDecryptedPersistedState } from '@proton/account/persist/helper';
import { createCalendarModelEventManager, holidaysDirectoryThunk } from '@proton/calendar';
import { initMainHost } from '@proton/cross-storage';
import { FeatureCode, fetchFeatures } from '@proton/features';
import { mailSettingsThunk } from '@proton/mail';
import createApi from '@proton/shared/lib/api/createApi';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { loadAllowedTimeZones } from '@proton/shared/lib/date/timezone';
import { listenFreeTrialSessionExpiration } from '@proton/shared/lib/desktop/endOfTrialHelpers';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import { ProtonConfig } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import locales from '../locales';
import { AccountState, extendStore, setupStore } from '../store/store';

const getAppContainer = () =>
    import(/* webpackChunkName: "MainContainer" */ './SetupMainContainer').then((result) => result.default);

export const bootstrapApp = async ({ config, signal }: { config: ProtonConfig; signal?: AbortSignal }) => {
    const pathname = window.location.pathname;
    const api = createApi({ config });
    const silentApi = getSilentApi(api);
    const authentication = bootstrap.createAuthentication();
    bootstrap.init({ config, authentication, locales });
    initMainHost();
    initElectronClassnames();
    initSafariFontFixClassnames();

    const appName = config.APP_NAME;

    if (isElectronMail) {
        listenFreeTrialSessionExpiration(api);
    }

    const run = async () => {
        const appContainerPromise = getAppContainer();
        const session = await bootstrap.loadSession({ api, authentication, pathname });

        const history = bootstrap.createHistory({ basename: session.payload.basename, path: session.payload.path });
        const unleashClient = bootstrap.createUnleash({ api: silentApi });
        const unleashPromise = bootstrap.unleashReady({ unleashClient }).catch(noop);

        const user = session.payload?.User;
        extendStore({ config, api, authentication, history, unleashClient });

        let persistedState = await getDecryptedPersistedState<Partial<AccountState>>({
            authentication,
            user,
        });

        if (persistedState) {
            await unleashPromise;
            if (!unleashClient.isEnabled('PersistedState')) {
                persistedState = undefined;
            }
        }

        const store = setupStore({ preloadedState: persistedState?.state, mode: 'default' });
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

            return { user, userSettings, earlyAccessScope: features[FeatureCode.EarlyAccessScope], scopes };
        };

        const loadPreload = () => {
            return Promise.all([dispatch(mailSettingsThunk())]);
        };

        const loadPreloadButIgnored = () => {
            loadAllowedTimeZones(silentApi).catch(noop);
            dispatch(holidaysDirectoryThunk()).catch(noop);
        };

        const userPromise = loadUser();
        const preloadPromise = loadPreload();
        const evPromise = bootstrap.eventManager({ api: silentApi, eventID: persistedState?.eventID });
        loadPreloadButIgnored();

        // Needs unleash to be loaded. NOTE: It might have already gotten loaded previously.
        await unleashPromise;
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

        const calendarModelEventManager = createCalendarModelEventManager({ api: silentApi });

        extendStore({ eventManager, calendarModelEventManager });
        const unsubscribeEventManager = eventManager.subscribe((event) => {
            dispatch(serverEvent(event));
        });
        eventManager.start();

        if (persistedState?.eventID) {
            setTimeout(() => {
                eventManager.call();
                // If we're resuming a session, we'd like to call the ev to get up-to-speed.
                // This is in an arbitrary timeout since there are some consumers who subscribe through react useEffects triggered later through the app.
            }, 550);
        }

        bootstrap.onAbort(signal, () => {
            unsubscribeEventManager();
            eventManager.reset();
            unleashClient.stop();
            store.unsubscribe();
        });

        dispatch(bootstrap.bootstrapEvent({ type: 'complete' }));

        return {
            ...userData,
            store,
            eventManager,
            unleashClient,
            history,
            MainContainer,
        };
    };

    return bootstrap.wrap({ appName, authentication }, run());
};
