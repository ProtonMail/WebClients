import { c } from 'ttag';

import { userThunk } from '@proton/account/user';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities/interface';
import { disableMnemonicPhrase } from '@proton/shared/lib/api/settingsMnemonic';

import type { ModalProps } from '../../components/modalTwo/Modal';
import useModalState from '../../components/modalTwo/useModalState';
import Prompt from '../../components/prompt/Prompt';
import AuthModal from '../password/AuthModal';

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
