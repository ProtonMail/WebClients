import { put, select } from 'redux-saga/effects';

import { decryptCache } from '@proton/pass/lib/cache/decrypt';
import { getCacheKey } from '@proton/pass/lib/cache/keys';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { PassCryptoHydrationError } from '@proton/pass/lib/crypto/utils/errors';
import { getOrganization } from '@proton/pass/lib/organization/organization.requests';
import { sanitizeBetaSetting } from '@proton/pass/lib/settings/beta';
import { enableLoginAutofill } from '@proton/pass/lib/settings/utils';
import { userStateHydrated } from '@proton/pass/lib/user/user.predicates';
import { getUserData } from '@proton/pass/lib/user/user.requests';
import { stateHydrate } from '@proton/pass/store/actions';
import { migrate } from '@proton/pass/store/migrate';
import type { HydratedUserState, UserState } from '@proton/pass/store/reducers';
import type { OrganizationState } from '@proton/pass/store/reducers/organization';
import type { SettingsState } from '@proton/pass/store/reducers/settings';
import { selectUserState } from '@proton/pass/store/selectors';
import type { RootSagaOptions, State } from '@proton/pass/store/types';
import type { MaybeNull } from '@proton/pass/types';
import { type Maybe, PlanType } from '@proton/pass/types';
import type { EncryptedPassCache, PassCache } from '@proton/pass/types/worker/cache';
import { logger } from '@proton/pass/utils/logger';
import { partialMerge } from '@proton/pass/utils/object/merge';
import { SETTINGS_PASSWORD_MODE } from '@proton/shared/lib/interfaces';
import identity from '@proton/utils/identity';
import noop from '@proton/utils/noop';

/** `allowFailure` defines how we should treat cache decryption errors.
 * If `true` they will be by-passed - else you can pass a custom error
 * generator function that will be triggered */
type HydrateCacheOptions = {
    online: boolean;
    merge: (existing: State, incoming: State) => State;
    onError?: (err: unknown) => Generator;
};

export type HydrationResult = { fromCache: boolean; version?: string };

/** Will try to decrypt the store cache and hydrate the store accordingly. Returns a
 * boolean flag indicating wether hydration happened from cache or not. */
export function* hydrate(
    config: HydrateCacheOptions,
    { getCache, getAuthService, getAuthStore, getSettings, getConfig, onBeforeHydrate, extensionId }: RootSagaOptions
): Generator<any, HydrationResult> {
    try {
        const authStore = getAuthStore();
        const keyPassword = authStore.getPassword();
        const encryptedCache: Partial<EncryptedPassCache> = yield getCache();
        const cacheKey: Maybe<CryptoKey> = yield getCacheKey(encryptedCache, authStore);
        const cache: Maybe<PassCache> = cacheKey ? yield decryptCache(cacheKey, encryptedCache).catch(noop) : undefined;

        /** Offline boot requires valid cache */
        if (!config.online && !cache) throw new PassCryptoHydrationError('Invalid offline cache');
        /** Online hydration requires keyPassword for PassCrypto */
        if (config.online && !keyPassword) throw new PassCryptoHydrationError('Missing `keyPassword`');

        const snapshot = cache?.snapshot;
        const fromCache = cache?.state !== undefined && cache?.snapshot !== undefined;
        const cachedState = cache?.state
            ? migrate(cache.state, cache.snapshot, { from: encryptedCache.version, to: getConfig().APP_VERSION })
            : undefined;

        /** Request #1: Fetch user data only when not fully hydrated. May be triggered on
         * initial boot or when we detect a non-hydrated user state on subsequent boots. If
         * resuming from an offline boot and cache is unavailable: fallback to current state. */
        const cachedUserState: Maybe<UserState> = cachedState?.user ?? (yield select(selectUserState));
        const userState: HydratedUserState = yield userStateHydrated(cachedUserState) ? cachedUserState : getUserData(extensionId);

        const user = userState.user;
        const addresses = Object.values(userState.addresses);

        /** Request #2: Fetch organization data for business users if not cached.
         * Graceful fallback to null on network failure to avoid blocking hydration. */
        const groupInvitesV1 = userState.features.PassGroupInvitesV1 ?? false;
        const org = cachedState?.organization;
        const b2b = userState.plan.Type === PlanType.BUSINESS;
        const organization: MaybeNull<OrganizationState> = b2b ? (org ?? (yield getOrganization(groupInvitesV1).catch(() => null))) : null;
        const groups = organization?.groups;

        const twoPasswordMode = userState.userSettings.Password.Mode === SETTINGS_PASSWORD_MODE.TWO_PASSWORD_MODE;

        /** NOTE: This should only happen on first hydration as changing the password-mode
         * setting should invalidate the session. User settings are not retrieved during
         * the session fork sequence so we have to wait for initial settings hydration. */
        if (twoPasswordMode !== authStore.getTwoPasswordMode()) {
            const localID = authStore.getLocalID();
            authStore.setTwoPasswordMode(twoPasswordMode);
            yield getAuthService().syncPersistedSession(localID, { twoPasswordMode }).catch(noop);
        }

        /** Note: Settings may have been modified offline, thus they might not align
         * with the cached state settings. Since caching requests cannot be triggered
         * when offline, it's essential to synchronize the initial settings accordingly */
        const settings: Partial<SettingsState> = (yield getSettings()) ?? {};
        settings.locale = cache?.state.settings.locale ?? userState.userSettings?.Locale;
        settings.beta = BUILD_TARGET === 'web' && sanitizeBetaSetting(settings.beta);
        settings.lockTTL = authStore.getLockTTL();
        settings.lockMode = authStore.getLockMode();
        settings.extraPassword = authStore.getExtraPassword();
        const autofill = settings.autofill;

        if (EXTENSION_BUILD && autofill) {
            const autofillEnabled = enableLoginAutofill(autofill);
            /** Migrate `autofill.login` based on current user preferences */
            if (autofill.login === undefined) autofill.login = autofillEnabled;
            if (autofill.identity === undefined) autofill.identity = autofillEnabled;
            if (autofill.twofa === undefined) autofill.twofa = autofill.login;

            /** Auto-enable CC when feature flag is enabled */
            if (!userState.features.PassCreditCardWebAutofill && autofill.cc) autofill.cc = undefined;
            else if (autofill.cc === undefined) autofill.cc = true;
        }

        /** Activate offline mode by default if user
         * has an offline password available */
        if (BUILD_TARGET === 'web' || DESKTOP_BUILD) {
            const hasOfflinePassword = authStore.hasOfflinePassword();
            settings.offlineEnabled = hasOfflinePassword;
        }

        const incoming = { user: userState, settings, organization };
        const currentState: State = yield select();

        const prev = cachedState ? config.merge(currentState, partialMerge(cachedState, incoming)) : partialMerge(currentState, incoming);
        const next: State = yield (onBeforeHydrate ?? identity)(prev, fromCache);

        /** If `keyPassword` is not defined then we may be dealing with an offline
         * state hydration in which case hydrating PassCrypto would throw. In such
         * cases, wait for network online in order to resume session */
        if (keyPassword) yield PassCrypto.hydrate({ user, keyPassword, addresses, snapshot, groups, clear: true });

        yield put(stateHydrate(next));

        return {
            fromCache,
            version: encryptedCache?.version,
        };
    } catch (err) {
        logger.warn(`[Hydration] Error occured`, err);

        if (config.onError) yield config.onError?.(err);
        else throw err;

        return { fromCache: false };
    }
}
