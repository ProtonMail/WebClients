import { useRef, useState } from 'react';
import { AUTH_VERSION } from 'pm-srp';
import { c } from 'ttag';
import { srpVerify } from 'proton-shared/lib/srp';
import { upgradePassword } from 'proton-shared/lib/api/settings';
import { auth2FA, getInfo, revoke } from 'proton-shared/lib/api/auth';
import { Api, KeySalt as tsKeySalt, User as tsUser } from 'proton-shared/lib/interfaces';
import { getUser } from 'proton-shared/lib/api/user';
import { getKeySalts } from 'proton-shared/lib/api/keys';
import { HTTP_ERROR_CODES } from 'proton-shared/lib/errors';
import { AuthResponse, AuthVersion, InfoResponse } from 'proton-shared/lib/authentication/interface';
import loginWithFallback from 'proton-shared/lib/authentication/loginWithFallback';
import { withAuthHeaders } from 'proton-shared/lib/fetch/headers';
import { noop } from 'proton-shared/lib/helpers/function';
import { persistSession, maybeResumeSessionByUser } from 'proton-shared/lib/authentication/persistedSessionHelper';
import { getAuthTypes, handleUnlockKey } from './helper';
import { OnLoginCallback } from '../app/interface';
import handleSetupAddressKeys from './handleSetupAddressKeys';

export enum FORM {
    LOGIN,
    TOTP,
    U2F,
    UNLOCK,
}

export interface Props {
    api: Api;
    onLogin: OnLoginCallback;
    ignoreUnlock?: boolean;
    generateKeys?: boolean;
}

interface AuthCacheResult {
    authVersion?: AuthVersion;
    authResult?: AuthResponse;
    userSaltResult?: [tsUser, tsKeySalt[]];
}

interface State {
    username: string;
    password: string;
    totp: string;
    isTotpRecovery: boolean;
    keyPassword: string;
    form: FORM;
}

const INITIAL_STATE = {
    username: '',
    password: '',
    totp: '',
    isTotpRecovery: false,
    keyPassword: '',
    form: FORM.LOGIN,
};

const useLogin = ({ api, onLogin, ignoreUnlock, generateKeys = false }: Props) => {
    const cacheRef = useRef<AuthCacheResult>();

    const [state, setState] = useState<State>(INITIAL_STATE);

    const handleCancel = () => {
        cacheRef.current = undefined;
        setState(INITIAL_STATE);
    };

    /**
     * Finalize login can be called without a key password in these cases:
     * 1) The admin panel
     * 2) Users who have no keys but are in 2-password mode
     */
    const finalizeLogin = async (keyPassword?: string) => {
        const cache = cacheRef.current;
        if (!cache || cache.authResult === undefined || cache.authVersion === undefined) {
            throw new Error('Invalid state');
        }
        cacheRef.current = undefined;
        const { authVersion, authResult, userSaltResult } = cache;

        const { UID, AccessToken } = authResult;
        const { password } = state;

        const authApi = <T>(config: any) => api<T>(withAuthHeaders(UID, AccessToken, config));
        if (authVersion < AUTH_VERSION) {
            await srpVerify({
                api,
                credentials: { password },
                config: authApi(upgradePassword()),
            });
        }

        const User = userSaltResult
            ? userSaltResult[0]
            : await authApi<{ User: tsUser }>(getUser()).then(({ User }) => User);

        const validatedSession = await maybeResumeSessionByUser(api, User);
        if (validatedSession) {
            authApi(revoke()).catch(noop);
            return await onLogin(validatedSession);
        }

        await persistSession({ ...authResult, User, keyPassword, api });
        await onLogin({ ...authResult, User, keyPassword });
    };

    /**
     * Step 3. Handle unlock.
     * Attempt to decrypt the primary private key with the password.
     */
    const handleUnlock = async (password: string) => {
        const cache = cacheRef.current;
        if (!cache || !cache.userSaltResult) {
            throw new Error('Invalid state');
        }

        const { userSaltResult } = cache;
        const [User, KeySalts] = userSaltResult;

        const result = await handleUnlockKey(User, KeySalts, password).catch(() => undefined);
        if (!result) {
            const error = new Error(c('Error').t`Incorrect mailbox password. Please try again`);
            error.name = 'PasswordError';
            throw error;
        }

        await finalizeLogin(result.keyPassword);
    };

    const next = async (previousForm: FORM) => {
        const cache = cacheRef.current;
        if (!cache || cache.authResult === undefined) {
            throw new Error('Invalid state');
        }
        const { authResult } = cache;
        const { UID, AccessToken } = authResult;
        const { hasTotp, hasU2F, hasUnlock } = getAuthTypes(authResult);

        const gotoForm = (form: FORM) => {
            return setState((state: State) => ({ ...state, form }));
        };

        if (previousForm === FORM.LOGIN && hasTotp) {
            return gotoForm(FORM.TOTP);
        }

        if ((previousForm === FORM.LOGIN || previousForm === FORM.TOTP) && hasU2F) {
            return gotoForm(FORM.U2F);
        }

        // Special case for the admin panel, return early since it can not get key salts.
        if (ignoreUnlock) {
            return finalizeLogin();
        }

        if (!cache.userSaltResult) {
            const authApi = <T>(config: any) => api<T>(withAuthHeaders(UID, AccessToken, config));
            cache.userSaltResult = await Promise.all([
                authApi<{ User: tsUser }>(getUser()).then(({ User }) => User),
                authApi<{ KeySalts: tsKeySalt[] }>(getKeySalts()).then(({ KeySalts }) => KeySalts),
            ]);
        }
        const [User] = cache.userSaltResult;

        if (User.Keys.length === 0) {
            if (generateKeys) {
                const authApi = <T>(config: any) => api<T>(withAuthHeaders(UID, AccessToken, config));
                const keyPassword = await handleSetupAddressKeys({
                    api: authApi,
                    username: state.username,
                    password: state.password,
                });
                return finalizeLogin(keyPassword);
            }
            return finalizeLogin();
        }

        if (hasUnlock) {
            return gotoForm(FORM.UNLOCK);
        }

        return handleUnlock(state.password);
    };

    /**
     * Step 2. Handle TOTP.
     * Unless there is another auth type active, the flow will continue until it's logged in.
     */
    const handleTotp = async (totp: string) => {
        const cache = cacheRef.current;
        if (!cache || !cache.authResult) {
            throw new Error('Missing cache');
        }

        const { authResult } = cache;
        const { UID, AccessToken } = authResult;

        await api(withAuthHeaders(UID, AccessToken, auth2FA({ totp }))).catch((e) => {
            if (e.status === HTTP_ERROR_CODES.UNPROCESSABLE_ENTITY) {
                const error = new Error(e.data?.Error || c('Error').t`Incorrect login credentials. Please try again`);
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

        cacheRef.current = {
            authResult,
            authVersion,
        };

        await next(FORM.LOGIN);
    };

    const getSetter = <T>(key: keyof State) => (value: T) => setState({ ...state, [key]: value });

    const setUsername = getSetter<string>('username');
    const setPassword = getSetter<string>('password');
    const setTotp = getSetter<string>('totp');
    const setKeyPassword = getSetter<string>('keyPassword');
    const setIsTotpRecovery = getSetter<boolean>('isTotpRecovery');

    return {
        state,
        setState,
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
            const { keyPassword } = state;
            return handleUnlock(keyPassword).catch((e) => {
                if (e.name !== 'PasswordError') {
                    handleCancel();
                }
                throw e;
            });
        },
        handleCancel,
        setUsername,
        setPassword,
        setKeyPassword,
        setTotp,
        setIsTotpRecovery,
    };
};

export default useLogin;
