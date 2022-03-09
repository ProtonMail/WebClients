import { useState } from 'react';
import { c } from 'ttag';
import { PASSWORD_WRONG_ERROR } from '@proton/shared/lib/api/auth';
import { srpAuth, SrpConfig } from '@proton/shared/lib/srp';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { noop } from '@proton/shared/lib/helpers/function';

import { useApi } from '../../hooks';

import {
    Button,
    Form,
    Loader,
    ModalProps,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
} from '../../components';
import PasswordTotpInputs from './PasswordTotpInputs';
import useAskAuth from './useAskAuth';

interface Props<T> extends Omit<ModalProps<typeof Form>, 'as' | 'onSubmit' | 'size' | 'onSuccess' | 'onError'> {
    config: SrpConfig;
    onSuccess: (data: { password: string; totp: string; result: T }) => void;
    onError?: (error: Error) => void;
}

const AuthModal = <T,>({ config, onSuccess, onError, onClose, ...rest }: Props<T>) => {
    const api = useApi();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [password, setPassword] = useState('');
    const [totp, setTotp] = useState('');
    const [hasTOTPEnabled, isLoadingAuth] = useAskAuth();

    const handleSubmit = async ({ password, totp }: { password: string; totp: string }) => {
        try {
            setSubmitting(true);

            const result = await srpAuth<T>({
                api,
                credentials: { password, totp },
                config,
            });

            onSuccess({ password, totp, result });
            onClose?.();
        } catch (error: any) {
            setSubmitting(false);
            const { code, message } = getApiErrorMessage(error);
            if (code === PASSWORD_WRONG_ERROR) {
                setError(message);
            }
            onError?.(error);
        }
    };

    const loading = submitting || isLoadingAuth;

    // Don't allow to close this modal if it's loading as it could leave other consumers in an undefined state
    const handleClose = loading ? noop : onClose;

    return (
        <Modal {...rest} size="small" as={Form} onSubmit={() => handleSubmit({ password, totp })} onClose={handleClose}>
            <ModalHeader title={c('Title').t`Sign in again to continue`} />
            <ModalContent>
                {isLoadingAuth ? (
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
                )}
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={loading}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" disabled={isLoadingAuth} loading={submitting}>
                    {c('Action').t`Submit`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default AuthModal;
