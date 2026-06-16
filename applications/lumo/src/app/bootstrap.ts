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
import { cleanupInactivePersistedSessions } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getPersistedSession, getPersistedSessions } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { initSafariFontFixClassnames } from '@proton/shared/lib/helpers/initSafariFontFixClassnames';
import type { ProtonConfig } from '@proton/shared/lib/interfaces';
import { getPrimaryKey } from '@proton/shared/lib/keys';
import { telemetry } from '@proton/shared/lib/telemetry';
import noop from '@proton/utils/noop';

import { GUEST_MIGRATION_STORAGE_KEYS } from './constants/guestMigration';
import { DbApi } from './indexedDb/db';
import locales from './locales';
import { lumoEventLoop } from './redux/eventLoop';
import { createLumoListenerMiddleware } from './redux/listeners';
import { rootSaga } from './redux/sagas';
import { importGuestDataRequest } from './redux/slices/guestMigration';
import type { LumoSaga, LumoSagaContext, LumoState } from './redux/store';
import { extendStore, setupStore } from './redux/store';
import { setStoreRef } from './redux/storeRef';
import { extraThunkArguments } from './redux/thunk';
import { LumoApi } from './remote/api';
import { LUMO_ELIGIBILITY } from './types';
import { maybeMigrateLegacySessionToNative } from './util/legacySessionMigration';
import { initializeConsoleOverride } from './util/logging';
import { type UserAndAddressKeys, initializeLumoBackground, initializeLumoCritical } from './util/lumoBootstrap';
import { setLumoTelemetryEnabled } from './util/telemetry';
import { lumoTelemetryConfig } from './util/telemetryConfig';
import { isNativeMobileApp } from './util/userAgent';

const checkForGuestMigration = async (dispatch: any) => {
    try {
        const storedData = localStorage.getItem(GUEST_MIGRATION_STORAGE_KEYS.MIGRATION_DATA);
        if (!storedData) return null;

        // Import decryption function
        const { decryptGuestData, clearGuestEncryptionKey } = await import('./utils/guestEncryption');

        // Decrypt the stored data
        const guestData = await decryptGuestData(storedData);

        // Check if data is recent (within last 15 minutes to avoid stale data)
        const isRecent = Date.now() - guestData.timestamp < 15 * 60 * 1000;
        if (!isRecent) {
            console.log('Guest migration data is stale, ignoring');
            localStorage.removeItem(GUEST_MIGRATION_STORAGE_KEYS.MIGRATION_DATA);
            clearGuestEncryptionKey();
            return null;
        }

        console.log('Found guest migration data, importing...', {
            conversation: guestData.conversation?.id,
            messages: Object.keys(guestData.messages || {}).length,
            activeConversationId: guestData.activeConversationId,
        });

        dispatch(importGuestDataRequest(guestData));

        // Clean up after successful dispatch
        localStorage.removeItem(GUEST_MIGRATION_STORAGE_KEYS.MIGRATION_DATA);
        clearGuestEncryptionKey();

        // Store the conversation ID for post-load navigation
        if (guestData.activeConversationId) {
            sessionStorage.setItem(GUEST_MIGRATION_STORAGE_KEYS.POST_MIGRATION_NAV, guestData.activeConversationId);
        }

        return guestData.activeConversationId;
    } catch (error) {
        console.error('Failed to process guest migration data:', error);
        localStorage.removeItem(GUEST_MIGRATION_STORAGE_KEYS.MIGRATION_DATA);
        // Clean up encryption key if decryption failed
        try {
            const { clearGuestEncryptionKey } = await import('./utils/guestEncryption');
            clearGuestEncryptionKey();
        } catch (e) {
            console.error('Failed to clear guest encryption key:', e);
        }
        return null;
    }
};

const hasOptimisticSessions = async ({ api }: { api: ReturnType<typeof getSilentApi> }) => {
    // First ensure all inactive persisted sessions are cleared.
    await cleanupInactivePersistedSessions({ api, persistedSessions: getPersistedSessions(), delay: 50 }).catch(noop);
    // Then read session cookie from account.
    const accountSessions = readAccountSessions();
    // If account reports any sessions, that value takes precedence. Otherwise, the locally persisted sessions do.
    return accountSessions ? accountSessions.length > 0 : getPersistedSessions().length > 0;
};

export const bootstrapApp = async ({ config, signal }: { config: ProtonConfig; signal?: AbortSignal }) => {
    const pathname = window.location.pathname;
    const api = createApi({ config });
    const silentApi = getSilentApi(api);

    // Check if there are any existing sessions on lumo.proton.me, if not redirect to lumo.proton.me/guest where user then has the option to signin.
    const isGuestOrForkPathname = pathname === '/guest' || pathname === SSO_PATHS.LOGIN;
    if (!isGuestOrForkPathname && !(await hasOptimisticSessions({ api: silentApi }))) {
        // Reload to guest path.
        replaceUrl(getAppHref('/guest', APPS.PROTONLUMO));
        // Promise that never resolves to wait for the redirect.
        await new Promise(noop);
    }

    const searchParams = new URLSearchParams(window.location.search);
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

        void maybeMigrateLegacySessionToNative({ api, authentication, pathname });

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
                setLumoTelemetryEnabled(true);
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
        const lumoEventManager = bootstrap.lumoEventManager({ api: silentApi });
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
            await dbApi.initialize();
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

            // Check for guest migration data after sagas are running
            await checkForGuestMigration(dispatch);
        };

        // We need to await the critical operations (for waitlist to work correctly) and dispatch background operations
        await loadLumo();

        const userData = await userPromise;

        // don't call this on native mobile as early access (which refreshes the page) prevents login from working
        if (!isNativeMobileApp()) {
            // Needs everything to be loaded.
            await bootstrap.postLoad({ appName, authentication, ...userData, history });
        }

        extendStore({ eventManager, lumoEventManager });
        const unsubscribeEventManager = eventManager.subscribe((event) => {
            dispatch(serverEvent(event));
        });
        const unsubscribeLumoEventManager = lumoEventManager.subscribe(async (event) => {
            const promises: Promise<void>[] = [];
            dispatch(lumoEventLoop({ event, promises }));
            await Promise.all(promises);
        });
        eventManager.start();
        lumoEventManager.start();

        bootstrap.onAbort(signal, () => {
            unsubscribeEventManager();
            unsubscribeLumoEventManager();
            eventManager.reset();
            lumoEventManager.reset();
            unleashClient.stop();
            store.unsubscribe();
        });

        return {
            ...userData,
            eventManager,
            lumoEventManager,
            unleashClient,
            history,
            store,
        };
    };

    return bootstrap.wrap({ appName, authentication }, run());
};
