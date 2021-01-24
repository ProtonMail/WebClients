import { useRef, useState } from 'react';
import { c } from 'ttag';
import { hasAddressKeyMigration } from 'proton-shared/lib/constants';
import { requestLoginResetToken, validateResetToken } from 'proton-shared/lib/api/reset';
import { getRecoveryMethods, getUser } from 'proton-shared/lib/api/user';
import { generateKeySaltAndPassphrase, getResetAddressesKeys, getResetAddressesKeysV2 } from 'proton-shared/lib/keys';
import { srpAuth, srpVerify } from 'proton-shared/lib/srp';
import { resetKeysRoute } from 'proton-shared/lib/api/keys';
import { Address, User as tsUser } from 'proton-shared/lib/interfaces';
import { auth } from 'proton-shared/lib/api/auth';
import { persistSession } from 'proton-shared/lib/authentication/persistedSessionHelper';
import { AuthResponse } from 'proton-shared/lib/authentication/interface';

import { withAuthHeaders } from 'proton-shared/lib/fetch/headers';
import { API_CUSTOM_ERROR_CODES } from 'proton-shared/lib/errors';

import { useApi, useNotifications, useLoading } from '../../hooks';
import { OnLoginCallback } from '../app';

export enum STEPS {
    REQUEST_RECOVERY_METHODS = 1,
    NO_RECOVERY_METHODS,
    REQUEST_RESET_TOKEN,
    VALIDATE_RESET_TOKEN,
    DANGER_VERIFICATION,
    NEW_PASSWORD,
    ERROR,
}

interface Props {
    onLogin: OnLoginCallback;
    initalStep?: STEPS;
}

export type RecoveryMethod = 'email' | 'sms' | 'login';
export type AccountType = 'internal' | 'external';

export interface State {
    username: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    token: string;
    danger: string;
    methods?: RecoveryMethod[];
    step: STEPS;
    error?: string;
}

const INITIAL_STATE = {
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    token: '',
    danger: '',
    step: STEPS.REQUEST_RESET_TOKEN,
};

const useResetPassword = ({ onLogin, initalStep }: Props) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const [state, setState] = useState<State>({ ...INITIAL_STATE, step: initalStep || INITIAL_STATE.step });
    const [loading, withLoading] = useLoading();
    const addressesRef = useRef<Address[]>([]);
    const dangerWord = 'DANGER';

    const gotoStep = (step: STEPS) => {
        return setState((state: State) => ({ ...state, step }));
    };

    const displayTokenNotification = (destination: string) =>
        createNotification({ text: c('Info').t`Done! We sent a code to ${destination}`, expiration: 5000 });

    const handleRequestRecoveryMethods = async () => {
        const { username } = state;
        try {
            const { Type, Methods }: { Type: AccountType; Methods: RecoveryMethod[] } = await api(
                getRecoveryMethods(username)
            );
            if (Type === 'internal' && Methods.length) {
                return setState((state: State) => ({
                    ...state,
                    methods: Methods,
                    step: STEPS.REQUEST_RESET_TOKEN,
                }));
            }
            if (Type === 'external' && Methods.includes('login')) {
                await api(requestLoginResetToken({ Username: username, Email: username }));
                displayTokenNotification(username);
                return setState((state: State) => ({
                    ...state,
                    email: username,
                    methods: Methods,
                    step: STEPS.VALIDATE_RESET_TOKEN,
                }));
            }
            setState((state: State) => ({
                ...state,
                methods: Methods,
                step: STEPS.REQUEST_RESET_TOKEN,
            }));
        } catch (error) {
            const { data: { Code, Error } = { Code: 0, Error: '' } } = error;
            if ([API_CUSTOM_ERROR_CODES.NO_RESET_METHODS].includes(Code)) {
                return setState((state: State) => ({
                    ...state,
                    error: Error,
                    step: STEPS.ERROR,
                }));
            }
            throw error;
        }
    };

    const handleRequest = async () => {
        const { username, email, phone } = state;
        if (email) {
            await api(requestLoginResetToken({ Username: username, Email: email }));
            displayTokenNotification(email);
            return gotoStep(STEPS.VALIDATE_RESET_TOKEN);
        }
        if (phone) {
            await api(requestLoginResetToken({ Username: username, Phone: phone }));
            displayTokenNotification(phone);
            return gotoStep(STEPS.VALIDATE_RESET_TOKEN);
        }
    };

    const handleValidateResetToken = async (step = STEPS.DANGER_VERIFICATION) => {
        const { username, token } = state;
        const { Addresses = [] } = await api<{ Addresses: Address[] }>(validateResetToken(username, token));
        addressesRef.current = Addresses;
        gotoStep(step);
    };

    const handleDanger = () => {
        const { danger } = state;
        if (danger !== dangerWord) {
            return;
        }
        gotoStep(STEPS.NEW_PASSWORD);
    };

    const handleNewPassword = async () => {
        const { username, token, password, confirmPassword } = state;
        if (!password.length || password !== confirmPassword) {
            return;
        }
        const addresses = addressesRef.current;
        if (!addresses) {
            throw new Error('Missing addresses');
        }
        createNotification({
            text: c('Info').t`This can take a few seconds or a few minutes depending on your device.`,
            type: 'info',
        });
        const { passphrase, salt } = await generateKeySaltAndPassphrase(password);

        const { addressKeysPayload, userKeyPayload } = hasAddressKeyMigration
            ? await getResetAddressesKeysV2({ addresses, passphrase })
            : await getResetAddressesKeys({ addresses, passphrase });

        await srpVerify({
            api,
            credentials: { password },
            config: resetKeysRoute({
                Username: username,
                Token: token,
                KeySalt: salt,
                PrimaryKey: userKeyPayload,
                AddressKeys: addressKeysPayload,
            }),
        });

        const authResponse = await srpAuth<AuthResponse>({
            api,
            credentials: { username, password },
            config: auth({ Username: username }),
        });
        const User = await api<{ User: tsUser }>(
            withAuthHeaders(authResponse.UID, authResponse.AccessToken, getUser())
        ).then(({ User }) => User);
        await persistSession({ ...authResponse, User, keyPassword: passphrase, api });
        await onLogin({ ...authResponse, User, keyPassword: passphrase });
    };

    const getSetter = <T>(key: keyof State) => (value: T) =>
        loading ? undefined : setState({ ...state, [key]: value });

    const setUsername = getSetter<string>('username');
    const setEmail = getSetter<string>('email');
    const setPhone = getSetter<string>('phone');
    const setPassword = getSetter<string>('password');
    const setConfirmPassword = getSetter<string>('confirmPassword');
    const setToken = getSetter<string>('token');
    const setDanger = getSetter<string>('danger');

    return {
        loading,
        state,
        dangerWord,
        gotoStep,
        setUsername,
        setEmail,
        setPhone,
        setPassword,
        setConfirmPassword,
        setToken,
        setDanger,
        handleRequestRecoveryMethods: () => {
            if (loading) {
                return;
            }
            withLoading(handleRequestRecoveryMethods());
        },
        handleRequest: () => {
            if (loading) {
                return;
            }
            withLoading(handleRequest());
        },
        handleValidateResetToken: (step?: STEPS) => {
            if (loading) {
                return;
            }
            withLoading(handleValidateResetToken(step));
        },
        handleDanger: () => {
            handleDanger();
        },
        handleNewPassword: () => {
            if (loading) {
                return;
            }
            withLoading(
                handleNewPassword().catch((e) => {
                    gotoStep(STEPS.ERROR);
                    throw e;
                })
            );
        },
    };
};

export default useResetPassword;
