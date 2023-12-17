import { useMemo } from 'react';

import { isEmpty } from 'lodash';

import { ApiWallet } from '../types';
import { useBlockchainFeesEstimation } from './useBlockchainFeesEstimation';
import { useBlockchainSyncing } from './useBlockchainSyncing';

// TODO: replace by redux when ready to bootstrap it
export const useBlockchainData = (wallets: ApiWallet[]) => {
    const {
        syncingMetatadaByAccountId,
        walletsWithBalanceAndTxs,
        syncSingleWalletAccountBlockchainData,
        syncAllWalletAccountsBlockchainData,
        syncAllWalletsBlockchainData,
    } = useBlockchainSyncing(wallets);

    const { feesEstimation, loading: loadingFeesEstimation } = useBlockchainFeesEstimation();

    const globalLoadingBlockchainData = useMemo(() => {
        return loadingFeesEstimation || !isEmpty(syncingMetatadaByAccountId);
    }, [loadingFeesEstimation, syncingMetatadaByAccountId]);

    return {
        globalLoadingBlockchainData,
        syncingMetatadaByAccountId,
        walletsWithBalanceAndTxs,
        feesEstimation,
        syncSingleWalletAccountBlockchainData,
        syncAllWalletAccountsBlockchainData,
        syncAllWalletsBlockchainData,
    };
};
