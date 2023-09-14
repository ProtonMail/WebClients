import { useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import useLoading from '@proton/hooks/useLoading';
import { initiateSessionRecovery } from '@proton/shared/lib/api/sessionRecovery';
import noop from '@proton/utils/noop';

import {
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    SettingsLink,
} from '../../../components';
import { useApi, useEventManager, useHasRecoveryMethod, useNotifications, useUser } from '../../../hooks';
import SessionRecoveryResetConfirmedPrompt from './SessionRecoveryResetConfirmedPrompt';
import sessionRecoveryIllustration from './session-recovery-illustration.svg';

enum STEP {
    PROMPT,
    RESET_CONFIRMED,
}

interface Props extends ModalProps {
    confirmedStep?: boolean;
}

const InitiateSessionRecoveryModal = ({ confirmedStep = false, onClose, ...rest }: Props) => {
    const [user] = useUser();
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [hasRecoveryMethod] = useHasRecoveryMethod();

    const [step, setStep] = useState<STEP>(STEP.PROMPT);

    const [submitting, withSubmitting] = useLoading();

    if (step === STEP.RESET_CONFIRMED) {
        return <SessionRecoveryResetConfirmedPrompt open={rest.open} onClose={onClose} />;
    }

    const handleInitiateSessionRecovery = async () => {
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
    };

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

    const handleClose = submitting ? noop : onClose;

    return (
        <Modal onClose={handleClose} {...rest}>
            <ModalHeader title={c('Title').t`Request password reset?`} subline={user.Email} />
            <ModalContent>
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
            </ModalContent>
            <ModalFooter>
                {hasRecoveryMethod ? (
                    <ButtonLike as={SettingsLink} path={`/recovery`} onClick={onClose} disabled={submitting}>
                        {c('Action').t`Use recovery method`}
                    </ButtonLike>
                ) : (
                    <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                )}
                <Button
                    onClick={() => withSubmitting(handleInitiateSessionRecovery())}
                    loading={submitting}
                    color="danger"
                >
                    {c('Action').t`Request password reset`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default InitiateSessionRecoveryModal;
