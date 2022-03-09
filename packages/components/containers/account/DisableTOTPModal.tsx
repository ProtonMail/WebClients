import { ReactNode, useState } from 'react';
import { c } from 'ttag';
import { disableTotp } from '@proton/shared/lib/api/settings';
import { srpAuth } from '@proton/shared/lib/srp';
import { PASSWORD_WRONG_ERROR } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { noop } from '@proton/shared/lib/helpers/function';

import {
    Alert,
    Loader,
    ModalProps,
    ModalTwo as Modal,
    ModalTwoHeader as ModalHeader,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    Form,
    Button,
} from '../../components';
import { useLoading, useApi, useEventManager, useNotifications } from '../../hooks';

import PasswordTotpInputs from '../password/PasswordTotpInputs';
import useAskAuth from '../password/useAskAuth';

interface ModalProperties {
    section: ReactNode;
    submitButtonText: string;
    onSubmit: () => void;
}

const STEPS = {
    CONFIRM: 1,
    PASSWORD: 2,
};

const DisableTOTPModal = ({ onClose, ...rest }: ModalProps) => {
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

    const { section, submitButtonText, onSubmit } = ((): ModalProperties => {
        if (step === STEPS.CONFIRM) {
            return {
                section: (
                    <Alert className="mb1">{c('Message')
                        .t`Are you sure you want to disable two-factor authentication?`}</Alert>
                ),
                submitButtonText: c('Action').t`Yes`,
                onSubmit() {
                    setStep(STEPS.PASSWORD);
                },
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
                submitButtonText: c('Action').t`Submit`,
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
                            onClose?.();
                        } catch (error: any) {
                            const { code, message } = getApiError(error);
                            if (code === PASSWORD_WRONG_ERROR) {
                                setError(message);
                            }
                        }
                    };
                    void withLoading(handleSubmit());
                },
            };
        }

        throw new Error('Invalid step');
    })();

    const handleClose = loading ? noop : onClose;

    return (
        <Modal as={Form} onSubmit={onSubmit} onClose={handleClose} size="large" {...rest}>
            <ModalHeader title={c('Title').t`Disable two-factor authentication`} />
            <ModalContent>{section}</ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button loading={loading} type="submit" color="norm">
                    {submitButtonText || c('Action').t`Next`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default DisableTOTPModal;
