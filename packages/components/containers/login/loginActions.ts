import { c } from 'ttag';

import { serverTime, wasServerTimeEverUpdated } from '@proton/crypto';
import { createKeyMigrationKTVerifier, createPreAuthKTVerifier } from '@proton/key-transparency';
import { auth2FA, getInfo } from '@proton/shared/lib/api/auth';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import type { AuthResponse, AuthVersion, Fido2Data, InfoResponse } from '@proton/shared/lib/authentication/interface';
import loginWithFallback from '@proton/shared/lib/authentication/loginWithFallback';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { wait } from '@proton/shared/lib/helpers/promise';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type {
    Api,
    KeyTransparencyActivation,
    KeySalt as tsKeySalt,
    User as tsUser,
} from '@proton/shared/lib/interfaces';
import { getRequiresPasswordSetup, getSentryError, migrateUser } from '@proton/shared/lib/keys';
import { handleSetupAddressKeys } from '@proton/shared/lib/keys/setupAddressKeys';
import { getHasV2KeysToUpgrade, upgradeV2KeysHelper } from '@proton/shared/lib/keys/upgradeKeysV2';

import type { ChallengeResult } from '../challenge/interface';
import { finalizeLogin } from './finalizeLogin';
import type { AuthActionResponse, AuthCacheResult, AuthSession } from './interface';
import { AuthStep, AuthType } from './interface';
import { getAuthTypes, getBackupPasswordError, getUnlockError, handleUnlockKey } from './loginHelper';
import { handlePrepareSSOData } from './ssoLoginHelper';
import { syncAddresses, syncSalts, syncUser } from './syncCache';

const handleKeyUpgrade = async ({
    cache,
    loginPassword,
    clearKeyPassword,
    keyPassword: maybeKeyPassword,
    isOnePasswordMode,
}: {
    cache: AuthCacheResult;
    loginPassword: string;
    clearKeyPassword: string;
    keyPassword: string;
    isOnePasswordMode?: boolean;
}) => {
    const { api, preAuthKTVerifier, keyMigrationKTVerifier } = cache;
    let keyPassword = maybeKeyPassword;

    let [user, addresses] = await Promise.all([
        cache.data.user || syncUser(cache),
        cache.data.addresses || syncAddresses(cache),
    ]);

    const { preAuthKTVerify } = preAuthKTVerifier;

    if (getHasV2KeysToUpgrade(user, addresses)) {
        const newKeyPassword = await upgradeV2KeysHelper({
            user,
            addresses,
            loginPassword,
            keyPassword,
            clearKeyPassword,
            isOnePasswordMode,
            api,
            preAuthKTVerify,
            keyMigrationKTVerifier,
        }).catch((e) => {
            const error = getSentryError(e);
            if (error) {
                captureMessage('Key upgrade error', { extra: { error } });
            }
            return undefined;
        });
        if (newKeyPassword !== undefined) {
            cache.data.user = undefined;
            cache.data.addresses = undefined;
            [user, addresses] = await Promise.all([syncUser(cache), syncAddresses(cache)]);
            keyPassword = newKeyPassword;
        }
    }

    const hasDoneMigration = await migrateUser({
        api,
        keyPassword,
        user,
        addresses,
        preAuthKTVerify,
        keyMigrationKTVerifier,
    }).catch((e) => {
        const error = getSentryError(e);
        if (error) {
            captureMessage('Key migration error', {
                extra: { error, serverTime: serverTime(), isServerTime: wasServerTimeEverUpdated() },
            });
        }
        return false;
    });

    if (hasDoneMigration) {
        cache.data.user = undefined;
        cache.data.addresses = undefined;
    }

    return finalizeLogin({ cache, loginPassword, keyPassword, clearKeyPassword });
};

/**
 * Step 3. Handle unlock.
 * Attempt to decrypt the primary private key with the password.
 */
export const handleUnlock = async ({
    cache,
    clearKeyPassword,
    isOnePasswordMode,
}: {
    cache: AuthCacheResult;
    clearKeyPassword: string;
    isOnePasswordMode: boolean;
}) => {
    const {
        data: { salts, user },
        loginPassword,
    } = cache;

    if (!salts || !user) {
        throw new Error('Invalid state');
    }

    await wait(500);

    const unlockResult = await handleUnlockKey(user, salts, clearKeyPassword).catch(() => undefined);
    if (!unlockResult) {
        throw getUnlockError();
    }

    return handleKeyUpgrade({
        cache,
        loginPassword,
        clearKeyPassword,
        keyPassword: unlockResult.keyPassword,
        isOnePasswordMode,
    });
};

export const handleReAuthKeyPassword = async ({
    authSession,
    User,
    clearKeyPassword,
    salts,
    api,
    source = SessionSource.Proton,
}: {
    authSession: AuthSession;
    User: tsUser;
    clearKeyPassword: string;
    salts: tsKeySalt[];
    api: Api;
    source?: SessionSource;
}): Promise<AuthSession> => {
    const unlockResult = await handleUnlockKey(User, salts, clearKeyPassword).catch(() => undefined);
    if (!unlockResult) {
        if (source === SessionSource.Saml) {
            throw getBackupPasswordError();
        }
        throw getUnlockError();
    }
    const newAuthSession = {
        ...authSession.data,
        User,
        keyPassword: unlockResult.keyPassword,
    };
    const { clientKey, offlineKey, persistedSession } = await persistSession({
        ...newAuthSession,
        clearKeyPassword,
        api,
        source,
    });
    return { data: { ...newAuthSession, persistedSession, clientKey, offlineKey }, prompt: null };
};

export const handleSetupPassword = async ({ cache, newPassword }: { cache: AuthCacheResult; newPassword: string }) => {
    const { api, username, preAuthKTVerifier } = cache;

    const [domains, addresses] = await Promise.all([
        api<{ Domains: string[] }>(queryAvailableDomains('signup')).then(({ Domains }) => Domains),
        cache.data.addresses || (await syncAddresses(cache)),
    ]);

    const keyPassword = await handleSetupAddressKeys({
        api,
        username,
        password: newPassword,
        addresses,
        domains,
        preAuthKTVerify: preAuthKTVerifier.preAuthKTVerify,
        productParam: cache.productParam,
    });

    cache.data.user = undefined;
    cache.data.addresses = undefined;

    return finalizeLogin({
        cache,
        loginPassword: newPassword,
        keyPassword,
        clearKeyPassword: newPassword,
    });
};

const next = async ({ cache, from }: { cache: AuthCacheResult; from: AuthStep }): Promise<AuthActionResponse> => {
    const { authType, authTypes, ignoreUnlock, authResponse, loginPassword } = cache;

    if (from === AuthStep.LOGIN) {
        if (authTypes.fido2 || authTypes.totp) {
            return {
                cache,
                to: AuthStep.TWO_FA,
            };
        }
    }

    // Special case for the admin panel (or sso login), return early since it can not get key salts or should setup keys.
    if (ignoreUnlock) {
        return finalizeLogin({ cache, loginPassword });
    }

    const [user] = await Promise.all([cache.data.user || syncUser(cache), cache.data.salts || syncSalts(cache)]);

    if (authType === AuthType.ExternalSSO) {
        return handlePrepareSSOData({ cache });
    }

    if (user.Keys.length === 0) {
        if (authResponse.TemporaryPassword) {
            return { cache, to: AuthStep.NEW_PASSWORD };
        }
        if (getRequiresPasswordSetup(user, cache.setupVPN)) {
            return handleSetupPassword({ cache, newPassword: loginPassword });
        }
        return finalizeLogin({ cache, loginPassword });
    }

    if (authTypes.unlock) {
        return {
            cache,
            to: AuthStep.UNLOCK,
        };
    }

    return handleUnlock({ cache, clearKeyPassword: loginPassword, isOnePasswordMode: true });
};

export const handleFido2 = async ({
    cache,
    payload,
}: {
    cache: AuthCacheResult;
    payload: Fido2Data;
}): Promise<AuthActionResponse> => {
    const { api } = cache;

    await api(auth2FA({ FIDO2: payload }));

    return next({ cache, from: AuthStep.TWO_FA });
};

/**
 * Step 2. Handle TOTP.
 * Unless there is another auth type active, the flow will continue until it's logged in.
 */
export const handleTotp = async ({
    cache,
    totp,
}: {
    cache: AuthCacheResult;
    totp: string;
}): Promise<AuthActionResponse> => {
    const { api } = cache;

    await api(auth2FA({ TwoFactorCode: totp })).catch((e) => {
        if (e.status === HTTP_ERROR_CODES.UNPROCESSABLE_ENTITY) {
            const error: any = new Error(
                getApiErrorMessage(e) || c('Error').t`Incorrect login credentials. Please try again.`
            );
            error.name = 'TOTPError';
            error.trace = false;
            throw error;
        }
        throw e;
    });

    return next({ cache, from: AuthStep.TWO_FA });
};

export const handleLogin = async ({
    username,
    password,
    payload,
    persistent,
    api,
}: {
    username: string;
    password: string;
    payload: ChallengeResult;
    persistent: boolean;
    api: Api;
}) => {
    const infoResult = await api<InfoResponse>(getInfo({ username }));
    const authResult = await loginWithFallback({
        api,
        credentials: { username, password },
        initialAuthInfo: infoResult,
        payload,
        persistent,
    });
    return { infoResult, authResult };
};

export const handleNextLogin = async ({
    authType,
    authResponse,
    authVersion,
    username,
    password,
    persistent,
    api,
    ignoreUnlock,
    appName,
    toApp,
    setupVPN,
    ktActivation,
    productParam,
}: {
    authType: AuthType;
    authVersion: AuthVersion;
    authResponse: AuthResponse;
    username: string;
    password: string;
    persistent: boolean;
    api: Api;
    ignoreUnlock: boolean;
    appName: APP_NAMES;
    toApp: APP_NAMES | undefined;
    setupVPN: boolean;
    ktActivation: KeyTransparencyActivation;
    productParam: ProductParam;
}): Promise<AuthActionResponse> => {
    const cache: AuthCacheResult = {
        authType,
        authResponse,
        authVersion,
        appName,
        toApp,
        productParam,
        data: {},
        api,
        authTypes: getAuthTypes(authResponse, appName),
        ktActivation,
        username,
        persistent,
        loginPassword: password,
        ignoreUnlock,
        setupVPN,
        preAuthKTVerifier: createPreAuthKTVerifier(ktActivation),
        keyMigrationKTVerifier: createKeyMigrationKTVerifier(ktActivation),
    };
    return next({ cache, from: AuthStep.LOGIN });
};
