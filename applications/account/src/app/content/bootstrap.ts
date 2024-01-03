import { initEvent, serverEvent, userSettingsThunk, userThunk, welcomeFlagsActions } from '@proton/account';
import * as bootstrap from '@proton/account/bootstrap';
import { createCalendarModelEventManager, holidayCalendarsThunk } from '@proton/calendar';
import { initMainHost } from '@proton/cross-storage';
import { FeatureCode, fetchFeatures } from '@proton/features';
import { mailSettingsThunk } from '@proton/mail';
import createApi from '@proton/shared/lib/api/createApi';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { loadAllowedTimeZones } from '@proton/shared/lib/date/timezone';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';
import { ProtonConfig } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import locales from '../locales';
import { extendStore, setupStore } from '../store/store';

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

    const appName = config.APP_NAME;

    const run = async () => {
        const appContainer = getAppContainer();
        const session = await bootstrap.loadSession({ api, authentication, pathname });

        const history = bootstrap.createHistory({ basename: session.payload.basename, path: session.payload.path });
        const unleashClient = bootstrap.createUnleash({ api: silentApi });

        const store = setupStore();
        const dispatch = store.dispatch;
        extendStore({ config, api, authentication, history, unleashClient });

        if (session.payload?.User) {
            dispatch(initEvent({ User: session.payload.User }));
        }

        const setupModels = async () => {
            const [user, userSettings, features] = await Promise.all([
                dispatch(userThunk()),
                dispatch(userSettingsThunk()),
                dispatch(fetchFeatures([FeatureCode.EarlyAccessScope])),
                dispatch(mailSettingsThunk()),
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
            dispatch(holidayCalendarsThunk()).catch(noop);
        };

        const [models, eventManager] = await Promise.all([
            setupModels(),
            bootstrap.eventManager({ api: silentApi }),
            bootstrap.unleashReady({ unleashClient }),
            ignored(),
        ]);

        // Needs unleash to be loaded.
        await bootstrap.loadCrypto({ appName, unleashClient });
        const MainContainer = await appContainer;
        // Needs everything to be loaded.
        await bootstrap.postLoad({ appName, authentication, ...models, history });

        const calendarModelEventManager = createCalendarModelEventManager({ api: silentApi });

        extendStore({ eventManager, calendarModelEventManager });
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
            store,
            eventManager,
            unleashClient,
            history,
            MainContainer,
        };
    };

    return bootstrap.wrap({ appName, authentication }, run());
};
