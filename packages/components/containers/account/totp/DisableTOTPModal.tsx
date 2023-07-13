import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useLoading } from '@proton/hooks';
import { disableTotp } from '@proton/shared/lib/api/settings';

import { ModalProps, Prompt, useModalState } from '../../../components';
import { useEventManager, useNotifications } from '../../../hooks';
import AuthModal from '../../password/AuthModal';

const DisableTOTPModal = ({ onClose, ...rest }: ModalProps) => {
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [authModalProps, setAuthModalOpen, renderAuthModal] = useModalState();

    return (
        <>
            {renderAuthModal && (
                <AuthModal
                    config={disableTotp()}
                    {...authModalProps}
                    onCancel={undefined}
                    onSuccess={async () => {
                        await withLoading(call());
                        onClose?.();
                        createNotification({ text: c('Info').t`Two-factor authentication disabled` });
                    }}
                />
            )}
            <Prompt
                {...rest}
                title={c('Title').t`Disable two-factor authentication`}
                onClose={onClose}
                buttons={[
                    <Button
                        loading={loading}
                        color="danger"
                        onClick={() => {
                            setAuthModalOpen(true);
                        }}
                    >
                        {c('Action').t`Disable`}
                    </Button>,
                    <Button disabled={loading} onClick={onClose}>
                        {c('Action').t`Cancel`}
                    </Button>,
                ]}
            >
                {c('Info').t`Are you sure you want to disable two-factor authentication?`}
            </Prompt>
        </>
    );
};

export default DisableTOTPModal;
