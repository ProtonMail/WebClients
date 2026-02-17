import {
    initEvent,
    serverEvent,
    startLogoutListener,
    userSettingsThunk,
    userThunk,
    welcomeFlagsActions,
} from '@proton/account';
import * as bootstrap from '@proton/account/bootstrap';
import { bootstrapEvent } from '@proton/account/bootstrap/action';
import { coreEventLoopV6 } from '@proton/account/coreEventLoop';
import { getDecryptedPersistedState } from '@proton/account/persist/helper';
import { calendarEventLoopV6 } from '@proton/calendar/calendarEventLoop';
import { createCalendarModelEventManager } from '@proton/calendar/calendarModelEventManager';
import { initMainHost } from '@proton/cross-storage';
import { FeatureCode, fetchFeatures } from '@proton/features';
import { contactEventLoopV6 } from '@proton/mail/store/contactEventLoop';
import { mailEventLoopV6 } from '@proton/mail/store/mailEventLoop';
import createApi from '@proton/shared/lib/api/createApi';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { getOAuthSettingsUrl } from '@proton/shared/lib/authentication/fork/oauth2SettingsUrl';
import { getPersistedSession } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { APPS, APPS_CONFIGURATION } from '@proton/shared/lib/constants';
import { listenFreeTrialSessionExpiration } from '@proton/shared/lib/desktop/endOfTrialHelpers';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import { telemetry } from '@proton/shared/lib/telemetry';
import noop from '@proton/utils/noop';

import locales from '../locales';
import type { AccountState } from '../store/store';
import { extendStore, setupStore } from '../store/store';

export const bootstrapApp = async ({ config, signal }: { config: ProtonConfig; signal?: AbortSignal }) => {
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const api = createApi({ config });
    const silentApi = getSilentApi(api);
    const authentication = bootstrap.createAuthentication();
    bootstrap.init({ config, authentication, locales });
    initMainHost();
    initElectronClassnames();
    initSafariFontFixClassnames();
    startLogoutListener();

    const appName = config.APP_NAME;

    if (isElectronMail) {
        listenFreeTrialSessionExpiration(appName, authentication, api);
    }

    const run = async () => {
        const sessionResult = await bootstrap.loadSession({ api, authentication, pathname, searchParams });

        const history = bootstrap.createHistory({ sessionResult, pathname });
        const unleashClient = bootstrap.createUnleash({ api: silentApi });
        const unleashPromise = bootstrap.unleashReady({ unleashClient }).catch(noop);

        const user = sessionResult.session?.User;
        extendStore({ config, api, authentication, history, unleashClient });

        const persistedSession = sessionResult.session?.persistedSession || getPersistedSession(authentication.localID);
        const persistedState = await getDecryptedPersistedState<Partial<AccountState>>({
            persistedSession,
            authentication,
            user,
        });

        // OAuth sessions are taken straight to the lite app
        if (persistedSession?.source === SessionSource.Oauth) {
            document.location.assign(getOAuthSettingsUrl(persistedSession.localID));
            // Promise that never resolves
            await new Promise<void>(() => {});
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
                bootstrap.enableTelemetryBasedOnUserSettings({ userSettings }),
                bootstrap.loadLocales({ userSettings, locales }),
            ]);

            return { user, userSettings, earlyAccessScope: features[FeatureCode.EarlyAccessScope], scopes };
        };

        const userPromise = loadUser();

        const [userData] = await Promise.all([
            userPromise,
            bootstrap.loadCrypto({ appName, unleashClient }),
            unleashPromise,
        ]);

        if (!!userData.userSettings.Telemetry) {
            telemetry.init({
                config,
                uid: authentication.UID,
                eventOptions: {
                    pageView: false,
                    click: false,
                    form: false,
                    performance: false,
                    modal: false,
                },
                overridenPageTitle: 'Account',
            });
        }

        // postLoad needs everything to be loaded.
        await bootstrap.postLoad({ appName, authentication, ...userData, history });

        const calendarModelEventManager = createCalendarModelEventManager({ api: silentApi });

        let coreEventV6Manager: ReturnType<typeof bootstrap.coreEventManagerV6> | undefined;
        let mailEventV6Manager: ReturnType<typeof bootstrap.mailEventManagerV6> | undefined;
        let contactEventV6Manager: ReturnType<typeof bootstrap.contactEventManagerV6> | undefined;
        let calendarEventV6Manager: ReturnType<typeof bootstrap.calendarEventManagerV6> | undefined;
        let eventManager: ReturnType<typeof bootstrap.eventManager> | undefined;

        // Calendar isn't supported due to it needing custom handling in supporting v6 events properly
        const eventLoopV6ExcludedApps = [APPS.PROTONCALENDAR];
        const hasEventLoopV6Enabled = !eventLoopV6ExcludedApps.some((app) =>
            pathname.includes(APPS_CONFIGURATION[app].settingsSlug)
        );

        let unsubscribe: () => void | undefined;
        let reset: () => void | undefined;

        if (hasEventLoopV6Enabled) {
            coreEventV6Manager = bootstrap.coreEventManagerV6({ api: silentApi });
            mailEventV6Manager = bootstrap.mailEventManagerV6({ api: silentApi });
            contactEventV6Manager = bootstrap.contactEventManagerV6({ api: silentApi });
            calendarEventV6Manager = bootstrap.calendarEventManagerV6({ api: silentApi });

            eventManager = bootstrap.compatEventManagerV6({
                eventManagers: [coreEventV6Manager, mailEventV6Manager, contactEventV6Manager, calendarEventV6Manager],
            });

            const unsubscribeCoreEventManagerV6 = coreEventV6Manager?.subscribe(async (event) => {
                const promises: Promise<void>[] = [];
                dispatch(coreEventLoopV6({ event, promises }));
                await Promise.all(promises);
            });

            const unsubscribeMailEventManagerV6 = mailEventV6Manager?.subscribe(async (event) => {
                const promises: Promise<void>[] = [];
                dispatch(mailEventLoopV6({ event, promises }));
                await Promise.all(promises);
            });

            const unsubscribeContactEventManagerV6 = contactEventV6Manager?.subscribe(async (event) => {
                const promises: Promise<void>[] = [];
                dispatch(contactEventLoopV6({ event, promises }));
                await Promise.all(promises);
            });

            const unsubscribeCalendarEventManagerV6 = calendarEventV6Manager?.subscribe(async (event) => {
                const promises: Promise<void>[] = [];
                dispatch(calendarEventLoopV6({ event, promises }));
                await Promise.all(promises);
            });

            unsubscribe = () => {
                unsubscribeMailEventManagerV6();
                unsubscribeCoreEventManagerV6();
                unsubscribeContactEventManagerV6();
                unsubscribeCalendarEventManagerV6();
            };

            reset = () => {
                coreEventV6Manager?.reset();
                mailEventV6Manager?.reset();
                contactEventV6Manager?.reset();
                calendarEventV6Manager?.reset();
            };

            coreEventV6Manager.start();
            mailEventV6Manager.start();
            contactEventV6Manager.start();
            calendarEventV6Manager.start();
        } else {
            eventManager = bootstrap.eventManager({ api: silentApi });

            unsubscribe = eventManager?.subscribe((event) => {
                dispatch(serverEvent(event));
            });

            reset = () => {
                eventManager?.reset();
            };

            eventManager.start();
        }

        extendStore({
            eventManager,
            coreEventV6Manager,
            contactEventV6Manager,
            mailEventV6Manager,
            calendarEventV6Manager,
            calendarModelEventManager,
        });

        bootstrap.onAbort(signal, () => {
            unsubscribe?.();
            reset();
            unleashClient.stop();
            store.unsubscribe();
        });

        dispatch(bootstrapEvent({ type: 'complete' }));

        return {
            ...userData,
            store,
            eventManager,
            unleashClient,
            history,
        };
    };

    return bootstrap.wrap({ appName, authentication }, run());
};
