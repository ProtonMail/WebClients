import { useEffect, useMemo } from 'react';

import { WasmTxBuilder } from '@proton/andromeda';
import { DEFAULT_TARGET_BLOCK } from '@proton/wallet';

import { useBitcoinBlockchainContext } from '../../../contexts';

type BlockTarget = number;
type FeeRate = number;

export type FeeRateByBlockTarget = [BlockTarget, FeeRate];

const findNearestBlockTargetFeeRate = (
    blockEstimate: number,
    blockEstimationKeys: [number, number][]
): number | undefined => {
    const nearestAbove = blockEstimationKeys.find(([block]) => {
        return block >= blockEstimate;
    });

    const nearestBelow = blockEstimationKeys.findLast(([block]) => {
        return block <= blockEstimate;
    });

    const [first] = blockEstimationKeys;

    return (nearestAbove ?? nearestBelow ?? first)?.[1];
};

export const useFeesInput = (
    txBuilder: WasmTxBuilder,
    updateTxBuilder: (updater: (txBuilder: WasmTxBuilder) => WasmTxBuilder | Promise<WasmTxBuilder>) => void
) => {
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

    useEffect(() => {
        const defaultFeeRate = findNearestBlockTargetFeeRate(DEFAULT_TARGET_BLOCK, feesEstimations);

        if (defaultFeeRate && !txBuilder.getFeeRate()) {
            updateTxBuilder((txBuilder) => txBuilder.setFeeRate(BigInt(Math.round(defaultFeeRate))));
        }
    }, [feeRate, feesEstimations, txBuilder, updateTxBuilder]);

    return {
        feeRate,
        getFeesByBlockTarget,
    };
};
