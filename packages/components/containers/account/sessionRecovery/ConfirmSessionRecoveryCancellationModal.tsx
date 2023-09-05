import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { abortSessionRecovery } from '@proton/shared/lib/api/sessionRecovery';

import { ModalProps, Prompt, useModalState } from '../../../components';
import AuthModal from '../../../containers/password/AuthModal';
import { useEventManager, useNotifications, useUser } from '../../../hooks';

interface Props extends ModalProps {
    onBack?: () => void;
}

const ConfirmSessionRecoveryCancellationModal = ({ onBack, onClose, ...rest }: Props) => {
    const { call } = useEventManager();
    const [authModal, setAuthModalOpen, renderAuthModal] = useModalState();
    const { createNotification } = useNotifications();
    const [user] = useUser();

    return (
        <>
            {renderAuthModal && (
                <AuthModal
                    config={abortSessionRecovery()}
                    {...authModal}
                    onCancel={() => setAuthModalOpen(false)}
                    onSuccess={async () => {
                        await call();
                        createNotification({ text: c('Info').t`Password reset cancelled`, showCloseButton: false });
                        onClose?.();
                    }}
                />
            )}
            <Prompt
                title={c('Title').t`Cancel password reset?`}
                subline={
                    // translator: variable here is the users email address
                    c('Title').t`for ${user.Email}`
                }
                buttons={[
                    <Button color="danger" onClick={() => setAuthModalOpen(true)}>
                        {c('Action').t`Cancel password reset`}
                    </Button>,
                    onBack ? (
                        <Button onClick={onBack}>{c('Action').t`Back`}</Button>
                    ) : (
                        <Button onClick={onClose}>{c('Action').t`Close`}</Button>
                    ),
                ]}
                {...rest}
            >
                <p>{c('Info').t`This will cancel the password reset process. No other changes will take effect.`}</p>
            </Prompt>
        </>
    );
};

export default ConfirmSessionRecoveryCancellationModal;
