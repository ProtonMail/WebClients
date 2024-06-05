import { createContext, useContext } from 'react';

import { noop } from 'lodash';

import { WasmApiWalletAccount } from '@proton/andromeda';
import { IWasmApiWalletData } from '@proton/wallet';

import { TransactionData } from '../../hooks/useWalletTransactions';
import { SubTheme } from '../../utils';

export interface WalletTransactionDrawerData {
    kind: 'transaction-data';
    transaction: TransactionData;
    apiAccount: WasmApiWalletAccount | undefined;
    apiWalletData: IWasmApiWalletData;
}

export interface WalletDiscoverDrawerData {
    kind: 'discover';
    wallet: IWasmApiWalletData;
}

export interface WalletReceiveDrawerData {
    kind: 'wallet-receive';
    account: WasmApiWalletAccount;
}

export type WalletDrawerContentData = WalletTransactionDrawerData | WalletDiscoverDrawerData | WalletReceiveDrawerData;

export interface WalletCommonData {
    theme?: SubTheme;
}

export type WalletDrawerContextData = WalletDrawerContentData & WalletCommonData;

export interface WalletDrawerContextValue {
    drawer?: { data: WalletDrawerContextData };
    openDrawer: (data: WalletDrawerContextData) => void;
}

export const WalletDrawerContext = createContext<WalletDrawerContextValue>({
    openDrawer: noop,
});

export const useWalletDrawerContext = () => useContext(WalletDrawerContext);
