import { ReactNode, createContext, useContext, useMemo } from 'react';

import { WasmNetwork } from '../../pkg';
import { useBlockchainData } from '../hooks/useBlockchainData';
import { SyncingMetadata } from '../hooks/useBlockchainSyncing';
import { useDecryptedWallets } from '../hooks/useDecryptedWallet';
import { WalletWithAccountsWithBalanceAndTxs } from '../types';

const BITCOIN_NETWORK = WasmNetwork.Testnet; // TODO: move this to either config file, env variable or wallet db

export interface OnchainWalletContextValue {
    isInitialised: boolean;
    wallets: WalletWithAccountsWithBalanceAndTxs[] | undefined;
    syncingMetatadaByAccountId: Partial<Record<string, SyncingMetadata>>;
    fees: Map<string, number>;
    syncSingleWalletAccountBlockchainData: (walletId: string, accountId: number, shouldSync?: any) => Promise<void>;
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
    const [wallets] = useDecryptedWallets();

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
