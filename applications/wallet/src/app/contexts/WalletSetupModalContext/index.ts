import { ComponentProps, createContext, useContext } from 'react';

import { noop } from 'lodash';

import { WalletCreationModal } from '../../components';

export interface WalletSetupModalContextValue {
    open: (data: ComponentProps<typeof WalletCreationModal>) => void;
    close: () => void;
}

export const WalletSetupModalContext = createContext<WalletSetupModalContextValue>({
    open: noop,
    close: noop,
});

export const useWalletSetupModalContext = () => useContext(WalletSetupModalContext);
