import { useState } from 'react';
import { c } from 'ttag';
import { disableMnemonicPhrase } from '@proton/shared/lib/api/settingsMnemonic';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { PASSWORD_WRONG_ERROR } from '@proton/shared/lib/api/auth';
import { noop } from '@proton/shared/lib/helpers/function';
import { srpAuth } from '@proton/shared/lib/srp';

import { Button, FormModal, Loader } from '../../components';
import { useApi, useNotifications } from '../../hooks';
import { PasswordTotpInputs, useAskAuth } from '../password';

enum STEPS {
    CONFIRM,
    AUTH,
}

interface Props {
    onClose?: () => void;
    onSuccess: (data?: any) => void;
}

const DisableMnemonicModal = (props: Props) => {
    const { onClose, onSuccess, ...rest } = props;
    const [step, setStep] = useState(STEPS.CONFIRM);

    const { createNotification } = useNotifications();

    const api = useApi();
    const [submittingAuth, setSubmittingAuth] = useState(false);
    const [authError, setAuthError] = useState('');

    const [password, setPassword] = useState('');
    const [totp, setTotp] = useState('');
    const [hasTOTPEnabled, isLoadingAuth] = useAskAuth();

    const { section, ...modalProps } = (() => {
        if (step === STEPS.CONFIRM) {
            return {
                title: c('Action').t`Disable recovery phrase?`,
                tiny: true,
                hasClose: false,
                section: (
                    <>
                        <p className="mt0">{c('Info')
                            .t`If you proceed, you will have to reset your password and will be logged out of any other active sessions.`}</p>
                        <p className="mb0">{c('Info').t`This will also disable two-factor authentification.`}</p>
                    </>
                ),
                footer: (
                    <div className="w100">
                        <Button fullWidth color="danger" onClick={() => setStep(STEPS.AUTH)}>
                            {c('Action').t`Disable recovery phrase`}
                        </Button>
                        <Button className="mt1" fullWidth onClick={onClose}>
                            {c('Action').t`Cancel`}
                        </Button>
                    </div>
                ),
            };
        }

        if (step === STEPS.AUTH) {
            const handleSubmit = async () => {
                try {
                    setSubmittingAuth(true);

                    await srpAuth({
                        api,
                        credentials: { password, totp },
                        config: disableMnemonicPhrase(),
                    });

                    onSuccess();
                    onClose?.();
                    createNotification({ text: c('Info').t`Recovery phrase has been disabled` });
                } catch (error) {
                    const { code, message } = getApiErrorMessage(error);
                    setSubmittingAuth(false);
                    if (code === PASSWORD_WRONG_ERROR) {
                        setAuthError(message);
                    } else {
                        onClose?.();
                    }
                }
            };

            return {
                title: c('Action').t`Enter password to continue`,
                cancel: c('Action').t`Cancel`,
                submit: c('Action').t`Continue`,
                hasClose: !submittingAuth,
                onClose: submittingAuth ? noop : onClose,
                error: authError,
                loading: submittingAuth || isLoadingAuth,
                onSubmit: handleSubmit,
                section: isLoadingAuth ? (
                    <Loader />
                ) : (
                    <PasswordTotpInputs
                        password={password}
                        setPassword={setPassword}
                        passwordError={authError}
                        totp={totp}
                        setTotp={setTotp}
                        totpError={authError}
                        showTotp={hasTOTPEnabled}
                    />
                ),
            };
        }

        throw new Error('Unknown step');
    })();

    return (
        <FormModal small noTitleEllipsis onClose={onClose} {...rest} {...modalProps}>
            {section}
        </FormModal>
    );
};

export default DisableMnemonicModal;
