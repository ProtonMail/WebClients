import { useState } from 'react';

import { c } from 'ttag';

import { PASSWORD_WRONG_ERROR } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { queryUnlock } from '@proton/shared/lib/api/user';
import { srpAuth } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

import {
    Button,
    Form,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    PasswordInputTwo,
} from '../../components';
import { useApi } from '../../hooks';

interface Props extends Omit<ModalProps<typeof Form>, 'as' | 'onSubmit' | 'size' | 'onSuccess'> {
    onSuccess?: (password: string) => Promise<void> | void;
    onClose?: () => void;
}

const UnlockModal = ({ onClose, onSuccess, ...rest }: Props) => {
    const api = useApi();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            await srpAuth({
                api,
                credentials: { password },
                config: queryUnlock(),
            });
            await onSuccess?.(password);
            onClose?.();
        } catch (error: any) {
            setLoading(false);
            const { code } = getApiError(error);
            if (code !== PASSWORD_WRONG_ERROR) {
                onClose?.();
            }
        }
    };

    // Don't allow to close this modal if it's loading as it could leave other consumers in an undefined state
    const handleClose = loading ? noop : onClose;

    return (
        <Modal {...rest} size="small" as={Form} onSubmit={() => handleSubmit()} onClose={handleClose}>
            <ModalHeader title={c('Title').t`Sign in again to continue`} />
            <ModalContent>
                <InputFieldTwo
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
                    {c('Action').t`Submit`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default UnlockModal;
