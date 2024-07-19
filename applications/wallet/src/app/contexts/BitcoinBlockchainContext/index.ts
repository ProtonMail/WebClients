import { createContext, useContext } from 'react';

import type { WasmApiWalletAccount, WasmNetwork } from '@proton/andromeda';
import type { IWasmApiWalletData, WalletMap } from '@proton/wallet';

import type {
    AccountIdByDerivationPathAndWalletId,
    AccountWithChainData,
    WalletChainDataByWalletId,
    WalletWithChainData,
} from '../../types';
import type { SyncingMetadata } from './useWalletsChainData';

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
    incrementSyncKey: (walletId: string, accountId: string) => void;

    isSyncing: (walletId: string, accountId?: string) => boolean;
    getSyncingData: (walletId: string, accountId?: string) => SyncingMetadata | undefined;

    feesEstimation: Map<string, number>;
    loadingFeesEstimation: boolean;

    fillBitcoinAddressPools: (data?: { walletAccountIds: string[] }) => void;
    fillBitcoinAddressPoolForAccount: (
        walletAccount: WasmApiWalletAccount,
        walletWithChainData: WalletWithChainData
    ) => Promise<void>;
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
    incrementSyncKey: () => {},

    isSyncing: () => false,
    getSyncingData: () => undefined,

    feesEstimation: new Map(),
    loadingFeesEstimation: false,

    fillBitcoinAddressPools: () => {},
    fillBitcoinAddressPoolForAccount: async () => {},
});

export const useBitcoinBlockchainContext = () => useContext(BitcoinBlockchainContext);
