import { ComponentProps, createContext, useContext } from 'react';

import { noop } from 'lodash';

import { WalletCreationModal } from '../../components';
import { WalletBackupModal } from '../../components/WalletBackupModal';

export type ModalData = ComponentProps<typeof WalletCreationModal> | ComponentProps<typeof WalletBackupModal>;
export interface WalletSetupModalContextValue {
    open: (data: ModalData) => void;
    close: () => void;
}

export const WalletSetupModalContext = createContext<WalletSetupModalContextValue>({
    open: noop,
    close: noop,
});

export const useWalletSetupModalContext = () => useContext(WalletSetupModalContext);
