import { useEffect, useMemo } from 'react';

import { DEFAULT_TARGET_BLOCK } from '@proton/wallet';

import { useBitcoinBlockchainContext } from '../../../contexts';
import { type TxBuilderHelper } from '../../../hooks/useTxBuilder';

type BlockTarget = number;
type FeeRate = number;

export type FeeRateByBlockTarget = [BlockTarget, FeeRate];

export const findNearestBlockTargetFeeRate = (
    blockEstimate: number,
    blockEstimationKeys: [number, number][]
): number | undefined => {
    const nearestAbove = blockEstimationKeys.find(([block]) => {
        return Number(block) >= blockEstimate;
    });

    const nearestBelow = blockEstimationKeys.findLast(([block]) => {
        return Number(block) <= blockEstimate;
    });

    const [first] = blockEstimationKeys;

    return (nearestAbove ?? nearestBelow ?? first)?.[1];
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
    const { feesEstimation: feesMap } = useBitcoinBlockchainContext();

    const feesList = useMemo(() => {
        return feesMapToList(feesMap);
    }, [feesMap]);

    return {
        feesList,
        feesMap,
    };
};

export const useFeesInput = (txBuilderHelpers: TxBuilderHelper) => {
    const { txBuilder, updateTxBuilder } = txBuilderHelpers;

    const { feesList } = useFees();

    const getFeesByBlockTarget = (blockTarget: number) => {
        return findNearestBlockTargetFeeRate(blockTarget, feesList);
    };

    const feeRate = Number(txBuilder.getFeeRate() ?? 1);

    useEffect(() => {
        const defaultFeeRate = findNearestBlockTargetFeeRate(DEFAULT_TARGET_BLOCK, feesList);

        if (defaultFeeRate && !txBuilder.getFeeRate()) {
            updateTxBuilder((txBuilder) => txBuilder.setFeeRate(BigInt(Math.round(defaultFeeRate))));
        }
    }, [feeRate, feesList, txBuilder, updateTxBuilder]);

    return {
        feeRate,
        getFeesByBlockTarget,
    };
};
