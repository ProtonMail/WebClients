import {
    addressesThunk,
    initEvent,
    serverEvent,
    userSettingsThunk,
    userThunk,
    welcomeFlagsActions,
} from '@proton/account';
import * as bootstrap from '@proton/account/bootstrap';
import {
    calendarSettingsThunk,
    calendarsThunk,
    createCalendarModelEventManager,
    holidayCalendarsThunk,
} from '@proton/calendar';
import { setupGuestCrossStorage } from '@proton/cross-storage/account-impl/guestInstance';
import { FeatureCode, fetchFeatures } from '@proton/features';
import createApi from '@proton/shared/lib/api/createApi';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { loadAllowedTimeZones } from '@proton/shared/lib/date/timezone';
import { createDrawerApi } from '@proton/shared/lib/drawer/createDrawerApi';
import { getIsAuthorizedApp } from '@proton/shared/lib/drawer/helpers';
import { getIsIframe } from '@proton/shared/lib/helpers/browser';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';
import { ProtonConfig } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import locales from './locales';
import { extendStore, setupStore } from './store/store';

const getAppContainer = () =>
    import(/* webpackChunkName: "MainContainer" */ './containers/calendar/MainContainer').then(
        (result) => result.default
    );

export const bootstrapApp = async ({ config, signal }: { config: ProtonConfig; signal?: AbortSignal }) => {
    const pathname = window.location.pathname;
    const isIframe = getIsIframe();
    const parentApp = getAppFromPathnameSafe(pathname);
    const isDrawerApp = isIframe && parentApp && getIsAuthorizedApp(parentApp);

    const api = isDrawerApp ? createDrawerApi({ parentApp, appVersion: config.APP_VERSION }) : createApi({ config });
    const silentApi = getSilentApi(api);
    const authentication = bootstrap.createAuthentication();
    bootstrap.init({ config, authentication, locales });

    setupGuestCrossStorage();
    initElectronClassnames();

    const appName = config.APP_NAME;

    const run = async () => {
        const appContainer = getAppContainer();
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

        const setupModels = async () => {
            const [user, userSettings, features] = await Promise.all([
                dispatch(userThunk()),
                dispatch(userSettingsThunk()),
                dispatch(
                    fetchFeatures([
                        FeatureCode.EarlyAccessScope,
                        FeatureCode.CalendarFetchMetadataOnly,
                        FeatureCode.AutoAddHolidaysCalendars,
                    ])
                ),
                dispatch(addressesThunk()),
                dispatch(calendarsThunk()),
                dispatch(calendarSettingsThunk()),
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
            eventManager,
            unleashClient,
            history,
            store,
            MainContainer,
        };
    };

    return bootstrap.wrap({ appName, authentication }, run());
};
