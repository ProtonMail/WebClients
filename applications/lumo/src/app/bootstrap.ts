import createSagaMiddleware from 'redux-saga';

import {
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
import { DRAWER_VISIBILITY } from '@proton/shared/lib/interfaces';
import { telemetry } from '@proton/shared/lib/telemetry';
import { formatUser } from '@proton/shared/lib/user/helpers';
import noop from '@proton/utils/noop';

import { GUEST_MIGRATION_STORAGE_KEYS } from './constants/guestMigration';
import { LUMO_ROUTES } from './entrypoint/lumoRoutes';
import { DbApi } from './indexedDb/db';
import locales from './locales';
import { lumoEventLoop } from './redux/eventLoop';
import { createLumoListenerMiddleware } from './redux/listeners';
import { rootSaga } from './redux/sagas';
import { updateFeatureFlags } from './redux/slices/featureFlags';
import { importGuestDataRequest } from './redux/slices/guestMigration';
import type { LumoSaga, LumoSagaContext, LumoState } from './redux/store';
import { extendStore, setupStore } from './redux/store';
import { setStoreRef } from './redux/storeRef';
import { extraThunkArguments } from './redux/thunk';
import { LumoApi } from './remote/api';
import { LUMO_ELIGIBILITY } from './types';
import {
    consumeNativeSwitchLocalID,
    maybeMigrateLegacySessionToNative,
    registerNativeMigrationOutcomeHandler,
} from './util/legacySessionMigration';
import { initializeConsoleOverride } from './util/logging';
import { initializeLumoBackground, loadKeysAndMasterKey } from './util/lumoBootstrap';
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

const hasOptimisticSessions = async ({
    api,
}: {
    api: ReturnType<typeof getSilentApi>;
}): Promise<{ hasSessions: boolean; deferredCleanup?: () => void }> => {
    // Clearing inactive sessions costs one `GET core/v4/users` per persisted session, run serially
    // with a delay between each, so awaiting it scales with the number of accounts on the device
    // and blocks everything else in boot. It already swallows its own errors, so `void` cannot
    // produce an unhandled rejection.
    const cleanup = () =>
        cleanupInactivePersistedSessions({ api, persistedSessions: getPersistedSessions(), delay: 50 }).catch(noop);

    // Read the session cookie from account. When it is present its value takes precedence, and the
    // cleanup provably cannot change it: cleanupInactivePersistedSessions only removes localStorage
    // entries, while this cookie is rewritten solely by writeAccountSessions(), which Lumo registers
    // no listener for. So in this branch waiting for the cleanup cannot change the answer.
    const accountSessions = readAccountSessions();
    if (accountSessions) {
        // Handed back rather than started here: its requests would otherwise compete for connections
        // with the boot requests. The caller runs it once the render gate is open.
        return { hasSessions: accountSessions.length > 0, deferredCleanup: cleanup };
    }

    // No cookie, so the answer comes from the persisted sessions the cleanup actually mutates.
    // Here it does have to finish first.
    await cleanup();
    return { hasSessions: getPersistedSessions().length > 0 };
};

export const bootstrapApp = async ({ config }: { config: ProtonConfig }) => {
    const pathname = window.location.pathname;
    const api = createApi({ config });
    const silentApi = getSilentApi(api);

    // Check if there are any existing sessions on lumo.proton.me, if not redirect to lumo.proton.me/guest where user then has the option to signin.
    const isGuestOrForkPathname =
        pathname === '/guest' ||
        pathname.startsWith('/guest/') ||
        pathname === LUMO_ROUTES.AI_PAPER_TRAIL ||
        pathname === SSO_PATHS.LOGIN;
    let deferredSessionCleanup: (() => void) | undefined;
    if (!isGuestOrForkPathname) {
        const { hasSessions, deferredCleanup } = await hasOptimisticSessions({ api: silentApi });
        deferredSessionCleanup = deferredCleanup;
        if (!hasSessions) {
            // Reload to guest path.
            replaceUrl(getAppHref('/guest', APPS.PROTONLUMO));
            // Promise that never resolves to wait for the redirect.
            await new Promise(noop);
        }
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
            // A native account switch reloads with the target userId in the fragment. Must be
            // consumed here, as an argument: it strips the param, and that has to happen before
            // loadSession reads window.location.
            localID: consumeNativeSwitchLocalID(pathname),
            unauthenticatedReturnUrl: '/guest',
        });

        const uid = authentication.getUID();
        const history = bootstrap.createHistory({ sessionResult, pathname });
        const unleashClient = bootstrap.createUnleash({ api: silentApi });

        const user = sessionResult.session?.User;
        extendStore({ config, api, authentication, unleashClient, history });

        registerNativeMigrationOutcomeHandler({ api, authentication });
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

        // Dismissal state for What's New lives in both slices. Before the async master-key boot,
        // only `lumoUserSettings.featureFlags` may be populated from the persist snapshot while
        // `featureFlags` is still empty — seed the dedicated slice so modals don't flash.
        const initialFeatureFlags = store.getState().featureFlags;
        const persistedSettingsFlags = store.getState().lumoUserSettings.featureFlags;
        if (initialFeatureFlags.length === 0 && persistedSettingsFlags.length > 0) {
            dispatch(updateFeatureFlags(persistedSettingsFlags));
        }

        if (user) {
            dispatch(initEvent({ User: user }));
        }

        // `userSettings` is in `sharedPersistReducer`, so on a warm load the last session's value is
        // already in `preloadedState` and needs no round trip.
        const persistedUserSettings = persistedState?.state?.userSettings?.value;

        // Seeded from last session rather than from `userSettingsThunk`. On a first-ever load this
        // falls back to hidden, which is the same default the drawer already uses.
        const showDrawerSidebar = persistedUserSettings?.HideSidePanel === DRAWER_VISIBILITY.SHOW;

        /**
         * Two things `await userPromise` used to guarantee before the first render, and that the
         * shell still cannot open without:
         *
         *  - `userSettings` present in the store. `StandardPrivateApp`'s subtree reads it
         *    synchronously — see the "all apps assume that it's preloaded" note in
         *    `packages/account/userSettings/hooks.ts`. `ThemeInjector` dereferences it unguarded, so
         *    an absent value is a crash, not a fallback.
         *  - ttag's locale configured. Components that have already rendered do not re-render when
         *    translations land, so a non-English user would otherwise paint in English.
         *
         * A warm load answers both from the snapshot and pays nothing for the settings; only a
         * first load, a cleared cache, or an app-version bump pays the round trip.
         */
        const openLocaleGate = async () => {
            const userSettings = persistedUserSettings ?? (await dispatch(userSettingsThunk()));
            // Cheap and idempotent: it compares against the module-level locale state and loads
            // nothing when already correct, and `en_US` resolves without a fetch at all.
            await bootstrap.loadLocales({ userSettings, locales });
        };

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

            // `loadLocales` runs again here on purpose: the gate used the persisted `Locale`, which
            // is stale if the language was changed on another device. This call has the fresh value,
            // and is a no-op when the two agree.
            bootstrap.enableTelemetryBasedOnUserSettings({ userSettings });
            await bootstrap.loadLocales({ userSettings, locales });

            return { user, userSettings, earlyAccessScope: features[FeatureCode.EarlyAccessScope] };
        };

        // Wrapped at creation, so these measure total duration. The `await`s below are wrapped
        // separately and measure only the part that actually blocked — the difference between the
        // two is overlap this boot already gets for free.
        const userPromise = loadUser();
        const cryptoPromise = bootstrap.loadCrypto({ appName, unleashClient });
        const eventManager = bootstrap.eventManager({ api: silentApi });
        const lumoEventManager = bootstrap.lumoEventManager({ api: silentApi });
        bootstrap.unleashReady({ unleashClient }).catch(noop);

        // ── Launched, never awaited before the render gate ──────────────────────────────────
        //
        // These three are mutually independent: addresses is a round trip, the user-key unlocks are
        // worker CPU behind `cryptoPromise`, and the masterkeys envelope needs only the session UID
        // (no PGP keys at all). Issuing them here lets all three overlap.
        //
        // `.then` rather than `await cryptoPromise` on purpose: an await would park this frame and
        // delay the two statements below it.
        const addressesPromise = dispatch(addressesThunk());
        const userKeysPromise = cryptoPromise.then(() => dispatch(userKeysThunk()));
        const envelopePromise = new LumoApi(uid).getMasterKey();
        // Nothing awaits these until `loadKeysAndMasterKey` picks them up, and that now happens
        // after the render gate. An unobserved rejection in the meantime is an unhandled rejection,
        // so register a handler; the real `await`s downstream still see the actual failure.
        addressesPromise.catch(noop);
        userKeysPromise.catch(noop);
        envelopePromise.catch(noop);

        // ── The render gate ─────────────────────────────────────────────────────────────────
        //
        // Everything the shell needs and nothing else. No PGP, no master key: the composer can
        // create a space with a locally generated space key and talk to the LLM without either, and
        // anything that has to encrypt parks in `waitForMasterKey` until the key lands.
        const openShell = async () => {
            // `initEvent` above stamps the user model from `resumeSession`. Reading that snapshot
            // avoids awaiting `userThunk()` on the gate: with StaleRefetch the thunk can still
            // kick off GET /users in the background (via the concurrent `loadUser`), and an await
            // here would block first paint on that round trip even though the store already has
            // everything the shell needs (notably `gateUser.ID` for DbApi).
            const resolveGateUser = async () => {
                const fromStore = store.getState().user?.value;
                if (fromStore) {
                    return fromStore;
                }
                if (user) {
                    return formatUser(user);
                }
                return dispatch(userThunk());
            };

            const gateUser = await resolveGateUser();

            // Needs only a user ID, and the one from the session is the same one `userThunk`
            // returns — so this does not have to wait for `userPromise` either. Run against the
            // locale gate so a cold load pays `max(idb, settings)` rather than the sum.
            const dbApi = new DbApi(gateUser.ID);
            await Promise.all([dbApi.initialize(), openLocaleGate()]);
            const lumoApi = new LumoApi(uid);
            extendStore({ dbApi, lumoApi });
            sagaMiddleware.setContext({ dbApi, lumoApi }); // resolves the unsafe note above

            // Must precede any `addMasterKey` dispatch: saga channels have no replay, so an action
            // dispatched before the watchers exist is silently dropped and `initAppSaga` — the
            // entire data load — never starts.
            sagaMiddleware.run(rootSaga);

            return gateUser;
        };

        const gateUser = await openShell();

        // ── Everything past here runs while the user can already type ───────────────────────
        //
        // `loadKeysAndMasterKey` reports failure as `masterKeyFailed` rather than throwing, so
        // there is no rejection to handle and no error screen: the shell is already painted, and
        // the UI surfaces the failure from `selectMasterKeyState`.
        void dispatch(loadKeysAndMasterKey(uid, { addressesPromise, userKeysPromise, envelopePromise }))
            .then((result) => {
                if (result?.eligibility === LUMO_ELIGIBILITY.Eligible) {
                    return dispatch(initializeLumoBackground(uid));
                }
            })
            .catch(noop);

        // Needs the sagas running, not the master key.
        void checkForGuestMigration(dispatch).catch(noop);

        // Boot is done competing for connections, so it is safe to prune dead sessions now.
        deferredSessionCleanup?.();

        // `postLoad` is early-access handling, and on a desynchronisation it reloads the page. It
        // needs `userSettings`, which is no longer on the gate, so it runs here — after first
        // paint. The reload only fires when the user's early-access setting disagrees with the
        // loaded bundle, which is rare, but it is now possible for it to interrupt someone who has
        // started typing. Accepted for now; see the note in lumo-boot-execution-trace.html.
        void userPromise
            .then((userData) => {
                // don't call this on native mobile as early access (which refreshes the page) prevents login from working
                if (isNativeMobileApp()) {
                    return;
                }
                return bootstrap.postLoad({ appName, authentication, ...userData, history });
            })
            .catch(noop);

        extendStore({ eventManager, lumoEventManager });

        eventManager.subscribe((event) => {
            dispatch(serverEvent(event));
        });
        lumoEventManager.subscribe(async (event) => {
            const promises: Promise<void>[] = [];
            dispatch(lumoEventLoop({ event, promises }));
            await Promise.all(promises);
        });
        eventManager.start();
        lumoEventManager.start();

        return {
            user: gateUser,
            // `userSettings` is no longer available at this point — it arrives with `userPromise`,
            // off the gate. The only thing the shell needed from it was the drawer's initial
            // visibility, and that is in the persisted Redux snapshot decrypted above, so it is
            // resolved here instead of making the gate wait for a round trip.
            showDrawerSidebar,
            eventManager,
            lumoEventManager,
            unleashClient,
            history,
            store,
        };
    };

    return bootstrap.wrap({ appName, authentication }, run());
};
