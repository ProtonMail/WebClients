import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import Form from '@proton/components/components/form/Form';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { PASSWORD_WRONG_ERROR } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import PasswordReminderInput from './PasswordReminderInput';
import { dismissPasswordReminder, submitPasswordReminder } from './index';
import lock from './lock.svg';
import type { PasswordReminderSource } from './passwordReminderTelemetry';
import { usePasswordReminderTelemetry } from './passwordReminderTelemetry';

interface PasswordReminderModalProps extends ModalProps<'form'> {
    source: PasswordReminderSource;
    disableDismiss?: boolean;
}

const PasswordReminderModal = ({ onClose, source, disableDismiss, ...rest }: PasswordReminderModalProps) => {
    const { createNotification } = useNotifications();
    const handleError = useErrorHandler();
    const dispatch = useDispatch();
    const { sendOpen, sendSuccess, sendWrongPassword, sendApiError, sendClose, sendDismiss, sendForgotPasswordExit } =
        usePasswordReminderTelemetry();
    useEffect(() => {
        sendOpen(source);
    }, []);

    const [submitting, withSubmitting] = useLoading();
    const [dismissing, withDismissing] = useLoading();

    const [password, setPassword] = useState('');
    const { validator, onFormSubmit } = useFormErrors();
    const [user] = useUser();

    const emailOrNameToDisplay = user.Email || user.DisplayName || user.Name;

    const handleClose = () => {
        sendClose();
        onClose?.();
    };

    const handleDismiss = async () => {
        if (!disableDismiss) {
            await dispatch(dismissPasswordReminder());

            createNotification({
                text: c('Info').t`We'll remind you to verify your password again later`,
                showCloseButton: false,
            });
            sendDismiss();
        } else {
            sendClose();
        }

        onClose?.();
    };

    const handleSubmit = async () => {
        try {
            await dispatch(submitPasswordReminder({ password }));

            sendSuccess();

            createNotification({
                text: c('Info').t`Password verified`,
                showCloseButton: false,
            });

            onClose?.();
        } catch (error) {
            const { code } = getApiError(error);
            if (code === PASSWORD_WRONG_ERROR) {
                sendWrongPassword();
            } else {
                sendApiError();
            }
            handleError(error);
        }
    };

    const handleForgotPasswordClick = () => {
        sendForgotPasswordExit();
        onClose?.();
    };

    const loading = submitting || dismissing;

    return (
        <Modal
            size="small"
            as={Form}
            onSubmit={(event) => {
                if (!onFormSubmit(event.currentTarget) || loading) {
                    return;
                }
                void withSubmitting(handleSubmit());
            }}
            onClose={handleClose}
            {...rest}
        >
            <ModalHeader
                title={c('Title').t`Verify your password`}
                subline={emailOrNameToDisplay}
                leadingContent={<img src={lock} width={64} height={64} alt="" className="hidden md:block mb-2" />}
                closeButtonProps={{ pill: true, className: 'absolute right-0 top-0 mt-2 mr-2' }}
                className="flex flex-column items-center px-3 md:pb-4 md:pt-6 text-center"
            />
            <ModalContent>
                <p className="m-0 mb-4">
                    {c('Info')
                        .t`To help you remember your password, we'll ask you to enter it periodically. We ask you less over time.`}
                </p>
                <InputFieldTwo
                    autoFocus
                    id="password-reminder"
                    as={PasswordReminderInput}
                    value={password}
                    disableChange={loading}
                    onValue={setPassword}
                    error={validator([requiredValidator(password)])}
                    label={c('Label').t`Password`}
                    bigger
                />
                <ButtonLike
                    shape="underline"
                    color="norm"
                    as={SettingsLink}
                    path="/account-password?action=forgot-password"
                    onClick={handleForgotPasswordClick}
                >
                    {c('Info').t`Forgot password?`}
                </ButtonLike>
            </ModalContent>
            <ModalFooter>
                <Button
                    fullWidth
                    loading={dismissing}
                    onClick={() => withDismissing(handleDismiss().catch(handleError))}
                >{c('Action').t`Later`}</Button>
                <Button fullWidth color="norm" type="submit" loading={submitting}>
                    {c('Action').t`Verify`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default PasswordReminderModal;
