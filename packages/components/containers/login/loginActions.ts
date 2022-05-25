import {
    Address as tsAddress,
    Api,
    KeySalt as tsKeySalt,
    User as tsUser,
    UserType,
} from '@proton/shared/lib/interfaces';
import { AUTH_VERSION } from '@proton/srp';
import { c } from 'ttag';
import { srpVerify } from '@proton/shared/lib/srp';
import { upgradePassword } from '@proton/shared/lib/api/settings';
import { auth2FA, getInfo, revoke } from '@proton/shared/lib/api/auth';
import { getUser } from '@proton/shared/lib/api/user';
import { getKeySalts } from '@proton/shared/lib/api/keys';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { InfoResponse } from '@proton/shared/lib/authentication/interface';
import loginWithFallback from '@proton/shared/lib/authentication/loginWithFallback';
import { withAuthHeaders } from '@proton/shared/lib/fetch/headers';
import { noop } from '@proton/shared/lib/helpers/function';
import { maybeResumeSessionByUser, persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { getHasV2KeysToUpgrade, upgradeV2KeysHelper } from '@proton/shared/lib/keys/upgradeKeysV2';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { handleSetupAddressKeys } from '@proton/shared/lib/keys/setupAddressKeys';
import { wait } from '@proton/shared/lib/helpers/promise';
import { getSentryError, migrateUser } from '@proton/shared/lib/keys';

import { ChallengeResult } from '../challenge';
import { getAuthTypes, handleUnlockKey } from './loginHelper';
import { AuthActionResponse, AuthCacheResult, AuthStep } from './interface';

/**
 * Finalize login can be called without a key password in these cases:
 * 1) The admin panel
 * 2) Users who have no keys but are in 2-password mode
 */
const finalizeLogin = async ({
    cache,
    loginPassword,
    keyPassword,
    user: maybeUser,
    addresses: maybeAddresess,
}: {
    cache: AuthCacheResult;
    loginPassword: string;
    keyPassword?: string;
    user?: tsUser;
    addresses?: tsAddress[];
}): Promise<AuthActionResponse> => {
    const { authResult, authVersion, api, authApi, persistent } = cache;

    if (authVersion < AUTH_VERSION) {
        await srpVerify({
            api: authApi,
            credentials: { password: loginPassword },
            config: upgradePassword(),
        });
    }

    const User = !maybeUser ? await authApi<{ User: tsUser }>(getUser()).then(({ User }) => User) : maybeUser;

    const validatedSession = await maybeResumeSessionByUser(api, User);
    if (validatedSession) {
        authApi(revoke()).catch(noop);
        return {
            to: AuthStep.DONE,
            session: validatedSession,
        };
    }

    await persistSession({ ...authResult, User, keyPassword, api, persistent });
    return {
        to: AuthStep.DONE,
        session: {
            ...authResult,
            User,
            Addresses: maybeAddresess,
            keyPassword,
            persistent,
        },
    };
};

const handleKeyMigration = async ({
    cache,
    loginPassword,
    keyPassword,
    user: maybeUser,
    addresses: maybeAddresess,
}: {
    cache: AuthCacheResult;
    loginPassword: string;
    keyPassword?: string;
    user?: tsUser;
    addresses?: tsAddress[];
}) => {
    const { authApi, hasGenerateKeys } = cache;

    const [User, Addresses] = await Promise.all([
        maybeUser || authApi<{ User: tsUser }>(getUser()).then(({ User }) => User),
        maybeAddresess || hasGenerateKeys ? getAllAddresses(authApi) : undefined,
    ]);

    let hasDoneMigration = false;
    if (keyPassword && Addresses) {
        hasDoneMigration = await migrateUser({
            api: authApi,
            keyPassword,
            user: User,
            addresses: Addresses,
        }).catch((e) => {
            const error = getSentryError(e);
            if (error) {
                captureMessage('Key migration error', { extra: { error } });
            }
            return false;
        });
    }

    return finalizeLogin({
        cache,
        loginPassword,
        keyPassword,
        // If migration was performed in the previous step, reset the user and addresses value to get updated keys and values
        ...(hasDoneMigration
            ? undefined
            : {
                  user: User,
                  addresses: Addresses,
              }),
    });
};

const handleKeyUpgrade = async ({
    cache,
    loginPassword,
    clearKeyPassword,
    keyPassword,
    user: maybeUser,
    isOnePasswordMode,
}: {
    cache: AuthCacheResult;
    loginPassword: string;
    clearKeyPassword: string;
    keyPassword: string;
    user?: tsUser;
    addresses?: tsAddress;
    isOnePasswordMode?: boolean;
}) => {
    const { authApi, hasGenerateKeys } = cache;

    const [User, Addresses] = await Promise.all([
        maybeUser || authApi<{ User: tsUser }>(getUser()).then(({ User }) => User),
        hasGenerateKeys ? getAllAddresses(authApi) : undefined,
    ]);

    if (Addresses && getHasV2KeysToUpgrade(User, Addresses)) {
        const newKeyPassword = await upgradeV2KeysHelper({
            user: User,
            addresses: Addresses,
            loginPassword,
            keyPassword,
            clearKeyPassword,
            isOnePasswordMode,
            api: authApi,
        }).catch((e) => {
            const error = getSentryError(e);
            if (error) {
                captureMessage('Key upgrade error', { extra: { error } });
            }
            return undefined;
        });
        if (newKeyPassword !== undefined) {
            return handleKeyMigration({
                cache,
                loginPassword,
                keyPassword: newKeyPassword,
                // undefined user and addresses to trigger a refresh
                user: undefined,
                addresses: undefined,
            });
        }
    }

    return handleKeyMigration({
        cache,
        loginPassword,
        keyPassword,
        user: User,
        addresses: Addresses,
    });
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
    const { userSaltResult, loginPassword } = cache;
    if (!userSaltResult) {
        throw new Error('Invalid state');
    }

    const [User, KeySalts] = userSaltResult;

    await wait(500);

    const result = await handleUnlockKey(User, KeySalts, clearKeyPassword).catch(() => undefined);
    if (!result) {
        const error = new Error(c('Error').t`Incorrect mailbox password. Please try again.`);
        error.name = 'PasswordError';
        throw error;
    }

    return handleKeyUpgrade({
        cache,
        loginPassword,
        clearKeyPassword,
        keyPassword: result.keyPassword,
        user: User,
        isOnePasswordMode,
    });
};

/**
 * Setup keys and address for users that have not setup.
 */
export const handleSetupPassword = async ({ cache, newPassword }: { cache: AuthCacheResult; newPassword: string }) => {
    const { userSaltResult, authApi, username } = cache;
    if (!userSaltResult) {
        throw new Error('Invalid state');
    }
    const [User] = userSaltResult;
    const keyPassword = await handleSetupAddressKeys({
        api: authApi,
        username,
        password: newPassword,
        hasAddressKeyMigrationGeneration: User.ToMigrate === 1,
    });

    return finalizeLogin({
        cache,
        loginPassword: newPassword,
        keyPassword,
        // Undefined user to force refresh to get keys that were just setup
        user: undefined,
    });
};

const next = async ({ cache, from }: { cache: AuthCacheResult; from: AuthStep }): Promise<AuthActionResponse> => {
    const { hasTotp, hasUnlock, hasU2F, authApi, authResult, ignoreUnlock, hasGenerateKeys, loginPassword } = cache;

    if (from === AuthStep.LOGIN && hasTotp) {
        return {
            cache,
            to: AuthStep.TOTP,
        };
    }

    if ((from === AuthStep.LOGIN || from === AuthStep.TOTP) && hasU2F) {
        return {
            cache,
            to: AuthStep.U2F,
        };
    }

    // Special case for the admin panel, return early since it can not get key salts.
    if (ignoreUnlock) {
        return finalizeLogin({
            cache,
            loginPassword,
        });
    }

    if (!cache.userSaltResult) {
        cache.userSaltResult = await Promise.all([
            authApi<{ User: tsUser }>(getUser()).then(({ User }) => User),
            authApi<{ KeySalts: tsKeySalt[] }>(getKeySalts()).then(({ KeySalts }) => KeySalts),
        ]);
    }

    const [User] = cache.userSaltResult;

    if (User.Keys.length === 0 && User.Type !== UserType.EXTERNAL) {
        if (hasGenerateKeys) {
            if (authResult.TemporaryPassword) {
                return { cache, to: AuthStep.NEW_PASSWORD };
            }
            return handleSetupPassword({ cache, newPassword: loginPassword });
        }
        return finalizeLogin({ cache, loginPassword, user: User });
    }

    if (hasUnlock) {
        return {
            cache,
            to: AuthStep.UNLOCK,
        };
    }

    return handleUnlock({ cache, clearKeyPassword: loginPassword, isOnePasswordMode: true });
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
    const { authApi } = cache;

    await authApi(auth2FA({ totp })).catch((e) => {
        if (e.status === HTTP_ERROR_CODES.UNPROCESSABLE_ENTITY) {
            const error = new Error(
                getApiErrorMessage(e) || c('Error').t`Incorrect login credentials. Please try again.`
            );
            error.name = 'TOTPError';
            throw error;
        }
        throw e;
    });

    return next({ cache, from: AuthStep.TOTP });
};

export const handleLogin = async ({
    username,
    password,
    persistent,
    api,
    ignoreUnlock,
    hasGenerateKeys,
    payload,
}: {
    username: string;
    password: string;
    persistent: boolean;
    api: Api;
    ignoreUnlock: boolean;
    hasGenerateKeys: boolean;
    payload?: ChallengeResult;
}): Promise<AuthActionResponse> => {
    const infoResult = await api<InfoResponse>(getInfo(username));
    const { authVersion, result: authResult } = await loginWithFallback({
        api,
        credentials: { username, password },
        initialAuthInfo: infoResult,
        payload,
    });
    const { UID, AccessToken } = authResult;
    const authApi = <T>(config: any) => api<T>(withAuthHeaders(UID, AccessToken, config));

    const cache: AuthCacheResult = {
        authResult,
        authVersion,
        api,
        authApi,
        ...getAuthTypes(authResult),
        username,
        persistent,
        loginPassword: password,
        ignoreUnlock,
        hasGenerateKeys,
    };

    return next({ cache, from: AuthStep.LOGIN });
};
