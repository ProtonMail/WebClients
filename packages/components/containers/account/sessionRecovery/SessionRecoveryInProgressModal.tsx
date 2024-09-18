import type { ReactNode } from 'react';
import { useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';

import type { ModalProps } from '../../../components';
import {
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
} from '../../../components';
import { useSessionRecoveryGracePeriodHoursRemaining, useUser } from '../../../hooks';
import ConfirmSessionRecoveryCancellationModal from './ConfirmSessionRecoveryCancellationModal';
import SessionRecoveryInProgressModalIllustration from './SessionRecoveryInProgressModalIllustration';
import { useSessionRecoveryLocalStorage } from './SessionRecoveryLocalStorageManager';

enum STEP {
    INFO,
    CONFIRM_CANCELLATION,
}

const SessionRecoveryInProgressModal = ({ onClose, ...rest }: ModalProps) => {
    const [user] = useUser();
    const [step, setStep] = useState(STEP.INFO);
    const { confirmSessionRecoveryInProgress } = useSessionRecoveryLocalStorage();

    const gracePeriodHoursRemaining = useSessionRecoveryGracePeriodHoursRemaining();

    if (!user.AccountRecovery || gracePeriodHoursRemaining === null) {
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

    const { title, content, footer }: { title: string; content: ReactNode; footer: ReactNode } = (() => {
        const boldEmail = (
            <>
                <br />
                <b key="bold-user-email" className="text-break">
                    {user.Email}
                </b>
            </>
        );

        if (step === STEP.INFO) {
            const boldTimeLeft = (
                <b key="bold-time-left">
                    {
                        // translator: Full sentence is "To make sure it’s really you trying to reset your password, we wait 72 hours before approving requests. You can change your password in XX more hours."
                        c('session_recovery:in_progress:info').ngettext(
                            msgid`${gracePeriodHoursRemaining} more hour`,
                            `${gracePeriodHoursRemaining} more hours`,
                            gracePeriodHoursRemaining
                        )
                    }
                </b>
            );

            const viewRequest = (
                <SettingsLink key="view-request-link" path="/account-password" onClick={onClose}>
                    {c('session_recovery:in_progress:link').t`View request`}
                </SettingsLink>
            );

            return {
                title: c('session_recovery:in_progress:title').t`Password reset requested`,
                content: (
                    <>
                        <div className="flex justify-center">
                            <SessionRecoveryInProgressModalIllustration hoursRemaining={gracePeriodHoursRemaining} />
                        </div>
                        <p>
                            {
                                // translator: Full sentence is "We received a password reset request for account@proton.me."
                                c('session_recovery:in_progress:info')
                                    .jt`We received a password reset request for ${boldEmail}.`
                            }
                            <br />
                        </p>
                        <p>
                            {
                                // translator: Full sentence is "To make sure it’s really you trying to reset your password, we wait 72 hours before approving requests. You can change your password in XX more hours."
                                c('session_recovery:in_progress:info')
                                    .jt`To make sure it’s really you trying to reset your password, we wait 72 hours before approving requests. You can change your password in ${boldTimeLeft}. ${viewRequest}`
                            }
                        </p>
                        <p>{c('session_recovery:in_progress:info')
                            .t`If you didn’t ask to reset your password, cancel this request now.`}</p>
                    </>
                ),
                footer: (
                    <>
                        <Button onClick={() => setStep(STEP.CONFIRM_CANCELLATION)}>
                            {
                                // translator: The request here refers to a password reset request. So clicking this button will cancel the password reset request.
                                c('session_recovery:in_progress:action').t`Cancel request`
                            }
                        </Button>
                        <Button
                            color="norm"
                            onClick={() => {
                                confirmSessionRecoveryInProgress();
                                onClose?.();
                            }}
                        >
                            {c('session_recovery:in_progress:action').t`Got it`}
                        </Button>
                    </>
                ),
            };
        }

        throw new Error(`Step ${step} not implemented`);
    })();

    return (
        <Modal onClose={onClose} {...rest}>
            <ModalHeader title={title} />
            <ModalContent>{content}</ModalContent>
            <ModalFooter>{footer}</ModalFooter>
        </Modal>
    );
};

export default SessionRecoveryInProgressModal;
