import { ReactNode } from 'react';

import { useModalStateWithData } from '@proton/components/components';

import { ModalData, WalletSetupModalContext } from '.';
import { WalletCreationModal } from '../../components';
import { WalletBackupModal } from '../../components/WalletBackupModal';

interface Props {
    children: ReactNode;
}

export const WalletSetupModalContextProvider = ({ children }: Props) => {
    const [walletSetupModal, setWalletSetupModal] = useModalStateWithData<ModalData>();

    const close = async () => {
        walletSetupModal.onClose?.();
    };

    const open = (data: ModalData) => {
        setWalletSetupModal(data);
    };

    return (
        <WalletSetupModalContext.Provider value={{ close, open }}>
            {children}
            {(() => {
                if (walletSetupModal.data && 'wallet' in walletSetupModal.data) {
                    return <WalletBackupModal wallet={walletSetupModal.data.wallet} {...walletSetupModal} />;
                } else {
                    return <WalletCreationModal {...walletSetupModal} />;
                }
            })()}
        </WalletSetupModalContext.Provider>
    );
};
