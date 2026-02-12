import createSagaMiddleware from 'redux-saga';

import {
    addressKeysThunk,
    addressesThunk,
    initEvent,
    serverEvent,
    userKeysThunk,
    userSettingsThunk,
    userThunk,
    welcomeFlagsActions,
} from '@proton/account';
import { readAccountSessions } from '@proton/account/accountSessions/storage';
import * as bootstrap from '@proton/account/bootstrap';
import { getDecryptedPersistedState } from '@proton/account/persist/helper';
import { FeatureCode, fetchFeatures } from '@proton/features';
import createApi from '@proton/shared/lib/api/createApi';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getPersistedSession } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { APPS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import { getPrimaryKey } from '@proton/shared/lib/keys';
import { telemetry } from '@proton/shared/lib/telemetry';
import noop from '@proton/utils/noop';

import { DbApi } from './indexedDb/db';
import locales from './locales';
import { createLumoListenerMiddleware } from './redux/listeners';
import { rootSaga } from './redux/sagas';
import type { LumoSaga, LumoSagaContext, LumoState } from './redux/store';
import { extendStore, setupStore } from './redux/store';
import { setStoreRef } from './redux/storeRef';
import { extraThunkArguments } from './redux/thunk';
import { LumoApi } from './remote/api';
import { LUMO_ELIGIBILITY } from './types';
import { initializeConsoleOverride } from './util/logging';
import { type UserAndAddressKeys, initializeLumoBackground, initializeLumoCritical } from './util/lumoBootstrap';
import { lumoTelemetryConfig } from './util/telemetryConfig';

export const bootstrapApp = async ({ config, signal }: { config: ProtonConfig; signal?: AbortSignal }) => {
    // Check if there are any existing sessions on lumo.proton.me, if not redirect to lumo.proton.me/guest where user then has the option to signin
    const accountSessions = readAccountSessions();
    if (!accountSessions) {
        return replaceUrl(getAppHref('/guest', APPS.PROTONLUMO));
    }

    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const api = createApi({ config });
    const silentApi = getSilentApi(api);
    const authentication = bootstrap.createAuthentication();
    bootstrap.init({ config, authentication, locales });
    initializeConsoleOverride();
    const appName = config.APP_NAME;

    initSafariFontFixClassnames();

    const run = async () => {
        const sessionResult = await bootstrap.loadSession({
            authentication,
            api,
            pathname,
            searchParams,
            unauthenticatedReturnUrl: '/guest',
        });
        const uid = authentication.getUID();
        const history = bootstrap.createHistory({ sessionResult, pathname });
        const unleashClient = bootstrap.createUnleash({ api: silentApi });

        const user = sessionResult.session?.User;
        extendStore({ config, api, authentication, unleashClient, history });

        const persistedSession = sessionResult.session?.persistedSession || getPersistedSession(authentication.localID);
        const persistedState = await getDecryptedPersistedState<Partial<LumoState>>({
            persistedSession,
            authentication,
            user,
        });

        const listenerMiddleware = createLumoListenerMiddleware({ extra: extraThunkArguments }); // tbr
        const sagaMiddleware: LumoSaga = createSagaMiddleware<LumoSagaContext>({
            // unsafe: context items are temporarily undefined until later call to setContext()
            context: {} as LumoSagaContext,
        });
        const store = setupStore({ preloadedState: persistedState?.state, listenerMiddleware, sagaMiddleware });
        setStoreRef(store);
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

            if (!!userSettings.Telemetry) {
                telemetry.init({
                    config,
                    uid: authentication.UID,
                    ...lumoTelemetryConfig,
                });
            }

            dispatch(welcomeFlagsActions.initial(userSettings));

            const [scopes] = await Promise.all([
                bootstrap.enableTelemetryBasedOnUserSettings({ userSettings }),
                bootstrap.loadLocales({ userSettings, locales }),
            ]);

            return { user, userSettings, earlyAccessScope: features[FeatureCode.EarlyAccessScope], scopes };
        };

        const userPromise = loadUser();
        const cryptoPromise = bootstrap.loadCrypto({ appName, unleashClient });
        const eventManager = bootstrap.eventManager({ api: silentApi });
        bootstrap.unleashReady({ unleashClient }).catch(noop);

        const loadLumo = async () => {
            const [primaryAddress] = await dispatch(addressesThunk());
            if (!primaryAddress) {
                throw new Error('Missing primary address');
            }
            await cryptoPromise;

            // Get all user keys and address keys. One of them should decrypt the lumo master key.
            const allUserKeys = await dispatch(userKeysThunk());
            const primaryUserKey = getPrimaryKey(allUserKeys);
            if (!primaryUserKey) {
                throw new Error('Missing primary user key');
            }
            const allAddresses = await dispatch(addressesThunk());
            const allAddressKeysPromises = allAddresses.map((address) =>
                dispatch(addressKeysThunk({ addressID: address.ID }))
            );
            const allAddressKeysArrays = await Promise.all(allAddressKeysPromises);
            const allAddressKeys = allAddressKeysArrays.flat();

            const userData = await userPromise;

            const userId = userData.user.ID;
            const dbApi = new DbApi(userId);
            const lumoApi = new LumoApi(uid);
            extendStore({ dbApi, lumoApi });
            sagaMiddleware.setContext({ dbApi, lumoApi }); // resolves the unsafe note above
            sagaMiddleware.run(rootSaga);

            // Wait for critical initialization: eligibility check and master key decrypting
            const keys: UserAndAddressKeys = {
                primaryUserKey,
                allUserKeys,
                allAddressKeys,
            };
            const result = await dispatch(initializeLumoCritical(keys, uid));

            // Start background operations if eligible
            if (result?.eligibility === LUMO_ELIGIBILITY.Eligible) {
                await dispatch(initializeLumoBackground(uid));
            }
        };

        // We need to await the critical operations (for waitlist to work correctly) and dispatch background operations
        await loadLumo();

        const userData = await userPromise;

        // Needs everything to be loaded.
        await bootstrap.postLoad({ appName, authentication, ...userData, history });

        extendStore({ eventManager });
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
        };
    };

    return bootstrap.wrap({ appName, authentication }, run());
};
