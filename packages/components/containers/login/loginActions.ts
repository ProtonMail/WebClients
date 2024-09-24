import { c } from 'ttag';

import { serverTime, wasServerTimeEverUpdated } from '@proton/crypto';
import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { auth2FA, getInfo, revoke } from '@proton/shared/lib/api/auth';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getKeySalts } from '@proton/shared/lib/api/keys';
import { getSettings, upgradePassword } from '@proton/shared/lib/api/settings';
import { getUser } from '@proton/shared/lib/api/user';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { AuthResponse, AuthVersion, Fido2Data, InfoResponse } from '@proton/shared/lib/authentication/interface';
import loginWithFallback from '@proton/shared/lib/authentication/loginWithFallback';
import { maybeResumeSessionByUser, persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, MINUTE } from '@proton/shared/lib/constants';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { wait } from '@proton/shared/lib/helpers/promise';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getHostname } from '@proton/shared/lib/helpers/url';
import type {
    Api,
    KeyTransparencyActivation,
    UserSettings,
    VerifyOutboundPublicKeys,
    Address as tsAddress,
    KeySalt as tsKeySalt,
    User as tsUser,
} from '@proton/shared/lib/interfaces';
import { createKeyMigrationKTVerifier, createPreAuthKTVerifier } from '@proton/shared/lib/keyTransparency';
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

import type { ChallengeResult } from '../challenge/interface';
import type { AuthActionResponse, AuthCacheResult, AuthSession, AuthType } from './interface';
import { AuthStep } from './interface';
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
    clearKeyPassword,
}: {
    cache: AuthCacheResult;
    loginPassword: string;
    keyPassword?: string;
    clearKeyPassword?: string;
}): Promise<AuthActionResponse> => {
    const { authResponse, authVersion, api, persistent, appName, preAuthKTVerifier } = cache;

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

        const { clientKey, offlineKey } = await persistSession({
            ...authResponse,
            clearKeyPassword: clearKeyPassword || '',
            keyPassword,
            User: user,
            api,
            persistent,
            trusted,
        });

        return {
            to: AuthStep.DONE,
            session: {
                ...authResponse,
                keyPassword,
                clientKey,
                offlineKey,
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
    if (keyPassword) {
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
                    const deviceRecoveryUpdated = await storeDeviceRecovery({ api, user, userKeys }).catch(noop);
                    if (deviceRecoveryUpdated) {
                        // Storing device recovery (when setting a new recovery secret) modifies the user object
                        cache.data.user = undefined;
                        user = await syncUser(cache);
                    }
                    trusted = true;
                }
            }
        } else {
            removeDeviceRecovery(user.ID);
        }
    }

    const { clientKey, offlineKey } = await persistSession({
        ...authResponse,
        clearKeyPassword: clearKeyPassword || '',
        keyPassword,
        User: user,
        api,
        persistent,
        trusted,
    });

    await preAuthKTVerifier.preAuthKTCommit(user.ID, api);

    return {
        to: AuthStep.DONE,
        session: {
            ...authResponse,
            keyPassword,
            loginPassword,
            offlineKey,
            clientKey,
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

    return finalizeLogin({ cache, loginPassword, keyPassword, clearKeyPassword });
};

export const getUnlockError = () => {
    const error: any = new Error(c('Error').t`Incorrect second password. Please try again.`);
    error.name = 'PasswordError';
    error.trace = false;
    return error;
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
}: {
    authSession: AuthSession;
    User: tsUser;
    clearKeyPassword: string;
    salts: tsKeySalt[];
    api: Api;
}) => {
    const unlockResult = await handleUnlockKey(User, salts, clearKeyPassword).catch(() => undefined);
    if (!unlockResult) {
        throw getUnlockError();
    }
    const newAuthSession = {
        ...authSession,
        User,
        keyPassword: unlockResult.keyPassword,
    };
    const { clientKey, offlineKey } = await persistSession({
        ...newAuthSession,
        clearKeyPassword,
        api,
    });
    return { ...newAuthSession, clientKey, offlineKey, prompt: null };
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
    const { authTypes, ignoreUnlock, authResponse, loginPassword } = cache;

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
    const infoResult = await api<InfoResponse>(getInfo(username));
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
    verifyOutboundPublicKeys,
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
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys | null;
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
        verifyOutboundPublicKeys,
        authTypes: getAuthTypes(authResponse, appName),
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

export class ExternalSSOError extends Error {}

export const handleExternalSSOLogin = ({
    token,
    signal,
    finalRedirectBaseUrl,
}: {
    token: string;
    signal: AbortSignal;
    finalRedirectBaseUrl?: string;
}) => {
    if (!token) {
        throw new Error('Unexpected response');
    }

    const url = new URL(`${window.location.origin}/api/auth/sso/${token}`);

    if (finalRedirectBaseUrl) {
        url.searchParams.set('FinalRedirectBaseUrl', finalRedirectBaseUrl);
    }

    const handleMessage = (event: MessageEvent) => {
        if (event.data.action === 'sso' && event.data.payload) {
            const uid: string = event.data.payload.uid;
            const token: string = event.data.payload.token;
            return {
                action: 'resolve' as const,
                payload: { uid, token },
            };
        }
    };

    const tab = window.open(url);

    if (!tab) {
        throw new ExternalSSOError('Unable to open tab');
    }

    return new Promise<{ uid: string; token: string }>((resolve, reject) => {
        let openHandle: ReturnType<typeof setInterval> | undefined = undefined;
        let timeoutHandle: ReturnType<typeof setTimeout> | undefined = undefined;
        let reset: () => void;

        const assertOpen = () => {
            if (!tab || tab.closed) {
                reset();
                reject(new ExternalSSOError('Process closed'));
            }
        };

        const onMessage = (event: MessageEvent) => {
            if (event.source !== tab && getHostname(event.origin) !== window.location.origin) {
                return;
            }

            const result = handleMessage(event);
            if (!result) {
                return;
            }

            if (result.action === 'resolve') {
                resolve(result.payload);
            } else if (result.action === 'reject') {
                reject(result.payload);
            }

            reset();
            tab?.close?.();
        };

        const abort = () => {
            reset();
            tab?.close?.();
            reject(new ExternalSSOError('Process aborted'));
        };

        reset = () => {
            clearTimeout(timeoutHandle);
            clearInterval(openHandle);
            window.removeEventListener('message', onMessage, false);
            signal.removeEventListener('abort', abort);
        };

        signal.addEventListener('abort', abort);
        window.addEventListener('message', onMessage, false);
        openHandle = setInterval(() => {
            assertOpen();
        }, 2500);
        timeoutHandle = setTimeout(() => {
            abort();
        }, 10 * MINUTE);
    });
};
