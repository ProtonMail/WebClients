import { useState } from 'react';

import { c, msgid } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import Modal from '@proton/components/components/modalTwo/Modal';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import ModalFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useSessionRecoveryInsecureTimeRemaining } from '@proton/components/hooks/useSessionRecovery';

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
        return (
            <ConfirmSessionRecoveryCancellationModal
                open={rest.open}
                onClose={rest.onClose}
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
                ? // translator: Full sentence "You can now change your password for the account <user@email.com> freely during the next <N hours>.
                  c('session_recovery:available:info').ngettext(
                      msgid`${timeRemaining.inHours} hour`,
                      `${timeRemaining.inHours} hours`,
                      timeRemaining.inHours
                  )
                : // translator: Full sentence "You can now change your password for the account <user@email.com> freely during the next <N days>.
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

    return (
        <Modal {...rest}>
            <ModalHeader title={c('session_recovery:available:title').t`Reset your password`} subline={infoSubline} />
            <ModalContent>
                <>
                    <div className="flex justify-center">
                        <img src={passwordResetIllustration} alt="" />
                    </div>
                    <div>{youCanNowChangeYourPassword}</div>
                </>
            </ModalContent>
            <ModalFooter>
                <Button onClick={() => setStep(STEP.CONFIRM_CANCELLATION)}>
                    {c('session_recovery:available:action').t`Cancel reset`}
                </Button>
                <ButtonLike
                    as={SettingsLink}
                    path="/account-password?action=session-recovery-reset-password"
                    color="norm"
                >
                    {c('session_recovery:available:action').t`Set new password`}
                </ButtonLike>
            </ModalFooter>
        </Modal>
    );
};

export default PasswordResetAvailableProductModal;
