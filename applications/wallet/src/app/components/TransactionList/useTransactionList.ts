import { useCallback, useEffect, useState } from 'react';

import { add, isBefore } from 'date-fns';

import { WasmSortOrder } from '@proton/andromeda';
import { SECOND } from '@proton/shared/lib/constants';

import { SYNCING_MINIMUM_COOLDOWN_MINUTES } from '../../constants/wallet';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useResponsiveContainerContext } from '../../contexts/ResponsiveContainerContext';

export const useTransactionList = ({ walletId, walletAccountId }: { walletId: string; walletAccountId?: string }) => {
    const { syncSingleWallet, syncSingleWalletAccount, getSyncingData } = useBitcoinBlockchainContext();

    const [sortOrder, setSortOrder] = useState<WasmSortOrder>(WasmSortOrder.Desc);

    const { isNarrow } = useResponsiveContainerContext();

    const syncingData = getSyncingData(walletId, walletAccountId);
    const isSyncingWalletData = syncingData?.syncing;

    const [isCoolingDown, setIsCoolingDown] = useState(false);
    useEffect(() => {
        const cooldownStartTime = syncingData?.lastSyncing && new Date(syncingData?.lastSyncing);
        const cooldownEndTime = cooldownStartTime
            ? add(cooldownStartTime, { minutes: SYNCING_MINIMUM_COOLDOWN_MINUTES })
            : undefined;

        const timeout = setInterval(() => {
            const localIsCoolingDown = cooldownEndTime ? isBefore(new Date(), cooldownEndTime) : false;
            setIsCoolingDown(localIsCoolingDown);
        }, 1 * SECOND);

        return () => clearInterval(timeout);
    }, [syncingData?.lastSyncing]);

    const handleClickSync = useCallback(() => {
        const isManual = true;
        if (walletAccountId) {
            return syncSingleWalletAccount({
                walletId: walletId,
                accountId: walletAccountId,
                manual: isManual,
            });
        } else {
            return syncSingleWallet({ walletId: walletId, manual: isManual });
        }
    }, [syncSingleWallet, syncSingleWalletAccount, walletAccountId, walletId]);

    return {
        isCoolingDown,
        isSyncingWalletData,

        sortOrder,
        setSortOrder,

        isNarrow,
        handleClickSync,
    };
};
