import { useMemo, useRef, useState } from 'react';
import { AUTH_VERSION } from 'pm-srp';
import { c } from 'ttag';
import { srpVerify } from 'proton-shared/lib/srp';
import { upgradePassword } from 'proton-shared/lib/api/settings';
import { auth2FA, getInfo, revoke } from 'proton-shared/lib/api/auth';
import {
    Address as tsAddress,
    Api,
    KeySalt as tsKeySalt,
    Member as tsMember,
    User as tsUser,
} from 'proton-shared/lib/interfaces';
import { getUser } from 'proton-shared/lib/api/user';
import { getKeySalts } from 'proton-shared/lib/api/keys';
import { HTTP_ERROR_CODES } from 'proton-shared/lib/errors';
import { InfoResponse } from 'proton-shared/lib/authentication/interface';
import loginWithFallback from 'proton-shared/lib/authentication/loginWithFallback';
import { withAuthHeaders } from 'proton-shared/lib/fetch/headers';
import { noop } from 'proton-shared/lib/helpers/function';
import { maybeResumeSessionByUser, persistSession } from 'proton-shared/lib/authentication/persistedSessionHelper';
import { MEMBER_PRIVATE, USER_ROLES } from 'proton-shared/lib/constants';
import { queryAddresses } from 'proton-shared/lib/api/addresses';
import { getHasV2KeysToUpgrade, upgradeV2KeysHelper } from 'proton-shared/lib/keys/upgradeKeysV2';
import { traceError } from 'proton-shared/lib/helpers/sentry';
import { getMember } from 'proton-shared/lib/api/members';
import { getApiErrorMessage } from 'proton-shared/lib/api/helpers/apiErrorHelper';

import { getAuthTypes, handleUnlockKey } from './helper';
import handleSetupAddressKeys from './handleSetupAddressKeys';
import { AuthCacheResult, FORM, LoginModel } from './interface';
import { OnLoginCallback } from '../app/interface';
import { getLoginErrors, getLoginSetters } from './useLoginHelpers';

const INITIAL_STATE: LoginModel = {
    username: '',
    password: '',
    totp: '',
    isTotpRecovery: false,
    keyPassword: '',
    newPassword: '',
    confirmNewPassword: '',
    form: FORM.LOGIN,
};

export interface Props {
    api: Api;
    onLogin: OnLoginCallback;
    ignoreUnlock?: boolean;
    hasGenerateKeys?: boolean;
}

const useLogin = ({ api, onLogin, ignoreUnlock, hasGenerateKeys = false }: Props) => {
    const cacheRef = useRef<AuthCacheResult>();
    const [state, setState] = useState<LoginModel>(INITIAL_STATE);

    const handleCancel = () => {
        cacheRef.current = undefined;
        setState(INITIAL_STATE);
    };

    const getCache = () => {
        const cache = cacheRef.current;
        if (!cache) {
            throw new Error('Invalid state');
        }
        return cache;
    };

    /**
     * Finalize login can be called without a key password in these cases:
     * 1) The admin panel
     * 2) Users who have no keys but are in 2-password mode
     */
    const finalizeLogin = async ({
        loginPassword,
        keyPassword,
        user: maybeUser,
        addresses: maybeAddresess,
    }: {
        loginPassword: string;
        keyPassword?: string;
        user?: tsUser;
        addresses?: tsAddress[];
    }) => {
        const { authResult, authVersion, authApi } = getCache();
        cacheRef.current = undefined;

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
            const result = await onLogin(validatedSession);
            return result;
        }

        await persistSession({ ...authResult, User, keyPassword, api });
        await onLogin({ ...authResult, User, Addresses: maybeAddresess, keyPassword });
    };

    const handleKeyUpgrade = async ({
        loginPassword,
        clearKeyPassword,
        keyPassword,
        user: maybeUser,
        isOnePasswordMode,
    }: {
        loginPassword: string;
        clearKeyPassword: string;
        keyPassword: string;
        user?: tsUser;
        addresses?: tsAddress;
        isOnePasswordMode?: boolean;
    }) => {
        const { authApi } = getCache();

        const [User, Addresses] = await Promise.all([
            maybeUser || authApi<{ User: tsUser }>(getUser()).then(({ User }) => User),
            hasGenerateKeys
                ? authApi<{ Addresses: tsAddress[] }>(queryAddresses()).then(({ Addresses }) => Addresses)
                : undefined,
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
                traceError(e);
                return undefined;
            });
            if (newKeyPassword !== undefined) {
                return finalizeLogin({
                    loginPassword,
                    keyPassword: newKeyPassword,
                    // undefined user and addresses to trigger a refresh
                    user: undefined,
                    addresses: undefined,
                });
            }
        }

        return finalizeLogin({
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
    const handleUnlock = async (loginPassword: string, clearKeyPassword: string, isOnePasswordMode: boolean) => {
        const { userSaltResult } = getCache();
        if (!userSaltResult) {
            throw new Error('Invalid state');
        }

        const [User, KeySalts] = userSaltResult;

        const result = await handleUnlockKey(User, KeySalts, clearKeyPassword).catch(() => undefined);
        if (!result) {
            const error = new Error(c('Error').t`Incorrect mailbox password. Please try again`);
            error.name = 'PasswordError';
            throw error;
        }

        await handleKeyUpgrade({
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
    const handleSetupPassword = async (newPassword: string) => {
        const { authApi } = getCache();
        const keyPassword = await handleSetupAddressKeys({
            api: authApi,
            username: state.username,
            password: newPassword,
        });
        await finalizeLogin({
            loginPassword: newPassword,
            keyPassword,
            // Undefined user to force refresh to get keys that were just setup
            user: undefined,
        });
    };

    const next = async (previousForm: FORM) => {
        const cache = getCache();
        const { hasTotp, hasUnlock, hasU2F, authApi } = cache;

        const gotoForm = (form: FORM) => {
            return setState((state: LoginModel) => ({ ...state, form }));
        };

        if (previousForm === FORM.LOGIN && hasTotp) {
            return gotoForm(FORM.TOTP);
        }

        if ((previousForm === FORM.LOGIN || previousForm === FORM.TOTP) && hasU2F) {
            return gotoForm(FORM.U2F);
        }

        const loginPassword = state.password;

        // Special case for the admin panel, return early since it can not get key salts.
        if (ignoreUnlock) {
            return finalizeLogin({
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
                if (User.Role === USER_ROLES.MEMBER_ROLE && User.Private === MEMBER_PRIVATE.UNREADABLE) {
                    return gotoForm(FORM.NEW_PASSWORD);
                }
                if (User.Role === USER_ROLES.ADMIN_ROLE && User.Private === MEMBER_PRIVATE.UNREADABLE) {
                    // Attempt to find out if this was an admin member added to an organization
                    const selfMember = await authApi<{ Member: tsMember }>(getMember('me')).then(
                        ({ Member }) => Member
                    );
                    // If the member is not the super owner, then he was probably added to the organization, and we can display the new password selection screen
                    if (!selfMember.Subscriber) {
                        return gotoForm(FORM.NEW_PASSWORD);
                    }
                    // If the member is the super owner, then fall through to the automatic setup
                }
                return handleSetupPassword(loginPassword);
            }
            return finalizeLogin({ loginPassword, user: User });
        }

        if (hasUnlock) {
            return gotoForm(FORM.UNLOCK);
        }

        return handleUnlock(loginPassword, loginPassword, true);
    };

    /**
     * Step 2. Handle TOTP.
     * Unless there is another auth type active, the flow will continue until it's logged in.
     */
    const handleTotp = async (totp: string) => {
        const { authApi } = getCache();

        await authApi(auth2FA({ totp })).catch((e) => {
            if (e.status === HTTP_ERROR_CODES.UNPROCESSABLE_ENTITY) {
                const error = new Error(
                    getApiErrorMessage(e) || c('Error').t`Incorrect login credentials. Please try again`
                );
                error.name = 'TOTPError';
                throw error;
            }
            throw e;
        });

        await next(FORM.TOTP);
    };

    /**
     * Step 1. Handle the initial auth.
     * Unless there is an auth type active, the flow will continue until it's logged in.
     */
    const handleLogin = async (username: string, password: string) => {
        const infoResult = await api<InfoResponse>(getInfo(username));
        const { authVersion, result: authResult } = await loginWithFallback({
            api,
            credentials: { username, password },
            initialAuthInfo: infoResult,
        });
        const { UID, AccessToken } = authResult;
        const authApi = <T>(config: any) => api<T>(withAuthHeaders(UID, AccessToken, config));

        cacheRef.current = {
            authResult,
            authVersion,
            authApi,
            ...getAuthTypes(authResult),
        };

        await next(FORM.LOGIN);
    };

    const setters = useMemo(() => {
        return getLoginSetters(setState);
    }, [setState]);

    const errors = useMemo(() => {
        return getLoginErrors(state);
    }, [state]);

    return {
        state,
        errors,
        setters,
        handleLogin: () => {
            const { username, password } = state;
            return handleLogin(username, password).catch((e) => {
                cacheRef.current = undefined;
                throw e;
            });
        },
        handleTotp: () => {
            const { totp } = state;
            return handleTotp(totp).catch((e) => {
                // If TOTP Error, can try another totp entry, otherwise cancel to restart the login procedure
                if (e.name !== 'TOTPError') {
                    handleCancel();
                }
                throw e;
            });
        },
        handleUnlock: () => {
            const { password, keyPassword } = state;
            return handleUnlock(password, keyPassword, true).catch((e) => {
                if (e.name !== 'PasswordError') {
                    handleCancel();
                }
                throw e;
            });
        },
        handleSetNewPassword: () => {
            const { newPassword } = state;
            return handleSetupPassword(newPassword).catch((e) => {
                handleCancel();
                throw e;
            });
        },
        handleCancel,
    };
};

export default useLogin;
