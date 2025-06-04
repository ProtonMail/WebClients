import { put, select } from 'redux-saga/effects';

import { decryptCache } from '@proton/pass/lib/cache/decrypt';
import { getCacheKey } from '@proton/pass/lib/cache/keys';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { getOrganization } from '@proton/pass/lib/organization/organization.requests';
import { sanitizeBetaSetting } from '@proton/pass/lib/settings/beta';
import { enableLoginAutofill } from '@proton/pass/lib/settings/utils';
import { getPassPlan } from '@proton/pass/lib/user/user.plan';
import { isPaidPlan, userStateHydrated } from '@proton/pass/lib/user/user.predicates';
import { getUserData } from '@proton/pass/lib/user/user.requests';
import { stateHydrate } from '@proton/pass/store/actions';
import { migrate } from '@proton/pass/store/migrate';
import type { HydratedUserState } from '@proton/pass/store/reducers';
import type { OrganizationState } from '@proton/pass/store/reducers/organization';
import type { SettingsState } from '@proton/pass/store/reducers/settings';
import { selectProxiedSettings } from '@proton/pass/store/selectors';
import type { RootSagaOptions, State } from '@proton/pass/store/types';
import { type Maybe, PlanType } from '@proton/pass/types';
import type { EncryptedPassCache, PassCache } from '@proton/pass/types/worker/cache';
import { throwError } from '@proton/pass/utils/fp/throw';
import { logger } from '@proton/pass/utils/logger';
import { partialMerge } from '@proton/pass/utils/object/merge';
import { SETTINGS_PASSWORD_MODE } from '@proton/shared/lib/interfaces';
import identity from '@proton/utils/identity';
import noop from '@proton/utils/noop';

/** `allowFailure` defines how we should treat cache decryption errors.
 * If `true` they will be by-passed - else you can pass a custom error
 * generator function that will be triggered */
type HydrateCacheOptions = {
    allowFailure: boolean;
    merge: (existing: State, incoming: State) => State;
    onError?: () => Generator;
};

export type HydrationResult = { fromCache: boolean; version?: string };

/** Will try to decrypt the store cache and hydrate the store accordingly. Returns a
 * boolean flag indicating wether hydration happened from cache or not. */
export function* hydrate(
    config: HydrateCacheOptions,
    {
        getCache,
        getAuthService,
        getAuthStore,
        getSettings,
        getConfig,
        onBeforeHydrate,
        onSettingsUpdated,
    }: RootSagaOptions
): Generator<any, HydrationResult> {
    try {
        const authStore = getAuthStore();
        const keyPassword = authStore.getPassword();
        const { allowFailure } = config;

        const encryptedCache: Partial<EncryptedPassCache> = yield getCache();
        const cacheKey: Maybe<CryptoKey> = yield getCacheKey(encryptedCache, authStore);

        const cache: Maybe<PassCache> = cacheKey
            ? yield decryptCache(cacheKey, encryptedCache).catch((err) => (allowFailure ? undefined : throwError(err)))
            : undefined;

        const cachedState = cache?.state
            ? migrate(cache.state, { from: encryptedCache.version, to: getConfig().APP_VERSION })
            : undefined;

        const cachedUser = cachedState?.user;
        const snapshot = cache?.snapshot;
        const fromCache = cache?.state !== undefined && cache?.snapshot !== undefined;

        const userState: HydratedUserState = userStateHydrated(cachedUser) ? cachedUser : yield getUserData();

        const user = userState.user;
        const addresses = Object.values(userState.addresses);
        const organization =
            userState.plan.Type === PlanType.BUSINESS
                ? (cachedState?.organization ?? ((yield getOrganization()) as OrganizationState))
                : null;

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
        }

        /** Activate offline mode by default for paid users who
         * haven't touched the `offlineEnabled` setting yet */
        if (BUILD_TARGET === 'web' || DESKTOP_BUILD) {
            const plan = getPassPlan(userState.plan);
            const validUserType = isPaidPlan(plan);
            const hasOfflinePassword = authStore.hasOfflinePassword();
            const untouched = settings.offlineEnabled === undefined;

            const autoSetup = untouched && validUserType && hasOfflinePassword;
            settings.offlineEnabled = autoSetup || (validUserType && settings.offlineEnabled);
        }

        const incoming = { user: userState, settings, organization };
        const currentState: State = yield select();

        const prev = cachedState
            ? config.merge(currentState, partialMerge(cachedState, incoming))
            : partialMerge(currentState, incoming);

        const next: State = (onBeforeHydrate ?? identity)(prev, fromCache);

        /** Sync the local settings */
        yield onSettingsUpdated?.(selectProxiedSettings(next));

        /** If `keyPassword` is not defined then we may be dealing with an offline
         * state hydration in which case hydrating PassCrypto would throw. In such
         * cases, wait for network online in order to resume session */
        if (keyPassword) yield PassCrypto.hydrate({ user, keyPassword, addresses, snapshot, clear: true });

        yield put(stateHydrate(next));

        return {
            fromCache,
            version: encryptedCache?.version,
        };
    } catch (err) {
        logger.warn(`[Hydration] Error occured`, err);
        yield config.onError?.();
        return { fromCache: false };
    }
}
