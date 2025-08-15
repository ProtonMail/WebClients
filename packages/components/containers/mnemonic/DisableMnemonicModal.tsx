import { c } from 'ttag';

import { userThunk } from '@proton/account/user';
import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import AuthModal from '@proton/components/containers/password/AuthModal';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { disableMnemonicPhrase } from '@proton/shared/lib/api/settingsMnemonic';

interface DisableMnemonicModalProps {
    onClose: ModalProps['onClose'];
    onExit: ModalProps['onExit'];
    open: ModalProps['open'];
}

const DisableMnemonicModal = ({ open, onClose, onExit }: DisableMnemonicModalProps) => {
    const [authModalProps, setAuthModalOpen, renderAuthModal] = useModalState();

    const { createNotification } = useNotifications();
    const dispatch = useDispatch();

    return (
        <>
            {renderAuthModal && (
                <AuthModal
                    scope="password"
                    config={disableMnemonicPhrase()}
                    {...authModalProps}
                    onCancel={undefined}
                    onSuccess={async () => {
                        await dispatch(userThunk({ cache: CacheType.None }));
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
