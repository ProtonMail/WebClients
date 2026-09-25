import { AUTH_VERSION } from '@protontech/crypto/srp';
import { c } from 'ttag';

import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { auth2FA, getInfo } from '@proton/shared/lib/api/auth';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getKeySalts } from '@proton/shared/lib/api/keys';
import { upgradePassword } from '@proton/shared/lib/api/settings';
import { getUser } from '@proton/shared/lib/api/user';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { SecondPasswordError, TOTPError } from '@proton/shared/lib/authentication/error';
import type { AuthResponse, AuthVersion, Fido2Data, InfoResponse } from '@proton/shared/lib/authentication/interface';
import loginWithFallback from '@proton/shared/lib/authentication/loginWithFallback';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { type AuthTypes, getAuthTypes } from '@proton/shared/lib/authentication/twoFactor';
import { handleUnlockKey } from '@proton/shared/lib/authentication/unlockKey';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Api, KeySalt as tsKeySalt, User as tsUser } from '@proton/shared/lib/interfaces';
import { getRequiresPasswordSetup } from '@proton/shared/lib/keys';
import { handleSetupAddressKeys } from '@proton/shared/lib/keys/setupAddressKeys';
import { srpVerify } from '@proton/shared/lib/srp';

import type { AuthSession } from '../app/interface';

export enum AuthStep {
    LOGIN = 0,
    TWO_FA = 1,
    UNLOCK = 3,
    DONE = 6,
}

/** What the legacy password login (MinimalLoginContainer) carries between its steps. */
export interface AuthCacheResult {
    api: Api;
    authResponse: AuthResponse;
    authVersion: AuthVersion;
    authTypes: AuthTypes;
    username: string;
    loginPassword: string;
    persistent: boolean;
    productParam: ProductParam;
    /** Loaded after the second factor; the unlock step needs them. */
    account?: { user: tsUser; salts: tsKeySalt[] };
}

export type AuthActionResponse =
    | {
          to: AuthStep.DONE;
          session: AuthSession;
      }
    | {
          cache: AuthCacheResult;
          to: Exclude<AuthStep, AuthStep.DONE>;
      };

const fetchUser = (api: Api) => api<{ User: tsUser }>(getUser()).then(({ User }) => User);

const fetchSalts = (api: Api) => api<{ KeySalts: tsKeySalt[] }>(getKeySalts()).then(({ KeySalts }) => KeySalts);

/**
 * Finalize login can be called without a key password for users who have no keys but are in 2-password mode.
 */
const finalizeLogin = async ({
    cache,
    user,
    loginPassword,
    keyPassword = '',
    clearKeyPassword = '',
}: {
    cache: AuthCacheResult;
    user: tsUser;
    loginPassword: string;
    keyPassword?: string;
    clearKeyPassword?: string;
}): Promise<AuthActionResponse> => {
    const { authResponse, authVersion, api, persistent } = cache;

    if (authVersion < AUTH_VERSION) {
        await srpVerify({
            api,
            credentials: { password: loginPassword },
            config: upgradePassword(),
        });
    }

    const sessionResult = await persistSession({
        ...authResponse,
        clearKeyPassword,
        keyPassword,
        api,
        persistent,
        User: user,
        trusted: false,
        source: SessionSource.Proton,
    });

    return {
        to: AuthStep.DONE,
        session: {
            data: sessionResult,
            loginPassword,
        },
    };
};

/** Decrypts the primary private key with the password, then signs in. */
const unlock = async ({
    cache,
    user,
    salts,
    clearKeyPassword,
}: {
    cache: AuthCacheResult;
    user: tsUser;
    salts: tsKeySalt[];
    clearKeyPassword: string;
}) => {
    await wait(500);

    const unlockResult = await handleUnlockKey(user, salts, clearKeyPassword).catch(() => undefined);
    if (!unlockResult) {
        throw new SecondPasswordError();
    }

    return finalizeLogin({
        cache,
        user,
        loginPassword: cache.loginPassword,
        keyPassword: unlockResult.keyPassword,
        clearKeyPassword,
    });
};

/**
 * Step 3. Handle unlock.
 * Attempt to decrypt the primary private key with the second password.
 */
export const handleUnlock = async ({
    cache,
    clearKeyPassword,
}: {
    cache: AuthCacheResult;
    clearKeyPassword: string;
}) => {
    if (!cache.account) {
        throw new Error('Invalid state');
    }
    return unlock({ cache, ...cache.account, clearKeyPassword });
};

/** Accounts without keys that need an address: set it up with the login password, then sign in. */
const setupPassword = async ({ cache }: { cache: AuthCacheResult }) => {
    const { api, username, loginPassword } = cache;

    const [domains, addresses] = await Promise.all([
        api<{ Domains: string[] }>(queryAvailableDomains('signup')).then(({ Domains }) => Domains),
        getAllAddresses(api),
    ]);

    const keyPassword = await handleSetupAddressKeys({
        api,
        username,
        password: loginPassword,
        addresses,
        domains,
        // Key transparency is off in the standalone app
        preAuthKTVerify: () => async () => {},
        productParam: cache.productParam,
    });

    return finalizeLogin({
        cache,
        // The keys were just created
        user: await fetchUser(api),
        loginPassword,
        keyPassword,
        clearKeyPassword: loginPassword,
    });
};

const next = async ({ cache, from }: { cache: AuthCacheResult; from: AuthStep }): Promise<AuthActionResponse> => {
    const { api, authTypes, authResponse, loginPassword } = cache;

    if (from === AuthStep.LOGIN && authTypes.twoFactor.enabled) {
        return { cache, to: AuthStep.TWO_FA };
    }

    const [user, salts] = await Promise.all([fetchUser(api), fetchSalts(api)]);

    if (user.Keys.length === 0) {
        if (authResponse.TemporaryPassword) {
            // Neither caller has a new password step; the account sign-in handles temporary passwords
            throw new Error('Temporary passwords are not supported here');
        }
        if (getRequiresPasswordSetup(user, false)) {
            return setupPassword({ cache });
        }
        return finalizeLogin({ cache, user, loginPassword });
    }

    if (authTypes.unlock) {
        return { cache: { ...cache, account: { user, salts } }, to: AuthStep.UNLOCK };
    }

    return unlock({ cache, user, salts, clearKeyPassword: loginPassword });
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
            throw new TOTPError(getApiErrorMessage(e) || c('Error').t`Incorrect login credentials. Please try again.`);
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
}: {
    username: string;
    password: string;
    persistent: boolean;
    api: Api;
}) => {
    const infoResult = await api<InfoResponse>(getInfo({ username }));
    const authResult = await loginWithFallback({
        api,
        credentials: { username, password },
        initialAuthInfo: infoResult,
        persistent,
    });
    return { infoResult, authResult };
};

export const handleNextLogin = async ({
    authResponse,
    authVersion,
    username,
    password,
    persistent,
    api,
    appName,
    productParam,
}: {
    authVersion: AuthVersion;
    authResponse: AuthResponse;
    username: string;
    password: string;
    persistent: boolean;
    api: Api;
    appName: APP_NAMES;
    productParam: ProductParam;
}): Promise<AuthActionResponse> => {
    const cache: AuthCacheResult = {
        api,
        authResponse,
        authVersion,
        authTypes: getAuthTypes({ info: authResponse, app: appName, location: window.location }),
        username,
        loginPassword: password,
        persistent,
        productParam,
    };
    return next({ cache, from: AuthStep.LOGIN });
};
