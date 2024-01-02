import { WasmNetwork } from '../../pkg';
import { ApiWallet } from '../types';
import { useBlockchainFeesEstimation } from './useBlockchainFeesEstimation';
import { useBlockchainSyncing } from './useBlockchainSyncing';

export const useBlockchainData = (network: WasmNetwork, wallets?: ApiWallet[]) => {
    const {
        syncingMetatadaByAccountId,
        walletsWithBalanceAndTxs,
        syncSingleWalletAccountBlockchainData,
        syncAllWalletAccountsBlockchainData,
        syncAllWalletsBlockchainData,
    } = useBlockchainSyncing(network, wallets);

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
