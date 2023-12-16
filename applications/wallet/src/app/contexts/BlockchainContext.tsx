import { ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { useBlockchainData } from '../hooks/useBlockchainData';
import { SyncingMetadata } from '../hooks/useBlockchainSyncing';
import { wallets as apiWallets } from '../tests/fixtures/api';
import { WalletWithAccountsWithBalanceAndTxs } from '../types';
import { ApiWallet } from '../types/api';

export interface BlockchainContextValue {
    wallets: WalletWithAccountsWithBalanceAndTxs[] | undefined;
    syncingAccounts: Partial<Record<string, SyncingMetadata>>;
    fees: Map<string, number>;
    loading: boolean;
    syncSingleWalletAccountBlockchainData: (walletId: string, accountId: string, shouldSync?: any) => Promise<void>;
}

const BlockchainContext = createContext<BlockchainContextValue>({
    wallets: undefined,
    syncingAccounts: {},
    fees: new Map(),
    loading: false,
    syncSingleWalletAccountBlockchainData: async () => {},
});

interface Props {
    children: ReactNode;
}

export const BlockchainContextProvider = ({ children }: Props) => {
    const [wallets, setWallets] = useState<ApiWallet[]>([]);

    useEffect(() => {
        // TODO: replace with API Call to fetch wallets
        setWallets(apiWallets);
    }, []);

    const {
        walletsWithBalanceAndTxs,
        feesEstimation,
        syncingAccounts,
        globalLoadingBlockchainData,
        syncSingleWalletAccountBlockchainData,
    } = useBlockchainData(wallets);

    return (
        <BlockchainContext.Provider
            value={{
                wallets: walletsWithBalanceAndTxs,
                fees: feesEstimation,
                loading: globalLoadingBlockchainData,
                syncingAccounts,
                syncSingleWalletAccountBlockchainData,
            }}
        >
            {children}
        </BlockchainContext.Provider>
    );
};

export const useBlockchainContext = () => useContext(BlockchainContext);
