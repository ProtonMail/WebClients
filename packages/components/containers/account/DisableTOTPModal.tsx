import { useState } from 'react';
import { c } from 'ttag';
import { disableTotp } from '@proton/shared/lib/api/settings';
import { srpAuth } from '@proton/shared/lib/srp';
import { PASSWORD_WRONG_ERROR } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { Alert, FormModal, Loader } from '../../components';
import { useLoading, useApi, useEventManager, useNotifications } from '../../hooks';

import PasswordTotpInputs from '../password/PasswordTotpInputs';
import useAskAuth from '../password/useAskAuth';

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
    // Special case for admins signed into public users, TOTP is requested if it's enabled on the admin
    const [hasTOTPEnabled, isLoadingAuth] = useAskAuth();

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
            return {
                section: isLoadingAuth ? (
                    <Loader />
                ) : (
                    <PasswordTotpInputs
                        password={password}
                        setPassword={setPassword}
                        passwordError={error}
                        totp={totp}
                        setTotp={setTotp}
                        totpError={error}
                        showTotp={hasTOTPEnabled}
                    />
                ),
                onSubmit() {
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
