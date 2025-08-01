import {
    addressesThunk,
    initEvent,
    serverEvent,
    startLogoutListener,
    userSettingsThunk,
    userThunk,
    welcomeFlagsActions,
} from '@proton/account';
import * as bootstrap from '@proton/account/bootstrap';
import { bootstrapEvent } from '@proton/account/bootstrap/action';
import { getDecryptedPersistedState } from '@proton/account/persist/helper';
import { createCalendarModelEventManager } from '@proton/calendar';
import { setupGuestCrossStorage } from '@proton/cross-storage/account-impl/guestInstance';
import { FeatureCode, fetchFeatures } from '@proton/features';
import { categoriesThunk, contactEmailsThunk, mailSettingsThunk } from '@proton/mail';
import createApi from '@proton/shared/lib/api/createApi';
import { getEvents } from '@proton/shared/lib/api/events';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { generateLoggerKey } from '@proton/shared/lib/authentication/loggerKey';
import { loadAllowedTimeZones } from '@proton/shared/lib/date/timezone';
import { listenFreeTrialSessionExpiration } from '@proton/shared/lib/desktop/endOfTrialHelpers';
import { handleInboxDesktopIPCPostMessages } from '@proton/shared/lib/desktop/ipcHelpers';
import { getIsIframe, isChromiumBased } from '@proton/shared/lib/helpers/browser';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import logger from '@proton/shared/lib/logger';
import initLogicalProperties from '@proton/shared/lib/logical/logical';
import { appMode } from '@proton/shared/lib/webpack.constants';
import noop from '@proton/utils/noop';

import { registerMailToProtocolHandler } from 'proton-mail/helpers/url';

import locales from './locales';
import { type MailState, extendStore, setupStore } from './store/store';

const getAppContainer = () =>
    import(/* webpackChunkName: "MainContainer" */ './MainContainer').then((result) => result.default);

export const bootstrapApp = async ({ config, signal }: { config: ProtonConfig; signal?: AbortSignal }) => {
    const appName = config.APP_NAME;
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const api = createApi({ config });
    const silentApi = getSilentApi(api);
    const authentication = bootstrap.createAuthentication();
    bootstrap.init({ config, authentication, locales });
    setupGuestCrossStorage({ appMode, appName });
    initElectronClassnames();
    initLogicalProperties();
    initSafariFontFixClassnames();
    startLogoutListener();
    // If the browser is Chromium based, register automatically the mailto protocol handler
    if (isChromiumBased()) {
        registerMailToProtocolHandler();
    }

    if (isElectronMail) {
        listenFreeTrialSessionExpiration(appName, authentication, api);

        if (!getIsIframe()) {
            handleInboxDesktopIPCPostMessages();
        }
    }

    const run = async () => {
        const appContainerPromise = getAppContainer();
        const sessionResult = await bootstrap.loadSession({ authentication, api, pathname, searchParams });

        const history = bootstrap.createHistory({ sessionResult, pathname });
        const unleashClient = bootstrap.createUnleash({ api: silentApi });
        const unleashPromise = bootstrap.unleashReady({ unleashClient }).catch(noop);

        const user = sessionResult.session?.User;
        extendStore({ config, api, authentication, unleashClient, history });

        const persistedState = await getDecryptedPersistedState<Partial<MailState>>({
            authentication,
            user,
        });

        const store = setupStore({ preloadedState: persistedState?.state });
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
                        FeatureCode.ESAutomaticBackgroundIndexing,
                        FeatureCode.MailActionsChunkSize,
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
        loadPreloadButIgnored();

        const [MainContainer, userData] = await Promise.all([
            appContainerPromise,
            userPromise,
            bootstrap.loadCrypto({ appName, unleashClient }),
            unleashPromise,
        ]);

        // Initialize logger if the feature flag is enabled
        if (unleashClient.isEnabled('CollectLogs')) {
            const { key: loggerKey, ID: loggerID } = await generateLoggerKey(authentication);
            void logger.initialize({
                encryptionKey: loggerKey,
                appName,
                loggerID,
                loggerName: 'main',
            });
        }
        // postLoad needs everything to be loaded.
        await bootstrap.postLoad({ appName, authentication, ...userData, history });
        // Preloaded models are not needed until the app starts, and also important do it postLoad as these requests might fail due to missing scopes.
        await preloadPromise;

        const eventManager = bootstrap.eventManager({
            api: silentApi,
            query: (eventID: string) => getEvents(eventID, { ConversationCounts: 1, MessageCounts: 1 }),
        });
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
