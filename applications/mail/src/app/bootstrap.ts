import {
    addressesThunk,
    initEvent,
    organizationThunk,
    retentionPoliciesThunk,
    serverEvent,
    startLogoutListener,
    userSettingsThunk,
    userThunk,
    welcomeFlagsActions,
} from '@proton/account';
import * as bootstrap from '@proton/account/bootstrap';
import { bootstrapEvent } from '@proton/account/bootstrap/action';
import { getDecryptedPersistedState } from '@proton/account/persist/helper';
import { createCalendarModelEventManager } from '@proton/calendar/calendarModelEventManager';
import { setupGuestCrossStorage } from '@proton/cross-storage/account-impl/guestInstance';
import { FeatureCode, fetchFeatures } from '@proton/features';
import { categoriesThunk } from '@proton/mail/store/labels';
import { contactEmailsThunk } from '@proton/mail/store/contactEmails';
import { mailSettingsThunk } from '@proton/mail/store/mailSettings';
import createApi from '@proton/shared/lib/api/createApi';
import { getEvents } from '@proton/shared/lib/api/events';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { generateLoggerKey } from '@proton/shared/lib/authentication/loggerKey';
import { loadAllowedTimeZones } from '@proton/shared/lib/date/timezone';
import { isChromiumBased } from '@proton/shared/lib/helpers/browser';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import logger from '@proton/shared/lib/logger';
import { appMode } from '@proton/shared/lib/webpack.constants';
import { CommonFeatureFlag } from '@proton/unleash/UnleashFeatureFlags';
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
    initSafariFontFixClassnames();
    startLogoutListener();
    // If the browser is Chromium based, register automatically the mailto protocol handler
    if (isChromiumBased()) {
        registerMailToProtocolHandler();
    }

    if (isElectronMail) {
        void import('@proton/shared/lib/desktop/bootstrapMailInboxDesktop').then((module) => {
            module.bootstrapMailInboxDesktop({
                config,
                authentication,
                api,
            });
        });
    }

    const run = async () => {
        const appContainerPromise = getAppContainer();
        const sessionResult = await bootstrap.loadSession({ authentication, api, pathname, searchParams });

        const history = bootstrap.createHistory({ sessionResult, pathname });
        const unleashClient = bootstrap.createUnleash({ api: silentApi });
        const unleashPromise = bootstrap
            .unleashReady({ unleashClient })
            .then(() => {
                // If the WebApiRateLimiter flag is enabled, configure the rate limiter with the payload value
                if (unleashClient.isEnabled(CommonFeatureFlag.WebApiRateLimiter)) {
                    const config = unleashClient.getVariant(CommonFeatureFlag.WebApiRateLimiter).payload?.value;

                    if (config) {
                        const configParsed = JSON.parse(config);
                        api.apiRateLimiter.configure({
                            maxRequests: configParsed.maxRequests,
                            windowMs: configParsed.windowMs,
                        });
                    }

                    api.apiRateLimiter.enable();
                }
            })
            .catch(noop);

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
                        FeatureCode.MailActionsChunkSize,
                        FeatureCode.AccountSecurityDismissed2FACard,
                    ])
                ),
            ]);

            dispatch(welcomeFlagsActions.initial(userSettings));

            const [scopes] = await Promise.all([
                bootstrap.enableTelemetryBasedOnUserSettings({ userSettings }),
                bootstrap.loadLocales({ userSettings, locales }),
            ]);

            return { user, userSettings, earlyAccessScope: features[FeatureCode.EarlyAccessScope], scopes };
        };

        const loadPreload = () => {
            return Promise.all([
                dispatch(categoriesThunk()),
                dispatch(mailSettingsThunk()),
                dispatch(organizationThunk()),
                dispatch(addressesThunk()),
                dispatch(contactEmailsThunk()),
            ]);
        };

        const loadPreloadButIgnored = () => {
            loadAllowedTimeZones(silentApi).catch(noop);
            dispatch(retentionPoliciesThunk()).catch(noop);
        };

        const preloadPromise = loadPreload();
        const userPromise = loadUser();
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
        const [, mailSettings, organization] = await preloadPromise;

        const OnlyInInboxForCategoriesCounts =
            organization.Settings.MailCategoryViewEnabled && mailSettings.MailCategoryView ? 1 : 0;

        const eventManager = bootstrap.eventManager({
            api: silentApi,
            query: (eventID: string) =>
                getEvents(eventID, {
                    ConversationCounts: 1,
                    MessageCounts: 1,
                    OnlyInInboxForCategoriesCounts,
                }),
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
