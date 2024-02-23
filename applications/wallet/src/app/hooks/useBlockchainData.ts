import { IWasmWallet } from '../types';
import { useBlockchainFeesEstimation } from './useBlockchainFeesEstimation';
import { useBlockchainSyncing } from './useBlockchainSyncing';

export const useBlockchainData = (wallets?: IWasmWallet[]) => {
    const {
        syncingMetatadaByAccountId,
        walletsWithBalanceAndTxs,
        syncSingleWalletAccountBlockchainData,
        syncAllWalletAccountsBlockchainData,
        syncAllWalletsBlockchainData,
    } = useBlockchainSyncing(wallets);

    const { feesEstimation, loading: loadingFeesEstimation } = useBlockchainFeesEstimation();

    return {
        syncingMetatadaByAccountId,
        walletsWithBalanceAndTxs,

        syncSingleWalletAccountBlockchainData,
        syncAllWalletAccountsBlockchainData,
        syncAllWalletsBlockchainData,

        // Fees estimation
        feesEstimation,
        loadingFeesEstimation,
    };
};
