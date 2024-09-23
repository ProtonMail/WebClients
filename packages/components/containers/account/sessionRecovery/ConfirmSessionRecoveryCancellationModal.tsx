import { useEffect, useState } from 'react';

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
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useLoading from '@proton/hooks/useLoading';
import metrics, { observeApiError } from '@proton/metrics';
import { abortSessionRecovery } from '@proton/shared/lib/api/sessionRecovery';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { srpAuth } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

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

    useEffect(() => {
        metrics.core_session_recovery_cancellation_modal_load_total.increment({ step: 'confirm' });
    }, []);

    const handleSubmit = () => {
        if (submitting || !onFormSubmit()) {
            return;
        }

        const run = async () => {
            try {
                await srpAuth({
                    api,
                    credentials: {
                        password,
                    },
                    config: abortSessionRecovery(),
                });

                await call();
                dismissSessionRecoveryCancelled();
                createNotification({
                    text: c('session_recovery:cancellation:notification').t`Password reset canceled`,
                    showCloseButton: false,
                });

                metrics.core_session_recovery_abort_total.increment({
                    status: 'success',
                });

                onClose?.();
            } catch (error) {
                observeApiError(error, (status) =>
                    metrics.core_session_recovery_abort_total.increment({
                        status,
                    })
                );
            }
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
            <ModalHeader
                title={c('session_recovery:cancellation:title').t`Cancel password reset?`}
                subline={user.Email}
                hasClose={!onBack}
            />

            <ModalContent>
                <p>{c('session_recovery:cancellation:info')
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
                    autoFocus
                />
            </ModalContent>
            <ModalFooter>
                {onBack ? (
                    <Button onClick={onBack} disabled={submitting}>{c('Action').t`Back`}</Button>
                ) : (
                    <Button onClick={onClose} disabled={submitting}>{c('Action').t`Close`}</Button>
                )}
                <Button color="danger" type="submit" loading={submitting}>
                    {c('session_recovery:cancellation:action').t`Cancel password reset`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default ConfirmSessionRecoveryCancellationModal;
