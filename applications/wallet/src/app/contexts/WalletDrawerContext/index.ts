import { createContext, useContext } from 'react';

import noop from 'lodash/noop';

import type { WasmApiWalletAccount } from '@proton/andromeda';
import type { IWasmApiWalletData } from '@proton/wallet';

import type { TransactionData } from '../../hooks/useWalletTransactions';
import type { SubTheme } from '../../utils';

export interface WalletTransactionDrawerData {
    kind: 'transaction-data';
    transaction: TransactionData;
    onClickEditNote: () => void;
    onClickEditSender: () => void;
}

export interface WalletDiscoverDrawerData {
    kind: 'discover';
    wallet: IWasmApiWalletData;
}

export interface WalletReceiveDrawerData {
    kind: 'wallet-receive';
    wallet: IWasmApiWalletData;
    account?: WasmApiWalletAccount;
}

export type WalletDrawerContentData = WalletTransactionDrawerData | WalletDiscoverDrawerData | WalletReceiveDrawerData;

export interface WalletCommonData {
    theme?: SubTheme;
}

export type WalletDrawerContextData = WalletDrawerContentData & WalletCommonData & Record<string, any>;

export interface WalletDrawerContextValue {
    isDrawerOpen: boolean;
    drawer?: { data: WalletDrawerContextData };
    setDrawerData: (data: Partial<WalletDrawerContextData>) => void;
    openDrawer: (data: WalletDrawerContextData) => void;
}

export const WalletDrawerContext = createContext<WalletDrawerContextValue>({
    isDrawerOpen: false,
    setDrawerData: noop,
    openDrawer: noop,
});

export const useWalletDrawerContext = () => useContext(WalletDrawerContext);
