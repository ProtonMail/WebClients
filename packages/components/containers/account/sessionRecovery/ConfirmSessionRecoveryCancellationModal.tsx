import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useLoading from '@proton/hooks/useLoading';
import { abortSessionRecovery } from '@proton/shared/lib/api/sessionRecovery';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { srpAuth } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

import {
    Form,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    PasswordInputTwo,
    useFormErrors,
} from '../../../components';
import { useApi, useEventManager, useNotifications, useUser } from '../../../hooks';
import { useSessionRecoveryLocalStorage } from './SessionRecoveryLocalStorageManager';

interface Props extends ModalProps {
    onBack?: () => void;
}

const ConfirmSessionRecoveryCancellationModal = ({ onBack, onClose, ...rest }: Props) => {
    const api = useApi();
    const [user] = useUser();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { validator, onFormSubmit } = useFormErrors();
    const [password, setPassword] = useState('');
    const [submitting, withSubmitting] = useLoading();
    const { dismissSessionRecoveryCancelled } = useSessionRecoveryLocalStorage();

    const handleSubmit = () => {
        if (submitting || !onFormSubmit()) {
            return;
        }

        const run = async () => {
            await srpAuth({
                api,
                credentials: {
                    password,
                },
                config: abortSessionRecovery(),
            });

            await call();
            dismissSessionRecoveryCancelled();
            createNotification({ text: c('Info').t`Password reset cancelled`, showCloseButton: false });
            onClose?.();
        };

        void withSubmitting(run());
    };

    const handleClose = submitting ? noop : onClose;

    return (
        <Modal
            as={Form}
            onSubmit={handleSubmit}
            onClose={handleClose}
            disableCloseOnEscape={!!onBack}
            size="small"
            {...rest}
        >
            <ModalHeader title={c('Title').t`Cancel password reset?`} subline={user.Email} hasClose={!onBack} />

            <ModalContent>
                <p>{c('Info')
                    .t`Enter your current password to cancel the password reset process. No other changes will take effect.`}</p>

                <InputFieldTwo
                    id="password"
                    bigger
                    label={c('Label').t`Password`}
                    error={validator([requiredValidator(password)])}
                    as={PasswordInputTwo}
                    disableChange={submitting}
                    autoComplete="current-password"
                    value={password}
                    onValue={setPassword}
                />
            </ModalContent>
            <ModalFooter>
                {onBack ? (
                    <Button onClick={onBack} disabled={submitting}>{c('Action').t`Back`}</Button>
                ) : (
                    <Button onClick={onClose} disabled={submitting}>{c('Action').t`Close`}</Button>
                )}
                <Button color="danger" type="submit" loading={submitting}>
                    {c('Action').t`Cancel password reset`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ConfirmSessionRecoveryCancellationModal;
