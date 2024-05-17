import { ComponentProps, ReactNode } from 'react';

import { useModalStateWithData } from '@proton/components/components';

import { WalletSetupModalContext } from '.';
import { WalletCreationModal } from '../../components';

interface Props {
    children: ReactNode;
}

export const WalletSetupModalContextProvider = ({ children }: Props) => {
    const [walletSetupModal, setWalletSetupModal] = useModalStateWithData<ComponentProps<typeof WalletCreationModal>>();

    const close = async () => {
        walletSetupModal.onClose?.();
    };

    const open = (data: ComponentProps<typeof WalletCreationModal>) => {
        setWalletSetupModal(data);
    };

    return (
        <WalletSetupModalContext.Provider value={{ close, open }}>
            {children}
            <WalletCreationModal schemeAndData={walletSetupModal.data?.schemeAndData} {...walletSetupModal} />
        </WalletSetupModalContext.Provider>
    );
};
