import { ApiWallet } from '../types';
import { useBlockchainFeesEstimation } from './useBlockchainFeesEstimation';
import { useBlockchainSyncing } from './useBlockchainSyncing';

// TODO: replace by redux when ready to bootstrap it
export const useBlockchainData = (wallets?: ApiWallet[]) => {
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
