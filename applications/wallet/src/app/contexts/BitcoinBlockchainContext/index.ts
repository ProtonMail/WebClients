import { createContext, useContext } from 'react';

import type { WasmApiWallet, WasmApiWalletAccount, WasmNetwork } from '@proton/andromeda';
import type { SimpleMap } from '@proton/shared/lib/interfaces';
import type { IWasmApiWalletData } from '@proton/wallet';

import type {
    AccountIdByDerivationPathAndWalletId,
    AccountWithChainData,
    WalletChainDataByWalletId,
    WalletMap,
    WalletWithChainData,
} from '../../types';
import type { BitcoinAddressHelper } from './useBitcoinAddresses';
import type { SyncingMetadata } from './useWalletsChainData';

export type SyncingObserver = (wallet: WalletWithChainData, account: AccountWithChainData) => void;

export interface BitcoinBlockchainContextValue {
    network: WasmNetwork | undefined;

    apiWalletsData: IWasmApiWalletData[] | undefined;
    walletMap: WalletMap;
    loadingApiWalletsData: boolean;

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

    manageBitcoinAddressPool: ({
        wallet,
        account,
        accountChainData,
    }: {
        wallet: WasmApiWallet;
        account: WasmApiWalletAccount;
        accountChainData: AccountWithChainData;
    }) => Promise<void>;
    bitcoinAddressHelperByWalletAccountId: SimpleMap<BitcoinAddressHelper>;
}

export const BitcoinBlockchainContext = createContext<BitcoinBlockchainContextValue>({
    network: undefined,

    apiWalletsData: undefined,
    walletMap: {},
    loadingApiWalletsData: false,

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

    manageBitcoinAddressPool: async () => {},
    bitcoinAddressHelperByWalletAccountId: {},
});

export const useBitcoinBlockchainContext = () => useContext(BitcoinBlockchainContext);
