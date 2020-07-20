import { useRef, useState } from 'react';
import { AUTH_VERSION } from 'pm-srp';
import { srpVerify } from 'proton-shared/lib/srp';
import { c } from 'ttag';
import { upgradePassword } from 'proton-shared/lib/api/settings';
import { auth2FA, getInfo, setCookies } from 'proton-shared/lib/api/auth';
import { getRandomString } from 'proton-shared/lib/helpers/string';
import { KeySalt as tsKeySalt, User as tsUser } from 'proton-shared/lib/interfaces';
import { getUser } from 'proton-shared/lib/api/user';
import { getKeySalts } from 'proton-shared/lib/api/keys';
import { HTTP_ERROR_CODES } from 'proton-shared/lib/errors';
import { AuthResponse, AuthVersion, InfoResponse } from 'proton-shared/lib/authentication/interface';
import loginWithFallback from 'proton-shared/lib/authentication/loginWithFallback';
import { withAuthHeaders } from 'proton-shared/lib/fetch/headers';
import { getAuthTypes, handleUnlockKey } from './helper';
import { useApi } from '../../index';
import { OnLoginArgs } from './interface';

export enum FORM {
    LOGIN,
    TOTP,
    U2F,
    UNLOCK,
}

export interface Props {
    onLogin: (args: OnLoginArgs) => void;
    ignoreUnlock?: boolean;
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

const useLogin = ({ onLogin, ignoreUnlock }: Props) => {
    const cacheRef = useRef<AuthCacheResult>();
    const api = useApi();

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
        const { authVersion, authResult, userSaltResult = [] } = cache;

        const [User] = userSaltResult;
        const { UID, EventID, AccessToken, RefreshToken } = authResult;
        const { password } = state;

        if (authVersion < AUTH_VERSION) {
            await srpVerify({
                api,
                credentials: { password },
                config: withAuthHeaders(UID, AccessToken, upgradePassword()),
            });
        }

        await api(setCookies({ UID, AccessToken, RefreshToken, State: getRandomString(24) }));

        onLogin({ UID, User, keyPassword, EventID });
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
            const error = new Error(c('Error').t`Wrong mailbox password`);
            error.name = 'PasswordError';
            throw error;
        }

        return finalizeLogin(result.keyPassword);
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

        /**
         * Handle the case for users who are in 2-password mode but have no keys setup.
         * Typically happens for VPN users.
         */
        if (!cache.userSaltResult) {
            cache.userSaltResult = await Promise.all([
                api<{ User: tsUser }>(withAuthHeaders(UID, AccessToken, getUser())).then(({ User }) => User),
                api<{ KeySalts: tsKeySalt[] }>(withAuthHeaders(UID, AccessToken, getKeySalts())).then(
                    ({ KeySalts }) => KeySalts
                ),
            ]);
        }
        const [User] = cache.userSaltResult;

        if (User.Keys.length === 0) {
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
    const handleTotp = async () => {
        const cache = cacheRef.current;
        if (!cache || !cache.authResult) {
            throw new Error('Missing cache');
        }

        const { authResult } = cache;
        const { UID, AccessToken } = authResult;
        const { totp } = state;

        await api(withAuthHeaders(UID, AccessToken, auth2FA({ totp }))).catch((e) => {
            // In case of any other error than retry error, automatically cancel here to allow the user to retry.
            if (e.status !== HTTP_ERROR_CODES.UNPROCESSABLE_ENTITY) {
                handleCancel();
            }
            throw e;
        });

        return next(FORM.TOTP);
    };

    /**
     * Step 1. Handle the initial auth.
     * Unless there is an auth type active, the flow will continue until it's logged in.
     */
    const handleLogin = async () => {
        try {
            const { username, password } = state;
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
        } catch (e) {
            cacheRef.current = undefined;

            throw e;
        }
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
        handleLogin,
        handleTotp,
        handleUnlock,
        handleCancel,
        setUsername,
        setPassword,
        setKeyPassword,
        setTotp,
        setIsTotpRecovery,
    };
};

export default useLogin;
