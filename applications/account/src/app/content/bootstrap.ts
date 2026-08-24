import {
    initEvent,
    startLogoutListener,
    userPermissionsThunk,
    userSettingsThunk,
    userThunk,
    welcomeFlagsActions,
} from '@proton/account';
import * as bootstrap from '@proton/account/bootstrap';
import { bootstrapEvent } from '@proton/account/bootstrap/action';
import { coreEventLoopV6 } from '@proton/account/coreEventLoop';
import { delegatedAccessActions } from '@proton/account/delegatedAccess';
import { getIsDelegatedAccessSupportedInApp } from '@proton/account/delegatedAccess/available';
import { serverEvent } from '@proton/account/eventLoop';
import { getDecryptedPersistedState } from '@proton/account/persist/helper';
import { calendarEventLoopV6 } from '@proton/calendar/calendarEventLoop';
import { createCalendarModelEventManager } from '@proton/calendar/calendarModelEventManager';
import { initMainHost } from '@proton/cross-storage/host';
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
import { maybeSetAppSubdomainFromRedirectUrl } from './setAppSubdomainFromRedirectUrl';

export const bootstrapApp = async ({ config }: { config: ProtonConfig }) => {
    const url = new URL(window.location.href);
    const pathname = url.pathname;
    const searchParams = url.searchParams;
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

        void import('@proton/shared/lib/desktop/bootstrapAccountInboxDesktop').then((module) => {
            void module.bootstrapAccountInboxDesktop(authentication);
        });
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

        // Account is the only app where delegated access is wired up, see `getIsDelegatedAccessSupportedInApp`
        dispatch(delegatedAccessActions.setSupportedInApp(getIsDelegatedAccessSupportedInApp(config.APP_NAME)));

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

            bootstrap.enableTelemetryBasedOnUserSettings({ userSettings });
            await bootstrap.loadLocales({ userSettings, locales });

            return { user, userSettings, earlyAccessScope: features[FeatureCode.EarlyAccessScope] };
        };

        const userPromise = loadUser();
        dispatch(userPermissionsThunk()).catch(noop);

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
                    exit: false,
                },
                overriddenPageTitle: 'Account',
            });
        }

        // postLoad needs everything to be loaded.
        await bootstrap.postLoad({ appName, authentication, ...userData, history });

        maybeSetAppSubdomainFromRedirectUrl(url);

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

        if (hasEventLoopV6Enabled) {
            coreEventV6Manager = bootstrap.coreEventManagerV6({ api: silentApi });
            mailEventV6Manager = bootstrap.mailEventManagerV6({ api: silentApi });
            contactEventV6Manager = bootstrap.contactEventManagerV6({ api: silentApi });
            calendarEventV6Manager = bootstrap.calendarEventManagerV6({ api: silentApi });

            eventManager = bootstrap.compatEventManagerV6({
                eventManagers: [coreEventV6Manager, mailEventV6Manager, contactEventV6Manager, calendarEventV6Manager],
            });

            coreEventV6Manager?.subscribe(async (event) => {
                const promises: Promise<void>[] = [];
                dispatch(coreEventLoopV6({ event, promises }));
                await Promise.all(promises);
            });

            mailEventV6Manager?.subscribe(async (event) => {
                const promises: Promise<void>[] = [];
                dispatch(mailEventLoopV6({ event, promises }));
                await Promise.all(promises);
            });

            contactEventV6Manager?.subscribe(async (event) => {
                const promises: Promise<void>[] = [];
                dispatch(contactEventLoopV6({ event, promises }));
                await Promise.all(promises);
            });

            calendarEventV6Manager?.subscribe(async (event) => {
                const promises: Promise<void>[] = [];
                dispatch(calendarEventLoopV6({ event, promises }));
                await Promise.all(promises);
            });

            coreEventV6Manager.start();
            mailEventV6Manager.start();
            contactEventV6Manager.start();
            calendarEventV6Manager.start();
        } else {
            eventManager = bootstrap.eventManager({ api: silentApi });

            eventManager?.subscribe((event) => {
                dispatch(serverEvent(event));
            });

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
