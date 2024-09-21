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
import {
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
import noop from '@proton/utils/noop';

import { embeddedDrawerAppInfos } from './helpers/drawer';
import locales from './locales';
import { extendStore, setupStore } from './store/store';

const getAppContainer = () =>
    import(/* webpackChunkName: "MainContainer" */ './containers/calendar/MainContainer').then(
        (result) => result.default
    );

const { isIframe, isDrawerApp, parentApp } = embeddedDrawerAppInfos;

export const bootstrapApp = async ({ config, signal }: { config: ProtonConfig; signal?: AbortSignal }) => {
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);

    const api = isDrawerApp ? createDrawerApi({ parentApp, appVersion: config.APP_VERSION }) : createApi({ config });
    const silentApi = getSilentApi(api);
    const authentication = bootstrap.createAuthentication();
    bootstrap.init({ config, authentication, locales });

    setupGuestCrossStorage();
    initElectronClassnames();
    initSafariFontFixClassnames();

    const appName = config.APP_NAME;

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
                dispatch(
                    fetchFeatures([
                        FeatureCode.EarlyAccessScope,
                        FeatureCode.CalendarFetchMetadataOnly,
                        FeatureCode.AutoAddHolidaysCalendars,
                    ])
                ),
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
        };

        const userPromise = loadUser();
        const preloadPromise = loadPreload();
        const evPromise = bootstrap.eventManager({ api: silentApi });
        const unleashPromise = bootstrap.unleashReady({ unleashClient }).catch(noop);
        loadPreloadButIgnored();

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
