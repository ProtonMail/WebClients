import { createContext, useContext } from 'react';

import noop from 'lodash/noop';

import type { WasmApiWalletAccount, WasmTransactionDetails } from '@proton/andromeda';
import type { IWasmApiWalletData } from '@proton/wallet/types';

import type { SubTheme } from '../../utils';

interface WalletTransactionDrawerData {
    transactionDataKey: string;
    kind: 'transaction-data';
    networkDataAndHashedTxId: [WasmTransactionDetails, string];
    onClickEditNote: () => void;
    onClickEditSender: () => void;
}

interface WalletDiscoverDrawerData {
    kind: 'discover';
    wallet: IWasmApiWalletData;
}

interface WalletReceiveDrawerData {
    kind: 'wallet-receive';
    wallet: IWasmApiWalletData;
    account?: WasmApiWalletAccount;
}

type WalletDrawerContentData = WalletTransactionDrawerData | WalletDiscoverDrawerData | WalletReceiveDrawerData;

interface WalletCommonData {
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
