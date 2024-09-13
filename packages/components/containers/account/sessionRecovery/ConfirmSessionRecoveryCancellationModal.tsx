import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import useLoading from '@proton/hooks/useLoading';
import metrics, { observeApiError } from '@proton/metrics';
import { abortSessionRecovery } from '@proton/shared/lib/api/sessionRecovery';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { srpAuth } from '@proton/shared/lib/srp';
import noop from '@proton/utils/noop';

import type { ModalProps } from '../../../components';
import {
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
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
