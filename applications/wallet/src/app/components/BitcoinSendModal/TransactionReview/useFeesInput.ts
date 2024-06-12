import { useMemo } from 'react';

import { WasmTxBuilder } from '@proton/andromeda';

import { useBitcoinBlockchainContext } from '../../../contexts';

type BlockTarget = number;
type FeeRate = number;

export type FeeRateByBlockTarget = [BlockTarget, FeeRate];

const findNearestBlockTargetFeeRate = (blockEstimate: number, blockEstimationKeys: [number, number][]) => {
    const nearestAbove = blockEstimationKeys.find(([block]) => {
        return block >= blockEstimate;
    });

    const nearestBelow = blockEstimationKeys.findLast(([block]) => {
        return block <= blockEstimate;
    });

    return (nearestAbove ?? nearestBelow)?.[1] ?? blockEstimationKeys[1][1];
};

export const useFeesInput = (txBuilder: WasmTxBuilder) => {
    const { feesEstimation: contextFeesEstimation } = useBitcoinBlockchainContext();

    const feesEstimations = useMemo(() => {
        return (
            [...contextFeesEstimation.entries()]
                // We need to round feeRate because bdk expects a BigInt
                .map(([block, feeRate]): FeeRateByBlockTarget => [Number(block), Math.round(feeRate)])
                .filter(([block]) => Number.isFinite(block))
                .sort(([a], [b]) => a - b)
        );
    }, [contextFeesEstimation]);

    const getFeesByBlockTarget = (blockTarget: number) => {
        return findNearestBlockTargetFeeRate(blockTarget, feesEstimations);
    };

    const feeRate = Number(txBuilder.getFeeRate() ?? 1);

    return {
        feeRate,
        getFeesByBlockTarget,
    };
};
