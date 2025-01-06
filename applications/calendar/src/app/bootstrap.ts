import {
    addressesThunk,
    initEvent,
    organizationThunk,
    serverEvent,
    startLogoutListener,
    userSettingsThunk,
    userThunk,
    welcomeFlagsActions,
} from '@proton/account';
import * as bootstrap from '@proton/account/bootstrap';
import { bootstrapEvent } from '@proton/account/bootstrap/action';
import { getDecryptedPersistedState } from '@proton/account/persist/helper';
import {
    calendarBootstrapThunk,
    calendarSettingsThunk,
    calendarsThunk,
    createCalendarModelEventManager,
    holidaysDirectoryThunk,
} from '@proton/calendar';
import { setupGuestCrossStorage } from '@proton/cross-storage/account-impl/guestInstance';
import { FeatureCode, fetchFeatures } from '@proton/features';
import createApi from '@proton/shared/lib/api/createApi';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { loadAllowedTimeZones } from '@proton/shared/lib/date/timezone';
import { listenFreeTrialSessionExpiration } from '@proton/shared/lib/desktop/endOfTrialHelpers';
import { createDrawerApi } from '@proton/shared/lib/drawer/createDrawerApi';
import { getIsAuthorizedApp } from '@proton/shared/lib/drawer/helpers';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import initLogicalProperties from '@proton/shared/lib/logical/logical';
import { appMode } from '@proton/shared/lib/webpack.constants';
import noop from '@proton/utils/noop';

import { embeddedDrawerAppInfos } from './helpers/drawer';
import locales from './locales';
import { type CalendarState } from './store/rootReducer';
import { extendStore, setupStore } from './store/store';

const getAppContainer = () =>
    import(/* webpackChunkName: "MainContainer" */ './containers/calendar/MainContainer').then(
        (result) => result.default
    );

const { isIframe, isDrawerApp, parentApp } = embeddedDrawerAppInfos;

export const bootstrapApp = async ({ config, signal }: { config: ProtonConfig; signal?: AbortSignal }) => {
    const appName = config.APP_NAME;
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);

    const api = isDrawerApp ? createDrawerApi({ parentApp, appVersion: config.APP_VERSION }) : createApi({ config });
    const silentApi = getSilentApi(api);
    const authentication = bootstrap.createAuthentication();
    bootstrap.init({ config, authentication, locales });

    setupGuestCrossStorage({ appMode, appName });
    initElectronClassnames();
    initLogicalProperties();
    initSafariFontFixClassnames();
    startLogoutListener();

    if (isElectronMail) {
        listenFreeTrialSessionExpiration(appName, authentication, api);
    }

    // Temporary log for debugging
    if (isIframe && !isDrawerApp) {
        captureMessage('Drawer iframe bootstrap', {
            level: 'info',
            extra: {
                isIframe,
                parentApp,
                isAuthorizedApp: getIsAuthorizedApp(parentApp || ''),
                locationOrigin: window.location.origin,
                locationHref: window.location.href,
            },
        });
    }

    const run = async () => {
        const appContainerPromise = getAppContainer();
        // Persisted state is not enabled in the drawer app. This is because in drawer mode, it uses the client key
        // of the parent app. Since that's different from the client key in the calendar app itself, the persisted
        // state db will get encrypted with a different key and they'll both be writing to the same value but they
        // won't be decryptable outside of its own context. Easiest way to solve that is probably to pass a prefix
        // so that the drawer app writes to a different key.
        const isPersistEnabled = !isDrawerApp;

        const sessionResult =
            (isDrawerApp && parentApp
                ? await bootstrap.loadDrawerSession({
                      authentication,
                      api,
                      parentApp,
                      pathname,
                  })
                : undefined) || (await bootstrap.loadSession({ authentication, api, pathname, searchParams }));

        const history = bootstrap.createHistory({ sessionResult, pathname });
        const unleashClient = bootstrap.createUnleash({ api: silentApi });
        const unleashPromise = bootstrap.unleashReady({ unleashClient }).catch(noop);

        const user = sessionResult.session?.User;
        extendStore({ config, api, authentication, unleashClient, history });

        const persistedState = isPersistEnabled
            ? await getDecryptedPersistedState<Partial<CalendarState>>({
                  authentication,
                  user,
              })
            : undefined;

        const store = setupStore({ preloadedState: persistedState?.state, persist: isPersistEnabled });
        const dispatch = store.dispatch;

        if (user) {
            dispatch(initEvent({ User: user }));
        }

        const loadUser = async () => {
            const [user, userSettings, features] = await Promise.all([
                dispatch(userThunk()),
                dispatch(userSettingsThunk()),
                dispatch(fetchFeatures([FeatureCode.EarlyAccessScope, FeatureCode.AutoAddHolidaysCalendars])),
            ]);

            dispatch(welcomeFlagsActions.initial(userSettings));

            const [scopes] = await Promise.all([
                bootstrap.initUser({ appName, user, userSettings }),
                bootstrap.loadLocales({ userSettings, locales }),
            ]);

            return { user, userSettings, earlyAccessScope: features[FeatureCode.EarlyAccessScope], scopes };
        };

        const loadPreload = () => {
            return Promise.all([
                dispatch(addressesThunk()),
                dispatch(calendarsThunk()),
                dispatch(calendarSettingsThunk()),
            ]);
        };

        const loadPreloadButIgnored = () => {
            loadAllowedTimeZones(silentApi).catch(noop);
            dispatch(holidaysDirectoryThunk()).catch(noop);
            dispatch(organizationThunk()).catch(noop);
            dispatch(calendarsThunk())
                .then((calendars) => {
                    calendars.forEach((calendar) => {
                        dispatch(calendarBootstrapThunk({ calendarID: calendar.ID })).catch(noop);
                    });
                })
                .catch(noop);
        };

        const userPromise = loadUser();
        const preloadPromise = loadPreload();
        loadPreloadButIgnored();

        const [MainContainer, userData] = await Promise.all([
            appContainerPromise,
            userPromise,
            bootstrap.loadCrypto({ appName }),
            unleashPromise,
        ]);
        // postLoad needs everything to be loaded.
        await bootstrap.postLoad({ appName, authentication, ...userData, history });
        // Preloaded models are not needed until the app starts, and also important do it postLoad as these requests might fail due to missing scopes.
        await preloadPromise;

        const eventManager = bootstrap.eventManager({ api: silentApi });
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

        dispatch(bootstrapEvent({ type: 'complete' }));

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
