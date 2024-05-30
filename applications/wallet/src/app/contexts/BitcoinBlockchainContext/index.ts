import { createContext, useContext } from 'react';

import { WasmNetwork } from '@proton/andromeda';
import { IWasmApiWalletData, WalletMap } from '@proton/wallet';

import {
    AccountIdByDerivationPathAndWalletId,
    AccountWithChainData,
    WalletChainDataByWalletId,
    WalletWithChainData,
} from '../../types';
import { SyncingMetadata } from './useWalletsChainData';

export type SyncingObserver = (wallet: WalletWithChainData, account: AccountWithChainData) => void;

export interface BitcoinBlockchainContextValue {
    network: WasmNetwork | undefined;

    decryptedApiWalletsData: IWasmApiWalletData[] | undefined;
    walletMap: WalletMap;
    loadingApiWalletsData: boolean;
    setPassphrase: (walletId: string, walletPassphrase: string) => void;

    walletsChainData: WalletChainDataByWalletId;
    accountIDByDerivationPathByWalletID: AccountIdByDerivationPathAndWalletId;
    syncingMetatadaByAccountId: Partial<Record<string, SyncingMetadata>>;
    syncSingleWalletAccount: (args: { walletId: string; accountId: string; manual?: boolean }) => void;
    syncSingleWallet: (args: { walletId: string; manual?: boolean }) => void;
    syncManyWallets: (args: { walletIds: string[]; manual?: boolean }) => void;

    isSyncing: (walletId: string, accountId?: string) => boolean;
    getSyncingData: (walletId: string, accountId?: string) => SyncingMetadata | undefined;

    feesEstimation: Map<string, number>;
    loadingFeesEstimation: boolean;
}

export const BitcoinBlockchainContext = createContext<BitcoinBlockchainContextValue>({
    network: undefined,

    decryptedApiWalletsData: undefined,
    walletMap: {},
    loadingApiWalletsData: false,
    setPassphrase: () => {},

    walletsChainData: {},
    accountIDByDerivationPathByWalletID: {},
    syncingMetatadaByAccountId: {},
    syncSingleWalletAccount: async () => {},
    syncSingleWallet: async () => {},
    syncManyWallets: async () => {},

    isSyncing: () => false,
    getSyncingData: () => undefined,

    feesEstimation: new Map(),
    loadingFeesEstimation: false,
});

export const useBitcoinBlockchainContext = () => useContext(BitcoinBlockchainContext);
