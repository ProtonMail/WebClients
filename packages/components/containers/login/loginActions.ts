import { c } from 'ttag';

import { serverTime, wasServerTimeEverUpdated } from '@proton/crypto';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { auth2FA, getInfo, revoke } from '@proton/shared/lib/api/auth';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getKeySalts } from '@proton/shared/lib/api/keys';
import { getSettings, upgradePassword } from '@proton/shared/lib/api/settings';
import { getUser } from '@proton/shared/lib/api/user';
import { Fido2Data, InfoResponse } from '@proton/shared/lib/authentication/interface';
import loginWithFallback from '@proton/shared/lib/authentication/loginWithFallback';
import { maybeResumeSessionByUser, persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { wait } from '@proton/shared/lib/helpers/promise';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import {
    Api,
    KeyTransparencyActivation,
    UserSettings,
    Address as tsAddress,
    KeySalt as tsKeySalt,
    User as tsUser,
} from '@proton/shared/lib/interfaces';
import {
    getDecryptedUserKeysHelper,
    getRequiresPasswordSetup,
    getSentryError,
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
import { createKeyMigrationKTVerifier, createPreAuthKTVerifier } from '../keyTransparency';
import { AuthActionResponse, AuthCacheResult, AuthStep } from './interface';
import { getAuthTypes, handleUnlockKey } from './loginHelper';

const syncUser = async (cache: AuthCacheResult): Promise<tsUser> => {
    const user = await cache.api<{ User: tsUser }>(getUser()).then(({ User }) => User);
    cache.data.user = user;
    return user;
};

const syncAddresses = async (cache: AuthCacheResult): Promise<tsAddress[]> => {
    const addresses = await getAllAddresses(cache.api);
    cache.data.addresses = addresses;
    return addresses;
};

const syncSalts = async (cache: AuthCacheResult): Promise<tsKeySalt[]> => {
    const salts = await cache.api<{ KeySalts: tsKeySalt[] }>(getKeySalts()).then(({ KeySalts }) => KeySalts);
    cache.data.salts = salts;
    return salts;
};

/**
 * Finalize login can be called without a key password in these cases:
 * 1) The admin panel
 * 2) Users who have no keys but are in 2-password mode
 */
const finalizeLogin = async ({
    cache,
    loginPassword,
    keyPassword,
}: {
    cache: AuthCacheResult;
    loginPassword: string;
    keyPassword?: string;
}): Promise<AuthActionResponse> => {
    const { authResponse, authVersion, api, persistent, appName, hasTrustedDeviceRecovery, preAuthKTVerifier } = cache;

    if (authVersion < AUTH_VERSION) {
        await srpVerify({
            api,
            credentials: { password: loginPassword },
            config: upgradePassword(),
        });
    }

    if (appName !== APPS.PROTONACCOUNT) {
        const user = cache.data.user || (await syncUser(cache));
        const trusted = false;

        await persistSession({ ...authResponse, User: user, keyPassword, api, persistent, trusted });

        return {
            to: AuthStep.DONE,
            session: {
                ...authResponse,
                keyPassword,
                loginPassword,
                persistent,
                trusted,
                User: user,
                flow: 'login',
            },
        };
    }

    let [user, addresses] = await Promise.all([
        cache.data.user || syncUser(cache),
        cache.data.addresses || syncAddresses(cache),
    ]);

    const validatedSession = await maybeResumeSessionByUser(api, user);
    if (validatedSession) {
        await api(revoke()).catch(noop);
        return {
            to: AuthStep.DONE,
            session: { ...validatedSession, loginPassword, flow: 'login' },
        };
    }

    let trusted = false;
    if (hasTrustedDeviceRecovery && keyPassword) {
        const numberOfReactivatedKeys = await attemptDeviceRecovery({
            api,
            user,
            addresses,
            keyPassword,
            preAuthKTVerify: preAuthKTVerifier.preAuthKTVerify,
        }).catch(noop);

        if (numberOfReactivatedKeys !== undefined && numberOfReactivatedKeys > 0) {
            cache.data.user = undefined;
            cache.data.addresses = undefined;
            [user, addresses] = await Promise.all([syncUser(cache), syncAddresses(cache)]);
        }

        // Store device recovery information
        if (persistent) {
            const [userKeys] = await Promise.all([getDecryptedUserKeysHelper(user, keyPassword)]);
            const isDeviceRecoveryAvailable = getIsDeviceRecoveryAvailable({
                user,
                addresses,
                userKeys,
                appName,
            });

            if (isDeviceRecoveryAvailable) {
                const userSettings = await api<{ UserSettings: UserSettings }>(getSettings()).then(
                    ({ UserSettings }) => UserSettings
                );

                if (userSettings.DeviceRecovery) {
                    await storeDeviceRecovery({ api, user, userKeys });
                    trusted = true;
                }
            }
        } else {
            removeDeviceRecovery(user.ID);
        }
    }

    await persistSession({
        ...authResponse,
        User: user,
        keyPassword,
        api,
        persistent,
        trusted,
    });

    await preAuthKTVerifier.preAuthKTCommit(user.ID);

    return {
        to: AuthStep.DONE,
        session: {
            ...authResponse,
            keyPassword,
            loginPassword,
            persistent,
            trusted,
            User: user,
            flow: 'login',
        },
    };
};

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

    return finalizeLogin({ cache, loginPassword, keyPassword });
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
        const error: any = new Error(c('Error').t`Incorrect mailbox password. Please try again.`);
        error.name = 'PasswordError';
        error.trace = false;
        throw error;
    }

    return handleKeyUpgrade({
        cache,
        loginPassword,
        clearKeyPassword,
        keyPassword: unlockResult.keyPassword,
        isOnePasswordMode,
    });
};

/**
 * Setup keys and address for users that have not setup.
 */
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
    });

    cache.data.user = undefined;
    cache.data.addresses = undefined;

    return finalizeLogin({
        cache,
        loginPassword: newPassword,
        keyPassword,
    });
};

const next = async ({ cache, from }: { cache: AuthCacheResult; from: AuthStep }): Promise<AuthActionResponse> => {
    const { authTypes, ignoreUnlock, authResponse, loginPassword } = cache;

    if (from === AuthStep.LOGIN) {
        if (authTypes.fido2 || authTypes.totp) {
            return {
                cache,
                to: AuthStep.TWO_FA,
            };
        }
    }

    // Special case for the admin panel, return early since it can not get key salts.
    if (ignoreUnlock) {
        return finalizeLogin({ cache, loginPassword });
    }

    const [user] = await Promise.all([cache.data.user || syncUser(cache), cache.data.salts || syncSalts(cache)]);

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
    persistent,
    api,
    ignoreUnlock,
    hasTrustedDeviceRecovery,
    appName,
    toApp,
    payload,
    setupVPN,
    ktActivation,
}: {
    username: string;
    password: string;
    persistent: boolean;
    api: Api;
    ignoreUnlock: boolean;
    hasTrustedDeviceRecovery: boolean;
    appName: APP_NAMES;
    toApp: APP_NAMES | undefined;
    payload?: ChallengeResult;
    setupVPN: boolean;
    ktActivation: KeyTransparencyActivation;
}): Promise<AuthActionResponse> => {
    const infoResult = await api<InfoResponse>(getInfo(username));
    const { authVersion, result: authResponse } = await loginWithFallback({
        api,
        credentials: { username, password },
        initialAuthInfo: infoResult,
        payload,
        persistent,
    });

    const cache: AuthCacheResult = {
        authResponse,
        authVersion,
        appName,
        toApp,
        data: {},
        api,
        authTypes: getAuthTypes(authResponse, appName),
        username,
        persistent,
        loginPassword: password,
        ignoreUnlock,
        hasTrustedDeviceRecovery,
        setupVPN,
        preAuthKTVerifier: createPreAuthKTVerifier(ktActivation, api),
        keyMigrationKTVerifier: createKeyMigrationKTVerifier(ktActivation, api),
    };

    return next({ cache, from: AuthStep.LOGIN });
};
