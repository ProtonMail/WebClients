import { useEffect, useMemo } from 'react';

import { DEFAULT_TARGET_BLOCK } from '@proton/wallet';

import { useBitcoinBlockchainContext } from '../../../contexts';
import { type TxBuilderHelper } from '../../../hooks/useTxBuilder';

type BlockTarget = number;
type FeeRate = number;

export type FeeRateByBlockTarget = [BlockTarget, FeeRate];

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

    return sorted.find(([, blockFeeRate]) => blockFeeRate <= feeRate)?.[1];
};

export const feesMapToList = (feesMap: Map<string, number>) => {
    return (
        [...feesMap.entries()]
            // We need to round feeRate because bdk expects a BigInt
            .map(([block, feeRate]): FeeRateByBlockTarget => [Number(block), Math.round(feeRate)])
            .filter(([block]) => Number.isFinite(block))
            .sort(([a], [b]) => a - b)
    );
};

export const useFees = () => {
    const { feesEstimation: feesMap, minimumFee: minimumFee } = useBitcoinBlockchainContext();

    const feesList = useMemo(() => {
        return feesMapToList(feesMap);
    }, [feesMap]);

    return {
        feesList,
        feesMap,
        minimumFee,
    };
};

export const useFeesInput = (txBuilderHelpers: TxBuilderHelper) => {
    const { txBuilder, updateTxBuilder } = txBuilderHelpers;

    const { feesList, minimumFee } = useFees();

    const getFeesByBlockTarget = (blockTarget: number) => {
        return findNearestBlockTargetFeeRate(blockTarget, feesList, minimumFee);
    };

    const feeRate = Number(txBuilder.getFeeRate() ?? 1);

    useEffect(() => {
        const defaultFeeRate = findNearestBlockTargetFeeRate(DEFAULT_TARGET_BLOCK, feesList, minimumFee);

        if (defaultFeeRate && !txBuilder.getFeeRate()) {
            updateTxBuilder((txBuilder) => txBuilder.setFeeRate(BigInt(Math.round(defaultFeeRate))));
        }
    }, [feeRate, feesList, minimumFee, txBuilder, updateTxBuilder]);

    return {
        feeRate,
        getFeesByBlockTarget,
    };
};
