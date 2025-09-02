import { useEffect } from 'react';

import { MIN_FEE_RATE, PriorityTargetBlock } from '@proton/wallet';
import { useNetworkFees } from '@proton/wallet/store';

import type { TxBuilderHelper } from './useTxBuilder';

export const findNearestBlockTargetFeeRate = (
    blockEstimate: PriorityTargetBlock,
    blockEstimationKeys: [number, number][],
    minimumFee?: number | undefined,
    recommendedFees?:
        | {
              HighPriority: number;
              MedianPriority: number;
              LowPriority: number;
          }
        | undefined
): number | undefined => {
    const recommendedFeesByBlockTarget = {
        [PriorityTargetBlock.HighPriorityTargetBlock]: recommendedFees?.HighPriority ?? MIN_FEE_RATE,
        [PriorityTargetBlock.MedianPriorityTargetBlock]: recommendedFees?.MedianPriority ?? MIN_FEE_RATE,
        [PriorityTargetBlock.LowPriorityTargetBlock]: recommendedFees?.LowPriority ?? MIN_FEE_RATE,
    };

    const nearestAbove = blockEstimationKeys.find(([block]) => {
        return Number(block) >= blockEstimate;
    });

    const nearestBelow = blockEstimationKeys.findLast(([block]) => {
        return Number(block) <= blockEstimate;
    });

    const [first] = blockEstimationKeys;

    const fee = (nearestAbove ?? nearestBelow ?? first)?.[1];
    // Use recommended fees if exist and valid
    const estimatedFee =
        recommendedFeesByBlockTarget[blockEstimate] > 1 ? recommendedFeesByBlockTarget[blockEstimate] : fee;

    // Return minimumFee if exists and if superior to fee or if fee is undefined
    return minimumFee && (estimatedFee === undefined || minimumFee > estimatedFee) ? minimumFee : estimatedFee;
};

export const findQuickestBlock = (feeRate: number, blockEstimationKeys: [number, number][]): number | undefined => {
    const sorted = [...blockEstimationKeys].sort(([blockA], [blockB]) => blockA - blockB);
    return sorted.find(([, blockFeeRate]) => blockFeeRate <= feeRate)?.[0];
};

export const useFeesInput = (txBuilderHelpers: TxBuilderHelper) => {
    const { txBuilder, updateTxBuilder } = txBuilderHelpers;

    const [fees, loading] = useNetworkFees();

    const getFeesByBlockTarget = (blockTarget: PriorityTargetBlock) => {
        return findNearestBlockTargetFeeRate(
            blockTarget,
            fees?.feesList ?? [],
            fees?.minimumBroadcastFee,
            fees?.recommendedFees
        );
    };

    const feeRate = Number(txBuilder.getFeeRate() ?? MIN_FEE_RATE);

    useEffect(() => {
        if (fees) {
            const { feesList, minimumBroadcastFee, recommendedFees } = fees;

            const defaultFeeRate = findNearestBlockTargetFeeRate(
                PriorityTargetBlock.LowPriorityTargetBlock,
                feesList,
                minimumBroadcastFee,
                recommendedFees
            );
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
