import { useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike } from '@proton/atoms';
import { abortSessionRecovery } from '@proton/shared/lib/api/sessionRecovery';

import {
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    ModalProps,
    Prompt,
    SettingsLink,
    useModalState,
} from '../../../components';
import AuthModal from '../../../containers/password/AuthModal';
import { useEventManager, useUser } from '../../../hooks';
import sessionRecoveryCancelledIllustration from './session-recovery-cancelled-illustration.svg';

enum STEP {
    CONFIRM_PROMPT,
    RESET_CANCELLED,
}

interface Props extends ModalProps {
    onDismiss: () => void;
}

const ConfirmSessionRecoveryCancellationModal = ({ onDismiss, ...rest }: Props) => {
    const [user] = useUser();
    const { call } = useEventManager();
    const [authModal, setAuthModalOpen, renderAuthModal] = useModalState();
    const [step, setStep] = useState(STEP.CONFIRM_PROMPT);

    if (step === STEP.RESET_CANCELLED) {
        const boldEmail = (
            <b key="bold-user-email" className="text-break">
                {user.Email}
            </b>
        );

        const boldPassword = (
            <b key="bold-password">{
                // translator: full sentence "Please secure your account by changing your password and setting up a trusted recovery method."
                c('Info').t`password`
            }</b>
        );

        const boldTrustedRecoveryMethod = (
            <b key="bold-password">{
                // translator: full sentence "Please secure your account by changing your password and setting up a trusted recovery method."
                c('Info').t`trusted recovery method`
            }</b>
        );

        return (
            <Modal {...rest}>
                <ModalHeader title={c('Title').t`Password reset cancelled`} />
                <ModalContent>
                    <div className="flex flex-justify-center">
                        <img src={sessionRecoveryCancelledIllustration} alt="Session recovery cancelled" />
                    </div>
                    <p>{c('Info').jt`The password reset for ${boldEmail} has been cancelled.`}</p>
                    <p>
                        {
                            // translator: full sentence "Please secure your account by changing your password and setting up a trusted recovery method."
                            c('Info')
                                .jt`Please secure your account by changing your ${boldPassword} and setting up a ${boldTrustedRecoveryMethod}.`
                        }
                    </p>
                </ModalContent>
                <ModalFooter>
                    <Button onClick={rest.onClose}>{c('Action').t`Dismiss`}</Button>
                    <ButtonLike
                        color="norm"
                        as={SettingsLink}
                        path="/account-password?action=change-password"
                        onClick={() => rest.onClose}
                    >
                        {c('Action').t`Secure my account now`}
                    </ButtonLike>
                </ModalFooter>
            </Modal>
        );
    }

    return (
        <>
            {renderAuthModal && (
                <AuthModal
                    config={abortSessionRecovery()}
                    {...authModal}
                    onCancel={() => setAuthModalOpen(false)}
                    onSuccess={async () => {
                        await call();
                        setStep(STEP.RESET_CANCELLED);
                    }}
                />
            )}
            <Prompt
                title={c('Title').t`Cancel password reset?`}
                buttons={[
                    <Button color="danger" onClick={() => setAuthModalOpen(true)}>
                        {c('Action').t`Cancel password reset`}
                    </Button>,
                    <Button onClick={onDismiss}>{c('Action').t`Dismiss`}</Button>,
                ]}
                {...rest}
            >
                <p>{c('Info').t`This will cancel the password reset process.`}</p>
                <p>{c('Info').t`No other changes will take effect.`}</p>
            </Prompt>
        </>
    );
};

export default ConfirmSessionRecoveryCancellationModal;
