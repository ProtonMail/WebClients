import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Prompt from '@proton/components/components/prompt/Prompt';
import { disableMnemonicPhrase } from '@proton/shared/lib/api/settingsMnemonic';

import type { ModalProps } from '../../components';
import { useModalState } from '../../components';
import { useEventManager, useNotifications } from '../../hooks';
import AuthModal from '../password/AuthModal';

interface DisableMnemonicModalProps {
    onClose: ModalProps['onClose'];
    onExit: ModalProps['onExit'];
    open: ModalProps['open'];
}

const DisableMnemonicModal = ({ open, onClose, onExit }: DisableMnemonicModalProps) => {
    const [authModalProps, setAuthModalOpen, renderAuthModal] = useModalState();

    const { createNotification } = useNotifications();
    const { call } = useEventManager();

    return (
        <>
            {renderAuthModal && (
                <AuthModal
                    config={disableMnemonicPhrase()}
                    {...authModalProps}
                    onCancel={undefined}
                    onSuccess={async () => {
                        await call();
                        onClose?.();
                        createNotification({ text: c('Info').t`Recovery phrase has been disabled` });
                    }}
                />
            )}
            <Prompt
                open={open}
                title={c('Action').t`Disable recovery phrase?`}
                buttons={[
                    <Button color="danger" onClick={() => setAuthModalOpen(true)}>
                        {c('Action').t`Disable recovery phrase`}
                    </Button>,
                    <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
                ]}
                onClose={onClose}
                onExit={onExit}
            >
                <p className="mt-0">{c('Info')
                    .t`This will disable your current recovery phrase. You won't be able to use it to access your account or decrypt your data.`}</p>
                <p className="mb-0">{c('Info')
                    .t`Enabling recovery by phrase again will generate a new recovery phrase.`}</p>
            </Prompt>
        </>
    );
};

export default DisableMnemonicModal;
