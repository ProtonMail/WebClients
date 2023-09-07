import { ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import useLoading from '@proton/hooks/useLoading';
import { initiateSessionRecovery } from '@proton/shared/lib/api/sessionRecovery';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import getUsername from '@proton/shared/lib/helpers/getUsername';
import noop from '@proton/utils/noop';

import {
    Form,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    ModalSize,
    SettingsLink,
    useFormErrors,
} from '../../../components';
import {
    useAddresses,
    useApi,
    useErrorHandler,
    useEventManager,
    useHasRecoveryMethod,
    useNotifications,
    useUser,
} from '../../../hooks';
import SessionRecoveryResetConfirmedPrompt from './SessionRecoveryResetConfirmedPrompt';
import sessionRecoveryIllustration from './session-recovery-illustration.svg';

enum STEP {
    PROMPT,
    USERNAME,
    RESET_CONFIRMED,
}

interface Props extends ModalProps {
    confirmedStep?: boolean;
}

const InitiateSessionRecoveryModal = ({ confirmedStep = false, onClose, ...rest }: Props) => {
    const [user] = useUser();
    const [addresses, loadingAddresses] = useAddresses();
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const errorHandler = useErrorHandler();
    const [hasRecoveryMethod] = useHasRecoveryMethod();

    const [step, setStep] = useState<STEP>(STEP.PROMPT);

    const [submitting, withSubmitting] = useLoading();
    const [usernameValue, setUsernameValue] = useState('');

    const { validator, onFormSubmit } = useFormErrors();

    if (step === STEP.RESET_CONFIRMED) {
        return <SessionRecoveryResetConfirmedPrompt open={rest.open} onClose={onClose} />;
    }

    const handleSubmit = () => {
        if (submitting || !onFormSubmit()) {
            return;
        }
        const run = async () => {
            try {
                await api(initiateSessionRecovery());
                await call();
                createNotification({
                    text: c('Title').t`Password reset confirmed`,
                    showCloseButton: false,
                });

                if (confirmedStep) {
                    setStep(STEP.RESET_CONFIRMED);
                } else {
                    onClose?.();
                }
            } catch (error) {
                errorHandler(error);
            }
        };

        void withSubmitting(run());
    };

    const {
        title,
        subline,
        content,
        buttons,
        isForm = false,
        size,
    } = ((): {
        title: string;
        subline?: string;
        content: ReactNode;
        buttons: ReactNode;
        isForm?: boolean;
        size?: ModalSize;
    } => {
        if (step === STEP.PROMPT) {
            const boldHours = (
                <b key="session-recovery-hours">{
                    // translator: Full sentence "For security reasons, you’ll have to wait 72 hours before you can change your password."
                    c('Info').t`72 hours`
                }</b>
            );

            const boldRecoveryMethod = (
                <b key="bold-recovery-method">
                    {
                        // translator: Full sentence "If you have a recovery method set up, try account recovery instead. This will allow you to change your password straight away."
                        c('Info').t`recovery method`
                    }
                </b>
            );

            return {
                title: c('Title').t`Request password reset?`,
                subline: user.Email,
                content: (
                    <>
                        <div className="flex flex-justify-center">
                            <img
                                src={sessionRecoveryIllustration}
                                alt={c('Session recovery').t`Reset your password in 72 hours`}
                            />
                        </div>

                        <p>
                            {
                                // translator: Full sentence "For security reasons, you’ll have to wait 72 hours before you can change your password."
                                c('Info')
                                    .jt`For security reasons, you’ll have to wait ${boldHours} before you can change your password.`
                            }
                        </p>
                        {hasRecoveryMethod && (
                            <p>
                                {
                                    // translator: Full sentence "If you have a recovery method set up, try account recovery instead. This will allow you to change your password straight away."
                                    c('Info')
                                        .jt`If you have a ${boldRecoveryMethod} set up, try account recovery instead. This will allow you to change your password straight away.`
                                }
                            </p>
                        )}
                    </>
                ),
                buttons: (
                    <>
                        {hasRecoveryMethod ? (
                            <ButtonLike as={SettingsLink} path={`/recovery`} onClick={onClose}>
                                {c('Action').t`Use recovery method`}
                            </ButtonLike>
                        ) : (
                            <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                        )}
                        <Button onClick={() => setStep(STEP.USERNAME)} color="danger">
                            {c('Action').t`Request password reset`}
                        </Button>
                    </>
                ),
            };
        }

        if (step === STEP.USERNAME) {
            const emailOrUsernameValidator = () => {
                const username = getUsername(user, addresses);

                if (usernameValue === username || usernameValue === user.Name || usernameValue === user.Email) {
                    return '';
                }

                return c('Error').t`Incorrect email or username`;
            };

            return {
                title: c('Title').t`Enter username`,
                content: (
                    <>
                        <InputFieldTwo
                            id="username"
                            label={c('Input Label').t`Email or username`}
                            error={validator([requiredValidator(usernameValue), emailOrUsernameValidator()])}
                            disableChange={submitting}
                            autoFocus
                            autoComplete="username"
                            value={usernameValue}
                            onValue={setUsernameValue}
                        />
                    </>
                ),
                buttons: (
                    <>
                        <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                        <Button type="submit" color="norm" loading={submitting} disabled={loadingAddresses}>
                            {c('Action').t`Continue`}
                        </Button>
                    </>
                ),
                isForm: true,
                size: 'small',
            };
        }

        throw new Error('Unknown step');
    })();

    const handleClose = submitting ? noop : onClose;

    return (
        <Modal
            as={isForm ? Form : undefined}
            onSubmit={isForm ? handleSubmit : undefined}
            onClose={handleClose}
            size={size}
            {...rest}
        >
            <ModalHeader title={title} subline={subline} />
            <ModalContent>{content}</ModalContent>
            <ModalFooter>{buttons}</ModalFooter>
        </Modal>
    );
};

export default InitiateSessionRecoveryModal;
