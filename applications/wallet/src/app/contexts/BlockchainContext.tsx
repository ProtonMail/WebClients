import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';

import { useBlockchainData } from '../hooks/useBlockchainData';
import { SyncingMetadata } from '../hooks/useBlockchainSyncing';
import { wallets as apiWallets } from '../tests/fixtures/api';
import { WalletWithAccountsWithBalanceAndTxs } from '../types';
import { ApiWallet } from '../types/api';

export interface BlockchainContextValue {
    isInitialised: boolean;
    wallets: WalletWithAccountsWithBalanceAndTxs[] | undefined;
    syncingMetatadaByAccountId: Partial<Record<string, SyncingMetadata>>;
    fees: Map<string, number>;
    syncSingleWalletAccountBlockchainData: (walletId: number, accountId: number, shouldSync?: any) => Promise<void>;
}

const BlockchainContext = createContext<BlockchainContextValue>({
    isInitialised: false,
    wallets: undefined,
    syncingMetatadaByAccountId: {},
    fees: new Map(),
    syncSingleWalletAccountBlockchainData: async () => {},
});

interface Props {
    children: ReactNode;
}

export const BlockchainContextProvider = ({ children }: Props) => {
    const [wallets, setWallets] = useState<ApiWallet[]>();

    useEffect(() => {
        // TODO: replace with API Call to fetch wallets
        setWallets(apiWallets);
    }, []);

    const {
        walletsWithBalanceAndTxs,
        feesEstimation,
        syncingMetatadaByAccountId,
        syncSingleWalletAccountBlockchainData,
    } = useBlockchainData(wallets);

    const isInitialised = useMemo(() => {
        return !!walletsWithBalanceAndTxs;
    }, [walletsWithBalanceAndTxs]);

    return (
        <BlockchainContext.Provider
            value={{
                isInitialised,
                wallets: walletsWithBalanceAndTxs,
                fees: feesEstimation,
                syncingMetatadaByAccountId,
                syncSingleWalletAccountBlockchainData,
            }}
        >
            {children}
        </BlockchainContext.Provider>
    );
};

export const useBlockchainContext = () => useContext(BlockchainContext);
