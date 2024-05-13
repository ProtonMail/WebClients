import { createContext, useContext } from 'react';

import { noop } from 'lodash';

import { IWasmApiWalletData } from '@proton/wallet';

import { TransactionData } from '../../hooks/useWalletTransactions';

export interface WalletTransactionDrawerData {
    transaction: TransactionData;
}

export interface WalletDiscoverDrawerData {
    discover: true;
    wallet?: IWasmApiWalletData;
}

// will be an union later
export type WalletDrawerContextData = WalletTransactionDrawerData | WalletDiscoverDrawerData;

export interface WalletDrawerContextValue {
    drawer?: { data: WalletDrawerContextData };
    openDrawer: (data: WalletDrawerContextData) => void;
}

export const WalletDrawerContext = createContext<WalletDrawerContextValue>({
    openDrawer: noop,
});

export const useWalletDrawerContext = () => useContext(WalletDrawerContext);
