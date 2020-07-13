import { useRef, useState } from 'react';
import { c } from 'ttag';
import { requestLoginResetToken, validateResetToken } from 'proton-shared/lib/api/reset';
import { generateKeySaltAndPassphrase } from 'proton-shared/lib/keys/keys';
import { getResetAddressesKeys } from 'proton-shared/lib/keys/resetKeys';
import { srpAuth, srpVerify } from 'proton-shared/lib/srp';
import { resetKeysRoute } from 'proton-shared/lib/api/keys';
import { Address } from 'proton-shared/lib/interfaces';
import { setCookies, auth } from 'proton-shared/lib/api/auth';
import { getRandomString } from 'proton-shared/lib/helpers/string';
import { useApi, useLoading, useNotifications, OnLoginArgs } from '../../index';

export enum STEPS {
    REQUEST_RESET_TOKEN,
    VALIDATE_RESET_TOKEN,
    DANGER_VERIFICATION,
    NEW_PASSWORD,
    ERROR
}

interface Props {
    onLogin: (args: OnLoginArgs) => void;
}

export interface State {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    token: string;
    danger: string;
    step: STEPS;
}

const INITIAL_STATE = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    token: '',
    danger: '',
    step: STEPS.REQUEST_RESET_TOKEN
};

const useResetPassword = ({ onLogin }: Props) => {
    const api = useApi();
    const [state, setState] = useState<State>(INITIAL_STATE);
    const [loading, withLoading] = useLoading();

    const { createNotification } = useNotifications();
    const addressesRef = useRef<Address[]>([]);
    const dangerWord = 'DANGER';

    const gotoStep = (step: STEPS) => {
        return setState((state: State) => ({ ...state, step }));
    };

    const handleRequest = async () => {
        const { username, email } = state;
        await api(requestLoginResetToken({ Username: username, NotificationEmail: email }));
        gotoStep(STEPS.VALIDATE_RESET_TOKEN);
    };

    const handleValidateResetToken = async () => {
        const { username, token } = state;
        const { Addresses = [] } = await api<{ Addresses: Address[] }>(validateResetToken(username, token));
        addressesRef.current = Addresses;
        gotoStep(STEPS.DANGER_VERIFICATION);
    };

    const handleDanger = async () => {
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
            type: 'info'
        });
        const { passphrase, salt } = await generateKeySaltAndPassphrase(password);
        const newAddressesKeys = await getResetAddressesKeys({ addresses, passphrase });
        // Assume the primary address is the first item in the list.
        const [primaryAddress] = newAddressesKeys;

        await srpVerify({
            api,
            credentials: { password },
            config: resetKeysRoute({
                Username: username,
                Token: token,
                KeySalt: salt,
                PrimaryKey: primaryAddress ? primaryAddress.PrivateKey : undefined,
                AddressKeys: newAddressesKeys
            })
        });

        const { UID, EventID, AccessToken, RefreshToken } = await srpAuth({
            api,
            credentials: { username, password },
            config: auth({ Username: username })
        });
        await api(setCookies({ UID, AccessToken, RefreshToken, State: getRandomString(24) }));

        onLogin({ UID, keyPassword: passphrase, EventID });
    };

    const getSetter = <T>(key: keyof State) => (value: T) =>
        loading ? undefined : setState({ ...state, [key]: value });

    const setUsername = getSetter<string>('username');
    const setEmail = getSetter<string>('email');
    const setPassword = getSetter<string>('password');
    const setConfirmPassword = getSetter<string>('confirmPassword');
    const setToken = getSetter<string>('token');
    const setDanger = getSetter<string>('danger');

    return {
        loading,
        state,
        dangerWord,
        setUsername,
        setEmail,
        setPassword,
        setConfirmPassword,
        setToken,
        setDanger,
        handleRequest: () => {
            if (loading) {
                return;
            }
            withLoading(handleRequest());
        },
        handleValidateResetToken: () => {
            if (loading) {
                return;
            }
            withLoading(handleValidateResetToken());
        },
        handleDanger: () => {
            if (loading) {
                return;
            }
            withLoading(handleDanger());
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
        }
    };
};

export default useResetPassword;
