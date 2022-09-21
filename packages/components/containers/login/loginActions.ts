import { c } from 'ttag';

import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { auth2FA, getInfo, revoke } from '@proton/shared/lib/api/auth';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getKeySalts } from '@proton/shared/lib/api/keys';
import { getSettings, upgradePassword } from '@proton/shared/lib/api/settings';
import { getUser } from '@proton/shared/lib/api/user';
import { InfoResponse } from '@proton/shared/lib/authentication/interface';
import loginWithFallback from '@proton/shared/lib/authentication/loginWithFallback';
import { maybeResumeSessionByUser, persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APP_NAMES } from '@proton/shared/lib/constants';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { withAuthHeaders } from '@proton/shared/lib/fetch/headers';
import { wait } from '@proton/shared/lib/helpers/promise';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import {
    Api,
    UserSettings,
    UserType,
    Address as tsAddress,
    KeySalt as tsKeySalt,
    User as tsUser,
} from '@proton/shared/lib/interfaces';
import {
    InternalAddressGenerationPayload,
    getDecryptedUserKeysHelper,
    getInternalAddressSetupMode,
    getSentryError,
    handleInternalAddressGeneration,
    migrateUser,
} from '@proton/shared/lib/keys';
import { handleSetupAddressKeys } from '@proton/shared/lib/keys/setupAddressKeys';
import { getHasV2KeysToUpgrade, upgradeV2KeysHelper } from '@proton/shared/lib/keys/upgradeKeysV2';
import {
    attemptDeviceRecovery,
    getIsDeviceRecoveryAvailable,
    removeDeviceRecovery,
    storeDeviceRecovery,
} from '@proton/shared/lib/recoveryFile/deviceRecovery';
import { srpVerify } from '@proton/shared/lib/srp';
import { AUTH_VERSION } from '@proton/srp';
import noop from '@proton/utils/noop';

import { ChallengeResult } from '../challenge';
import { AuthActionResponse, AuthCacheResult, AuthStep } from './interface';
import { getAuthTypes, handleUnlockKey } from './loginHelper';

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
    addresses: maybeAddresses,
}: {
    cache: AuthCacheResult;
    loginPassword: string;
    keyPassword?: string;
    user?: tsUser;
    addresses?: tsAddress[];
}): Promise<AuthActionResponse> => {
    const {
        authResult,
        authVersion,
        api,
        authApi,
        persistent,
        hasInternalAddressSetup,
        appName,
        hasTrustedDeviceRecovery,
    } = cache;

    if (authVersion < AUTH_VERSION) {
        await srpVerify({
            api: authApi,
            credentials: { password: loginPassword },
            config: upgradePassword(),
        });
    }

    let User = !maybeUser ? await authApi<{ User: tsUser }>(getUser()).then(({ User }) => User) : maybeUser;

    if (hasInternalAddressSetup && User.Type === UserType.EXTERNAL) {
        const [{ Domains = [] }, addresses] = await Promise.all([
            authApi<{ Domains: string[] }>(queryAvailableDomains('signup')),
            maybeAddresses || getAllAddresses(authApi),
        ]);
        return {
            to: AuthStep.GENERATE_INTERNAL,
            cache: {
                ...cache,
                internalAddressSetup: {
                    availableDomains: Domains,
                    externalEmailAddress: addresses?.[0],
                    setup: getInternalAddressSetupMode({ User, loginPassword, keyPassword }),
                },
            },
        };
    }

    const validatedSession = await maybeResumeSessionByUser(api, User);
    if (validatedSession) {
        authApi(revoke()).catch(noop);
        return {
            to: AuthStep.DONE,
            session: validatedSession,
        };
    }

    let trusted = false;
    if (hasTrustedDeviceRecovery && keyPassword) {
        const numberOfReactivatedKeys = await attemptDeviceRecovery({
            api: authApi,
            user: User,
            addresses: maybeAddresses,
            keyPassword,
        }).catch(noop);

        if (numberOfReactivatedKeys !== undefined && numberOfReactivatedKeys > 0) {
            // Refetch user with new reactivated keys
            User = await authApi<{ User: tsUser }>(getUser()).then(({ User }) => User);
            maybeAddresses = undefined;
        }

        // Store device recovery information
        if (persistent) {
            const [userKeys, addresses] = await Promise.all([
                getDecryptedUserKeysHelper(User, keyPassword),
                getAllAddresses(authApi),
            ]);
            const isDeviceRecoveryAvailable = getIsDeviceRecoveryAvailable({
                user: User,
                addresses,
                userKeys,
                appName,
            });

            if (isDeviceRecoveryAvailable) {
                const userSettings = await authApi<{ UserSettings: UserSettings }>(getSettings()).then(
                    ({ UserSettings }) => UserSettings
                );

                if (userSettings.DeviceRecovery) {
                    await storeDeviceRecovery({ api: authApi, user: User, userKeys });
                    trusted = true;
                }
            }
        } else {
            removeDeviceRecovery(User.ID);
        }
    }

    await persistSession({ ...authResult, User, keyPassword, api, persistent, trusted });

    return {
        to: AuthStep.DONE,
        session: {
            ...authResult,
            User,
            Addresses: maybeAddresses,
            keyPassword,
            persistent,
            trusted,
        },
    };
};

export const handleSetupInternalAddress = async ({
    cache,
    payload,
}: {
    cache: AuthCacheResult;
    payload: InternalAddressGenerationPayload;
}): Promise<AuthActionResponse> => {
    const { authApi } = cache;

    const passphrase = await handleInternalAddressGeneration({
        api: authApi,
        setup: payload.setup,
        domain: payload.domain,
        username: payload.username,
    });

    return finalizeLogin({
        cache,
        loginPassword: cache.loginPassword,
        keyPassword: passphrase,
    });
};

const handleKeyMigration = async ({
    cache,
    loginPassword,
    keyPassword,
    user: maybeUser,
    addresses: maybeAddresses,
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
        maybeAddresses || hasGenerateKeys ? getAllAddresses(authApi) : undefined,
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

    if (from === AuthStep.LOGIN) {
        if (hasTotp) {
            return {
                cache,
                to: AuthStep.TWO_FA,
            };
        } else if (hasU2F) {
            // U2F must be enabled together with TOTP for backwards support. Since we don't support any type of U2F right now,
            // error out if only that is enabled.
            throw new Error('U2F is not supported');
        }
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

    if (User.Keys.length === 0) {
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

    return next({ cache, from: AuthStep.TWO_FA });
};

export const handleLogin = async ({
    username,
    password,
    persistent,
    api,
    ignoreUnlock,
    hasGenerateKeys,
    hasTrustedDeviceRecovery,
    appName,
    hasInternalAddressSetup,
    payload,
}: {
    username: string;
    password: string;
    persistent: boolean;
    api: Api;
    ignoreUnlock: boolean;
    hasGenerateKeys: boolean;
    hasTrustedDeviceRecovery: boolean;
    appName: APP_NAMES;
    hasInternalAddressSetup: boolean;
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
        appName,
        authApi,
        ...getAuthTypes(authResult),
        username,
        persistent,
        loginPassword: password,
        ignoreUnlock,
        hasGenerateKeys,
        hasInternalAddressSetup,
        hasTrustedDeviceRecovery,
    };

    return next({ cache, from: AuthStep.LOGIN });
};
