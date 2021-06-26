import React, { useState } from 'react';
import { c } from 'ttag';
import { disableTotp } from '@proton/shared/lib/api/settings';
import { srpAuth } from '@proton/shared/lib/srp';
import { PASSWORD_WRONG_ERROR } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { Alert, FormModal } from '../../components';
import { useLoading, useApi, useEventManager, useNotifications } from '../../hooks';

import PasswordTotpInputs from '../password/PasswordTotpInputs';

const STEPS = {
    CONFIRM: 1,
    PASSWORD: 2,
};

const DisableTOTPModal = (props: any) => {
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
                submit: c('Action').t`Yes`,
            };
        }

        if (step === STEPS.PASSWORD) {
            const handleSubmit = async () => {
                try {
                    await srpAuth({
                        api,
                        credentials: { password, totp },
                        config: disableTotp(),
                    });
                    await call();
                    createNotification({ text: c('Info').t`Two-factor authentication disabled` });
                    props.onClose();
                } catch (error) {
                    const { code, message } = getApiError(error);
                    if (code === PASSWORD_WRONG_ERROR) {
                        setError(message);
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
                        showTotp
                    />
                ),
                onSubmit() {
                    withLoading(handleSubmit());
                },
                submit: c('Action').t`Submit`,
            };
        }

        throw new Error('Invalid step');
    })();

    return (
        <FormModal title={c('Title').t`Disable two-factor authentication`} loading={loading} {...modalProps} {...props}>
            {section}
        </FormModal>
    );
};

export default DisableTOTPModal;
