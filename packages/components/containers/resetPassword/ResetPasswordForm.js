import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { useApi, useLoading, useNotifications } from 'react-components';
import { requestLoginResetToken, validateResetToken } from 'proton-shared/lib/api/reset';
import { generateKeySaltAndPassphrase } from 'proton-shared/lib/keys/keys';
import { getResetAddressesKeys } from 'proton-shared/lib/keys/resetKeys';
import { srpAuth, srpVerify } from 'proton-shared/lib/srp';
import { resetKeysRoute } from 'proton-shared/lib/api/keys';

import RequestResetTokenForm from './RequestResetTokenForm';
import ValidateResetTokenForm from './ValidateResetTokenForm';
import DangerVerificationForm from './DangerVerificationForm';
import NewPasswordForm from './NewPasswordForm';
import { auth, setCookies } from 'proton-shared/lib/api/auth';
import { getRandomString } from 'proton-shared/lib/helpers/string';

const REQUEST_RESET_TOKEN_STEP = 0;
const VALIDATE_RESET_TOKEN_STEP = 1;
const DANGER_VERIFICATION_STEP = 2;
const NEW_PASSWORD_STEP = 3;

const ResetPasswordForm = ({ onLogin }) => {
    const api = useApi();
    const [step, setStep] = useState(REQUEST_RESET_TOKEN_STEP);
    const { createNotification } = useNotifications();
    const [username, setUsername] = useState('');
    const [token, setToken] = useState('');
    const [loading, withLoading] = useLoading();
    const addressesRef = useRef([]);

    if (step === REQUEST_RESET_TOKEN_STEP) {
        const handleRequest = async (email) => {
            await api(requestLoginResetToken({ Username: username, NotificationEmail: email }));
            setStep(VALIDATE_RESET_TOKEN_STEP);
        };

        return (
            <RequestResetTokenForm
                username={username}
                setUsername={setUsername}
                onSubmit={(data) => {
                    withLoading(handleRequest(data));
                }}
                loading={loading}
            />
        );
    }

    if (step === VALIDATE_RESET_TOKEN_STEP) {
        const handleValidateResetToken = async () => {
            const { Addresses = [] } = await api(validateResetToken(username, token));
            addressesRef.current = Addresses;
            setStep(DANGER_VERIFICATION_STEP);
        };

        return (
            <ValidateResetTokenForm
                token={token}
                setToken={setToken}
                onSubmit={() => withLoading(handleValidateResetToken())}
                loading={loading}
            />
        );
    }

    if (step === DANGER_VERIFICATION_STEP) {
        return <DangerVerificationForm onSubmit={() => setStep(NEW_PASSWORD_STEP)} />;
    }

    if (step === NEW_PASSWORD_STEP) {
        const handleNewPassword = async (newPassword) => {
            createNotification({
                text: c('Info').t`This can take a few seconds or a few minutes depending on your device.`,
                type: 'info'
            });
            const { passphrase, salt } = await generateKeySaltAndPassphrase(newPassword);
            const newAddressesKeys = await getResetAddressesKeys({ addresses: addressesRef.current, passphrase });
            // Assume the primary address is the first item in the list.
            const [primaryAddress] = newAddressesKeys;

            await srpVerify({
                api,
                credentials: { password: newPassword },
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
                credentials: { username, password: newPassword },
                config: auth({ Username: username })
            });
            await api(setCookies({ UID, AccessToken, RefreshToken, State: getRandomString(24) }));

            onLogin({ UID, keyPassword: passphrase, EventID });
        };

        return (
            <NewPasswordForm
                onSubmit={(data) => {
                    withLoading(
                        handleNewPassword(data).catch(() => {
                            setStep(REQUEST_RESET_TOKEN_STEP);
                        })
                    );
                }}
                loading={loading}
            />
        );
    }
};

ResetPasswordForm.propTypes = {
    onLogin: PropTypes.func.isRequired
};

export default ResetPasswordForm;
