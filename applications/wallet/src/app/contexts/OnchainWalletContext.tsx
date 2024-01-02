import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';

import { WasmNetwork } from '../../pkg';
import { useBlockchainData } from '../hooks/useBlockchainData';
import { SyncingMetadata } from '../hooks/useBlockchainSyncing';
import { wallets as apiWallets } from '../tests/fixtures/api';
import { WalletWithAccountsWithBalanceAndTxs } from '../types';
import { ApiWallet } from '../types/api';

const BITCOIN_NETWORK = WasmNetwork.Testnet; // TODO: move this to either config file, env variable or wallet db

export interface OnchainWalletContextValue {
    isInitialised: boolean;
    wallets: WalletWithAccountsWithBalanceAndTxs[] | undefined;
    syncingMetatadaByAccountId: Partial<Record<string, SyncingMetadata>>;
    fees: Map<string, number>;
    syncSingleWalletAccountBlockchainData: (walletId: number, accountId: number, shouldSync?: any) => Promise<void>;
    network: WasmNetwork;
}

const OnchainWalletContext = createContext<OnchainWalletContextValue>({
    isInitialised: false,
    wallets: undefined,
    syncingMetatadaByAccountId: {},
    fees: new Map(),
    syncSingleWalletAccountBlockchainData: async () => {},
    network: BITCOIN_NETWORK,
});

interface Props {
    children: ReactNode;
}

export const OnchainWalletContextProvider = ({ children }: Props) => {
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
    } = useBlockchainData(BITCOIN_NETWORK, wallets);

    const isInitialised = useMemo(() => {
        return !!walletsWithBalanceAndTxs;
    }, [walletsWithBalanceAndTxs]);

    return (
        <OnchainWalletContext.Provider
            value={{
                isInitialised,
                wallets: walletsWithBalanceAndTxs,
                fees: feesEstimation,
                syncingMetatadaByAccountId,
                syncSingleWalletAccountBlockchainData,
                network: BITCOIN_NETWORK,
            }}
        >
            {children}
        </OnchainWalletContext.Provider>
    );
};

export const useOnchainWalletContext = () => useContext(OnchainWalletContext);
