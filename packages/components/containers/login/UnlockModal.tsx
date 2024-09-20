import { useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import PasswordInputTwo from '@proton/components/components/v2/input/PasswordInput';
import { PASSWORD_WRONG_ERROR } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { queryUnlock } from '@proton/shared/lib/api/user';
import { srpAuth } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

import { useApi, useErrorHandler } from '../../hooks';

interface Props extends Omit<ModalProps<typeof Form>, 'as' | 'onSubmit' | 'size' | 'onSuccess'> {
    onSuccess?: (password: string) => Promise<void> | void;
    onClose?: () => void;
    onCancel?: () => void;
}

const UnlockModal = ({ onClose, onSuccess, onCancel, ...rest }: Props) => {
    const api = useApi();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const passwordRef = useRef<HTMLInputElement>(null);
    const errorHandler = useErrorHandler();

    const cancelClose = () => {
        onCancel?.();
        onClose?.();
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            await srpAuth({
                api,
                credentials: { password },
                config: { ...queryUnlock(), silence: true },
            });
            // We want to just keep the modal open until the consumer's promise is finished. Not interested in errors.
            await onSuccess?.(password)?.catch(noop);
            onClose?.();
        } catch (error: any) {
            errorHandler(error);
            setLoading(false);
            const { code } = getApiError(error);
            if (code !== PASSWORD_WRONG_ERROR) {
                cancelClose();
                return;
            }
            setPassword('');
            passwordRef.current?.focus();
        }
    };

    // Don't allow to close this modal if it's loading as it could leave other consumers in an undefined state
    const handleClose = loading ? noop : cancelClose;

    return (
        <Modal {...rest} size="small" as={Form} onSubmit={() => handleSubmit()} onClose={handleClose}>
            <ModalHeader title={c('Title').t`Enter your password`} />
            <ModalContent>
                <InputFieldTwo
                    ref={passwordRef}
                    required
                    autoFocus
                    autoComplete="current-password"
                    id="password"
                    as={PasswordInputTwo}
                    value={password}
                    onValue={setPassword}
                    label={c('Label').t`Password`}
                    placeholder={c('Placeholder').t`Password`}
                />
            </ModalContent>
            <ModalFooter>
                <Button onClick={handleClose} disabled={loading}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" loading={loading}>
                    {c('Action').t`Authenticate`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default UnlockModal;
