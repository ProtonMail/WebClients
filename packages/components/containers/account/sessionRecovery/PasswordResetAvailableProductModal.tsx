import { useState } from 'react';

import { c, msgid } from 'ttag';

import { Button, ButtonLike, Href } from '@proton/atoms';
import { useSessionRecoveryInsecureTimeRemaining } from '@proton/components/hooks/useSessionRecovery';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import {
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    SettingsLink,
} from '../../../components';
import { useUser } from '../../../hooks';
import ConfirmSessionRecoveryCancellationModal from './ConfirmSessionRecoveryCancellationModal';
import passwordResetIllustration from './password-reset-illustration.svg';

enum STEP {
    INFO,
    CONFIRM_CANCELLATION,
}

const PasswordResetAvailableProductModal = ({ ...rest }: ModalProps) => {
    const [user] = useUser();
    const [step, setStep] = useState(STEP.INFO);

    const timeRemaining = useSessionRecoveryInsecureTimeRemaining();

    if (timeRemaining === null) {
        return null;
    }

    if (step === STEP.CONFIRM_CANCELLATION) {
        return <ConfirmSessionRecoveryCancellationModal open={rest.open} onBack={() => setStep(STEP.INFO)} />;
    }

    const infoSubline =
        timeRemaining.inDays === 0
            ? c('Info').ngettext(
                  msgid`This permission expires in ${timeRemaining.inHours} hour`,
                  `This permission expires in ${timeRemaining.inHours} hours`,
                  timeRemaining.inHours
              )
            : c('Info').ngettext(
                  msgid`This permission expires in ${timeRemaining.inDays} day`,
                  `This permission expires in ${timeRemaining.inDays} days`,
                  timeRemaining.inDays
              );

    const boldEmail = (
        <b key="bold-user-email" className="text-break">
            {user.Email}
        </b>
    );

    const boldDaysRemaining = (
        <b key="bold-days-remaining">
            {timeRemaining.inDays === 0
                ? c('Info').ngettext(
                      msgid`${timeRemaining.inHours} hour`,
                      `${timeRemaining.inHours} hours`,
                      timeRemaining.inHours
                  )
                : c('Info').ngettext(
                      msgid`${timeRemaining.inDays} day`,
                      `${timeRemaining.inDays} days`,
                      timeRemaining.inDays
                  )}
        </b>
    );

    return (
        <Modal {...rest}>
            <ModalHeader title={c('Title').t`Reset your password`} subline={infoSubline} />
            <ModalContent>
                <>
                    <div className="flex flex-justify-center">
                        <img src={passwordResetIllustration} alt={c('Session recovery').t`Password reset available`} />
                    </div>
                    <div>
                        {c('Info')
                            .jt`You can now change your password for the account ${boldEmail} freely during the next ${boldDaysRemaining}.`}
                    </div>
                    <Href
                        href={
                            // TODO: add knowledge base url
                            getKnowledgeBaseUrl('/session-recovery')
                        }
                    >{c('Link').t`Learn more`}</Href>
                </>
            </ModalContent>
            <ModalFooter>
                <Button onClick={() => setStep(STEP.CONFIRM_CANCELLATION)}>{c('Action').t`Cancel reset`}</Button>
                <ButtonLike
                    as={SettingsLink}
                    path="/account-password?action=session-recovery-reset-password"
                    color="norm"
                >
                    {c('Action').t`Set new password`}
                </ButtonLike>
            </ModalFooter>
        </Modal>
    );
};

export default PasswordResetAvailableProductModal;
