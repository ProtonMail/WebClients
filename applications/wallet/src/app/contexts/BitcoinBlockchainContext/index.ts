import { createContext, useContext } from 'react';

import { WasmNetwork } from '@proton/andromeda';
import { IWasmApiWalletData } from '@proton/wallet';

import { AccountIdByDerivationPathAndWalletId, WalletChainDataByWalletId } from '../../types';
import { SyncingMetadata } from './useWalletsChainData';

export interface BitcoinBlockchainContextValue {
    network: WasmNetwork | undefined;

    decryptedApiWalletsData: IWasmApiWalletData[] | undefined;
    loadingApiWalletsData: boolean;
    setPassphrase: (walletId: string, walletPassphrase: string) => void;

    walletsChainData: WalletChainDataByWalletId;
    accountIDByDerivationPathByWalletID: AccountIdByDerivationPathAndWalletId;
    syncingMetatadaByAccountId: Partial<Record<string, SyncingMetadata>>;
    syncSingleWalletAccount: (walletId: string, accountId: string, shouldSync?: any) => Promise<void>;
    syncSingleWallet: (walletId: string, shouldSync?: boolean) => Promise<void>;
    syncManyWallets: (walletIds: string[], shouldSync?: boolean) => Promise<void>;

    feesEstimation: Map<string, number>;
    loadingFeesEstimation: boolean;
}

export const BitcoinBlockchainContext = createContext<BitcoinBlockchainContextValue>({
    network: undefined,

    decryptedApiWalletsData: undefined,
    loadingApiWalletsData: false,
    setPassphrase: () => {},

    walletsChainData: {},
    accountIDByDerivationPathByWalletID: {},
    syncingMetatadaByAccountId: {},
    syncSingleWalletAccount: async () => {},
    syncSingleWallet: async () => {},
    syncManyWallets: async () => {},

    feesEstimation: new Map(),
    loadingFeesEstimation: false,
});

export const useBitcoinBlockchainContext = () => useContext(BitcoinBlockchainContext);
