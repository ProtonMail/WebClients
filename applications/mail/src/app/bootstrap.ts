import {
    addressesThunk,
    initEvent,
    serverEvent,
    userSettingsThunk,
    userThunk,
    welcomeFlagsActions,
} from '@proton/account';
import * as bootstrap from '@proton/account/bootstrap';
import { createCalendarModelEventManager } from '@proton/calendar';
import { setupGuestCrossStorage } from '@proton/cross-storage/account-impl/guestInstance';
import { FeatureCode, fetchFeatures } from '@proton/features';
import { categoriesThunk, contactEmailsThunk, mailSettingsThunk } from '@proton/mail';
import createApi from '@proton/shared/lib/api/createApi';
import { getEvents } from '@proton/shared/lib/api/events';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { loadAllowedTimeZones } from '@proton/shared/lib/date/timezone';
import { listenFreeTrialSessionExpiration } from '@proton/shared/lib/desktop/endOfTrialHelpers';
import { isChromiumBased } from '@proton/shared/lib/helpers/browser';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import { ProtonConfig } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { registerMailToProtocolHandler } from 'proton-mail/helpers/url';

import locales from './locales';
import { extendStore, setupStore } from './store/store';

const getAppContainer = () =>
    import(/* webpackChunkName: "MainContainer" */ './MainContainer').then((result) => result.default);

export const bootstrapApp = async ({ config, signal }: { config: ProtonConfig; signal?: AbortSignal }) => {
    const pathname = window.location.pathname;
    const api = createApi({ config });
    const silentApi = getSilentApi(api);
    const authentication = bootstrap.createAuthentication();
    bootstrap.init({ config, authentication, locales });
    setupGuestCrossStorage();
    initElectronClassnames();
    initSafariFontFixClassnames();
    // If the browser is Chromium based, register automatically the mailto protocol handler
    if (isChromiumBased()) {
        registerMailToProtocolHandler();
    }

    const appName = config.APP_NAME;

    if (isElectronMail) {
        listenFreeTrialSessionExpiration(api);
    }

    const run = async () => {
        const appContainerPromise = getAppContainer();
        const session = await bootstrap.loadSession({ authentication, api, pathname });

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
                dispatch(
                    fetchFeatures([
                        FeatureCode.EarlyAccessScope,
                        FeatureCode.CleanUTMTrackers,
                        FeatureCode.ESAutomaticBackgroundIndexing,
                        FeatureCode.MailActionsChunkSize,
                        FeatureCode.SLIntegration,
                        FeatureCode.AccountSecurityDismissed2FACard,
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
                dispatch(mailSettingsThunk()),
                dispatch(contactEmailsThunk()),
                dispatch(categoriesThunk()),
            ]);
        };

        const loadPreloadButIgnored = () => {
            loadAllowedTimeZones(silentApi).catch(noop);
        };

        const userPromise = loadUser();
        const preloadPromise = loadPreload();
        const evPromise = bootstrap.eventManager({
            api: silentApi,
            query: (eventID: string) => getEvents(eventID, { ConversationCounts: 1, MessageCounts: 1 }),
        });
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
