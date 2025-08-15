import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { sessionRecoveryChangePassword } from '@proton/account/password/sessionRecoveryChangePassword';
import { usePasswordPolicies } from '@proton/account/passwordPolicies/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { usePasswordPolicyValidation } from '@proton/components/components/passwordPolicy';
import PasswordWithPolicyInputs from '@proton/components/components/passwordPolicy/PasswordWithPolicyInputs';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import {
    useIsSessionRecoveryInitiatedByCurrentSession,
    useSessionRecoveryInsecureTimeRemaining,
} from '@proton/components/hooks/useSessionRecovery';
import metrics, { observeApiError } from '@proton/metrics';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import ConfirmSessionRecoveryCancellationModal from './ConfirmSessionRecoveryCancellationModal';
import passwordResetIllustration from './password-reset-illustration.svg';

enum STEP {
    INFO,
    PASSWORD,
    CONFIRM_CANCELLATION,
}

interface Props extends ModalProps {
    skipInfoStep?: boolean;
}

const PasswordResetAvailableAccountModal = ({ skipInfoStep = false, onClose, ...rest }: Props) => {
    const [user] = useUser();

    const [loading, setLoading] = useState(false);
    const formErrors = useFormErrors();
    const { onFormSubmit } = formErrors;
    const errorHandler = useErrorHandler();
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const passwordPolicyValidation = usePasswordPolicyValidation(newPassword, usePasswordPolicies());
    const passwordPolicyError = !passwordPolicyValidation.valid;

    const [step, setStep] = useState(skipInfoStep ? STEP.PASSWORD : STEP.INFO);

    const isSessionRecoveryInitiatedByCurrentSession = useIsSessionRecoveryInitiatedByCurrentSession();
    const timeRemaining = useSessionRecoveryInsecureTimeRemaining();

    useEffect(() => {
        const metricsStep = (() => {
            if (step === STEP.INFO) {
                return 'info';
            }

            if (step === STEP.PASSWORD) {
                return 'password';
            }

            if (step === STEP.CONFIRM_CANCELLATION) {
                return 'confirm_cancellation';
            }
        })();

        if (!metricsStep) {
            return;
        }

        metrics.core_session_recovery_password_reset_available_account_modal_load_total.increment({
            step: metricsStep,
        });
    }, [step]);

    if (timeRemaining === null) {
        return null;
    }

    if (step === STEP.CONFIRM_CANCELLATION) {
        return (
            <ConfirmSessionRecoveryCancellationModal
                open={rest.open}
                onClose={onClose}
                onBack={() => setStep(STEP.INFO)}
            />
        );
    }

    const infoSubline = (() => {
        if (timeRemaining.inHours === 0) {
            // translator: "Soon" in this context means within 1 hour
            return c('session_recovery:available:info').t`This permission expires soon`;
        }

        if (timeRemaining.inDays === 0) {
            // translator: Full sentence "This permission expires in N hours (1, 2, 3, etc.)"
            return c('session_recovery:available:info').ngettext(
                msgid`This permission expires in ${timeRemaining.inHours} hour`,
                `This permission expires in ${timeRemaining.inHours} hours`,
                timeRemaining.inHours
            );
        }

        // translator: Full sentence "This permission expires in N days (1, 2, 3, etc.)"
        return c('session_recovery:available:info').ngettext(
            msgid`This permission expires in ${timeRemaining.inDays} day`,
            `This permission expires in ${timeRemaining.inDays} days`,
            timeRemaining.inDays
        );
    })();

    const boldEmail = (
        <b key="bold-user-email" className="text-break">
            {user.Email}
        </b>
    );

    const boldDaysRemaining = (
        <b key="bold-days-remaining">
            {timeRemaining.inDays === 0
                ? // translator: Full sentence "You can now change your password for the account <user@email.com> freely for <N hours>.
                  c('session_recovery:available:info').ngettext(
                      msgid`${timeRemaining.inHours} hour`,
                      `${timeRemaining.inHours} hours`,
                      timeRemaining.inHours
                  )
                : // translator: Full sentence "You can now change your password for the account <user@email.com> freely for <N days>.
                  c('session_recovery:available:info').ngettext(
                      msgid`${timeRemaining.inDays} day`,
                      `${timeRemaining.inDays} days`,
                      timeRemaining.inDays
                  )}
        </b>
    );

    const youCanNowChangeYourPassword = (() => {
        if (timeRemaining.inHours === 0) {
            // translator: Full sentence "You can now change your password for the account <user@email.com>.
            return c('session_recovery:available:info')
                .jt`You can now change your password for the account ${boldEmail}.`;
        }

        // translator: Full sentence "You can now change your password for the account <user@email.com> freely for <N days/hours>.
        return c('session_recovery:available:info')
            .jt`You can now change your password for the account ${boldEmail} freely for ${boldDaysRemaining}.`;
    })();

    if (!isSessionRecoveryInitiatedByCurrentSession) {
        return (
            <Modal onClose={onClose} {...rest}>
                <ModalHeader
                    title={c('session_recovery:available:title').t`Reset your password`}
                    subline={infoSubline}
                />
                <ModalContent>
                    <>
                        <div className="flex justify-center">
                            <img src={passwordResetIllustration} alt="" />
                        </div>
                        <div>{youCanNowChangeYourPassword}</div>
                        <div>
                            {c('session_recovery:available:info')
                                .t`Please go to the signed-in device (in the session where the request was initiated) to change your password.`}
                        </div>
                    </>
                </ModalContent>
                <ModalFooter>
                    <Button onClick={() => setStep(STEP.CONFIRM_CANCELLATION)}>{c('session_recovery:available:action')
                        .t`Cancel reset`}</Button>
                    <Button color="norm" onClick={onClose}>
                        {c('Action').t`OK`}
                    </Button>
                </ModalFooter>
            </Modal>
        );
    }

    const {
        as,
        onSubmit,
        title,
        subline,
        content,
        footer,
    }: {
        as?: typeof Form;
        onSubmit?: () => void;
        title: string;
        subline?: string;
        content: ReactNode;
        footer: ReactNode;
    } = (() => {
        if (step === STEP.INFO) {
            return {
                title: c('session_recovery:available:title').t`Reset your password`,
                subline: infoSubline,
                content: (
                    <>
                        <div className="flex justify-center">
                            <img src={passwordResetIllustration} alt="" />
                        </div>
                        <div>{youCanNowChangeYourPassword}</div>
                    </>
                ),
                footer: (
                    <>
                        <Button onClick={() => setStep(STEP.CONFIRM_CANCELLATION)}>
                            {c('session_recovery:available:action').t`Cancel reset`}
                        </Button>
                        <Button color="norm" onClick={() => setStep(STEP.PASSWORD)}>
                            {c('session_recovery:available:action').t`Reset password`}
                        </Button>
                    </>
                ),
            };
        }

        if (step === STEP.PASSWORD) {
            const handleSubmit = async () => {
                if (!onFormSubmit() || passwordPolicyError) {
                    return;
                }
                setLoading(true);

                try {
                    await dispatch(sessionRecoveryChangePassword({ newPassword }));

                    createNotification({
                        text: c('session_recovery:available:notification').t`Password saved`,
                        showCloseButton: false,
                    });

                    metrics.core_session_recovery_consume_total.increment({
                        status: 'success',
                    });

                    onClose?.();
                } catch (error) {
                    errorHandler(error);
                    observeApiError(error, (status) =>
                        metrics.core_session_recovery_consume_total.increment({
                            status,
                        })
                    );
                } finally {
                    setLoading(false);
                }
            };

            return {
                as: Form,
                onSubmit: handleSubmit,
                title: c('Title').t`Change password`,
                content: (
                    <>
                        <div className="mb-4">
                            {
                                // translator: full sentence "Proton's encryption technology means that nobody can access your password - not even us."
                                c('Info')
                                    .jt`${BRAND_NAME}'s encryption technology means that nobody can access your password - not even us.`
                            }
                        </div>
                        <PasswordWithPolicyInputs
                            loading={loading}
                            passwordPolicyValidation={passwordPolicyValidation}
                            passwordState={[newPassword, setNewPassword]}
                            confirmPasswordState={[confirmPassword, setConfirmPassword]}
                            formErrors={formErrors}
                            formLabels={{
                                password: c('Label').t`New password`,
                                confirmPassword: c('Label').t`Confirm password`,
                            }}
                            isAboveModal={true}
                            autoFocus={true}
                        />
                    </>
                ),
                footer: (
                    <>
                        {skipInfoStep ? (
                            <Button disabled={loading} onClick={onClose}>
                                {c('Action').t`Close`}
                            </Button>
                        ) : (
                            <Button disabled={loading} onClick={() => setStep(STEP.INFO)}>
                                {c('Action').t`Back`}
                            </Button>
                        )}
                        <Button color="norm" loading={loading} type="submit">
                            {c('Action').t`Save`}
                        </Button>
                    </>
                ),
            };
        }

        throw new Error('Step not found');
    })();

    return (
        <Modal as={as} onSubmit={onSubmit} onClose={loading ? noop : onClose} {...rest} size="small">
            <ModalHeader title={title} subline={subline} />
            <ModalContent>{content}</ModalContent>
            <ModalFooter>{footer}</ModalFooter>
        </Modal>
    );
};

export default PasswordResetAvailableAccountModal;
