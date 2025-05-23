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
import { getDecryptedPersistedState } from '@proton/account/persist/helper';
import { createCalendarModelEventManager } from '@proton/calendar';
import { initMainHost } from '@proton/cross-storage';
import { FeatureCode, fetchFeatures } from '@proton/features';
import createApi from '@proton/shared/lib/api/createApi';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { getOAuthSettingsUrl } from '@proton/shared/lib/authentication/fork/oauth2SettingsUrl';
import { getPersistedSession } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { listenFreeTrialSessionExpiration } from '@proton/shared/lib/desktop/endOfTrialHelpers';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { initElectronClassnames } from '@proton/shared/lib/helpers/initElectronClassnames';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import initLogicalProperties from '@proton/shared/lib/logical/logical';
import noop from '@proton/utils/noop';

import locales from '../locales';
import type { AccountState } from '../store/store';
import { extendStore, setupStore } from '../store/store';

const getAppContainer = () =>
    import(/* webpackChunkName: "MainContainer" */ './SetupMainContainer').then((result) => result.default);

export const bootstrapApp = async ({ config, signal }: { config: ProtonConfig; signal?: AbortSignal }) => {
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const api = createApi({ config });
    const silentApi = getSilentApi(api);
    const authentication = bootstrap.createAuthentication();
    bootstrap.init({ config, authentication, locales });
    initMainHost();
    initElectronClassnames();
    initLogicalProperties();
    initSafariFontFixClassnames();
    startLogoutListener();

    const appName = config.APP_NAME;

    if (isElectronMail) {
        listenFreeTrialSessionExpiration(appName, authentication, api);
    }

    const run = async () => {
        const appContainerPromise = getAppContainer();
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
                bootstrap.initUser({ appName, user, userSettings }),
                bootstrap.loadLocales({ userSettings, locales }),
            ]);

            return { user, userSettings, earlyAccessScope: features[FeatureCode.EarlyAccessScope], scopes };
        };

        const userPromise = loadUser();

        const [MainContainer, userData] = await Promise.all([
            appContainerPromise,
            userPromise,
            bootstrap.loadCrypto({ appName, unleashClient }),
            unleashPromise,
        ]);
        // postLoad needs everything to be loaded.
        await bootstrap.postLoad({ appName, authentication, ...userData, history });

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
            store,
            eventManager,
            unleashClient,
            history,
            MainContainer,
        };
    };

    return bootstrap.wrap({ appName, authentication }, run());
};
