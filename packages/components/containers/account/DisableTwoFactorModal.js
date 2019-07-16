import React, { useState } from 'react';
import { c } from 'ttag';
import {
    Alert,
    FormModal,
    PasswordTotpInputs,
    useLoading,
    useApi,
    useEventManager,
    useNotifications
} from 'react-components';
import { disableTotp } from 'proton-shared/lib/api/settings';
import { srpAuth } from 'proton-shared/lib/srp';
import { PASSWORD_WRONG_ERROR } from 'proton-shared/lib/api/auth';

const STEPS = {
    CONFIRM: 1,
    PASSWORD: 2
};

const DisableTwoFactorModal = (props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [step, setStep] = useState(STEPS.CONFIRM);
    const [password, setPassword] = useState('');
    const [totp, setTotp] = useState('');
    const [error, setError] = useState('');
    const [loading, withLoading] = useLoading();

    const { section, ...modalProps } = (() => {
        if (step === STEPS.CONFIRM) {
            return {
                section: <Alert>{c('Message').t`Are you sure you want to disable two-factor authentication?`}</Alert>,
                onSubmit() {
                    setStep(STEPS.PASSWORD);
                },
                submit: c('Action').t`Yes`
            };
        }

        if (step === STEPS.PASSWORD) {
            const handleSubmit = async () => {
                try {
                    await srpAuth({
                        api,
                        credentials: { password, totp },
                        config: disableTotp()
                    });
                    await call();
                    createNotification({ text: c('Info').t`Two-factor authentication disabled` });
                    props.onClose();
                } catch (error) {
                    const { data: { Code, Error } = {} } = error;
                    if (Code === PASSWORD_WRONG_ERROR) {
                        setError(Error);
                    }
                }
            };

            return {
                section: (
                    <PasswordTotpInputs
                        password={password}
                        setPassword={setPassword}
                        passwordError={error}
                        totp={totp}
                        setTotp={setTotp}
                        totpError={error}
                        showTotp={true}
                    />
                ),
                onSubmit() {
                    withLoading(handleSubmit());
                },
                submit: c('Action').t`Submit`
            };
        }
    })();

    return (
        <FormModal title={c('Title').t`Disable two-factor authentication`} loading={loading} {...modalProps} {...props}>
            {section}
        </FormModal>
    );
};

export default DisableTwoFactorModal;
