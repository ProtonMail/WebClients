import { useEffect } from 'react';

import { DEFAULT_TARGET_BLOCK } from '@proton/wallet';
import { useNetworkFees } from '@proton/wallet/store';

import { type TxBuilderHelper } from '../../../hooks/useTxBuilder';

export const findNearestBlockTargetFeeRate = (
    blockEstimate: number,
    blockEstimationKeys: [number, number][],
    minimumFee?: number | undefined
): number | undefined => {
    const nearestAbove = blockEstimationKeys.find(([block]) => {
        return Number(block) >= blockEstimate;
    });

    const nearestBelow = blockEstimationKeys.findLast(([block]) => {
        return Number(block) <= blockEstimate;
    });

    const [first] = blockEstimationKeys;

    const fee = (nearestAbove ?? nearestBelow ?? first)?.[1];

    // Return minimumFee if exists and if superior to fee or if fee is undefined
    return minimumFee && (fee === undefined || minimumFee > fee) ? minimumFee : fee;
};

export const findQuickestBlock = (feeRate: number, blockEstimationKeys: [number, number][]): number | undefined => {
    const sorted = [...blockEstimationKeys].sort(([blockA], [blockB]) => blockA - blockB);
    return sorted.find(([, blockFeeRate]) => blockFeeRate <= feeRate)?.[0];
};

export const useFeesInput = (txBuilderHelpers: TxBuilderHelper) => {
    const { txBuilder, updateTxBuilder } = txBuilderHelpers;

    const [fees, loading] = useNetworkFees();

    const getFeesByBlockTarget = (blockTarget: number) => {
        return findNearestBlockTargetFeeRate(blockTarget, fees?.feesList ?? [], fees?.minimumBroadcastFee);
    };

    const feeRate = Number(txBuilder.getFeeRate() ?? 1);

    useEffect(() => {
        if (fees) {
            const { feesList, minimumBroadcastFee } = fees;

            const defaultFeeRate = findNearestBlockTargetFeeRate(DEFAULT_TARGET_BLOCK, feesList, minimumBroadcastFee);
            if (defaultFeeRate && !txBuilder.getFeeRate()) {
                updateTxBuilder((txBuilder) => txBuilder.setFeeRate(BigInt(Math.round(defaultFeeRate))));
            }
        }
    }, [feeRate, fees, txBuilder, updateTxBuilder]);

    return {
        loading,
        feeRate,
        getFeesByBlockTarget,
    };
};
