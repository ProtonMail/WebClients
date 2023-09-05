import { ReactNode, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import {
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    Prompt,
    SettingsLink,
} from '../../../components';
import { useSessionRecoveryGracePeriodHoursRemaining, useUser } from '../../../hooks';
import ConfirmSessionRecoveryCancellationModal from './ConfirmSessionRecoveryCancellationModal';
import SessionRecoveryInProgressModalIllustration from './SessionRecoveryInProgressModalIllustration';

enum STEP {
    INFO,
    CONFIRM_CANCELLATION,
    RESET_CONFIRMED,
}

const SessionRecoveryInProgressModal = ({ ...rest }: ModalProps) => {
    const [user] = useUser();
    const [step, setStep] = useState(STEP.INFO);

    const gracePeriodHoursRemaining = useSessionRecoveryGracePeriodHoursRemaining();

    if (user.AccountRecovery === null || gracePeriodHoursRemaining === null) {
        return null;
    }

    if (step === STEP.CONFIRM_CANCELLATION) {
        return <ConfirmSessionRecoveryCancellationModal open={rest.open} onDismiss={() => setStep(STEP.INFO)} />;
    }

    if (step === STEP.RESET_CONFIRMED) {
        const recoverySectionLink = (
            <SettingsLink key="recovery-section-link" path="/recovery" onClick={rest.onClose}>{
                // translator: full sentence "You can check the status of your request at any time in the recovery section of the settings."
                c('Link').t`recovery section`
            }</SettingsLink>
        );
        return (
            <Prompt
                title={c('Title').ngettext(
                    msgid`You'll be able to reset your password in ${gracePeriodHoursRemaining} hour`,
                    `You'll be able to reset your password in ${gracePeriodHoursRemaining} hours`,
                    gracePeriodHoursRemaining
                )}
                open={rest.open}
                buttons={[<Button onClick={rest.onClose}>{c('Action').t`Got it`}</Button>]}
            >
                <p>{c('Info').t`We will contact you again when the password reset is available.`}</p>
                <p>
                    {
                        // translator: full sentence "You can check the status of your request at any time in the recovery section of the settings."
                        c('Info')
                            .jt`You can check the status of your request at any time in the ${recoverySectionLink} of the settings.`
                    }
                </p>
            </Prompt>
        );
    }

    const { title, content, footer }: { title: string; content: ReactNode; footer: ReactNode } = (() => {
        const boldEmail = (
            <b key="bold-user-email" className="text-break">
                {user.Email}
            </b>
        );

        if (step === STEP.INFO) {
            const boldTimeLeft = (
                <b key="bold-time-left">
                    {c('Info').ngettext(
                        msgid`${gracePeriodHoursRemaining} hour`,
                        `${gracePeriodHoursRemaining} hours`,
                        gracePeriodHoursRemaining
                    )}
                </b>
            );

            const secureYourAccount = (
                <Href key="secure-your-account" href={getKnowledgeBaseUrl('/new-account-owner-security-checklist')}>
                    {
                        // translator: Full sentence is "If you didn't make this request, or if you no longer need help signing in, please cancel it and take steps to secure your account."
                        c('Info').t`take steps to secure your account`
                    }
                </Href>
            );
            return {
                title: c('Title').t`Do you want to reset your password?`,
                content: (
                    <>
                        <div className="flex flex-justify-center">
                            <SessionRecoveryInProgressModalIllustration hoursRemaining={gracePeriodHoursRemaining} />
                        </div>
                        <p>
                            {
                                // translator: Full sentence is "We received a request to reset your password for account@proton.me. To keep your account safe, we want to make sure it's really you trying to reset your password. You'll be able to reset your password in 72 hours.""
                                c('Info')
                                    .jt`We received a request to reset your password for ${boldEmail}. To keep your account safe, we want to make sure it's really you trying to reset your password. You'll be able to reset your password in ${boldTimeLeft}.`
                            }
                        </p>
                        <p>
                            {
                                // translator: Full sentence is "If you didn't make this request, or if you no longer need help signing in, please cancel it and take steps to secure your account."
                                c('Info')
                                    .jt`If you didn't make this request, or if you no longer need help signing in, please cancel it and ${secureYourAccount}.`
                            }
                        </p>
                    </>
                ),
                footer: (
                    <>
                        <Button onClick={() => setStep(STEP.CONFIRM_CANCELLATION)}>
                            {
                                // translator: The request here refers to a password reset request. So clicking this button will cancel the password reset request.
                                c('Action').t`Cancel request`
                            }
                        </Button>
                        <Button
                            color="norm"
                            onClick={() =>
                                // TODO: do not show modal again in this session
                                setStep(STEP.RESET_CONFIRMED)
                            }
                        >
                            {c('Action').t`It was me, continue`}
                        </Button>
                    </>
                ),
            };
        }

        throw new Error(`Step ${step} not implemented`);
    })();

    return (
        <Modal {...rest}>
            <ModalHeader title={title} />
            <ModalContent>{content}</ModalContent>
            <ModalFooter>{footer}</ModalFooter>
        </Modal>
    );
};

export default SessionRecoveryInProgressModal;
