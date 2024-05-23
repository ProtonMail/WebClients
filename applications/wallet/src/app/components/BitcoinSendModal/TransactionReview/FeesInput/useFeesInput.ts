import { useCallback, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { WasmTxBuilder } from '@proton/andromeda';

import { DEFAULT_TARGET_BLOCK, MAX_BLOCK_TARGET, MIN_FEE_RATE } from '../../../../constants';
import { useBitcoinBlockchainContext } from '../../../../contexts';
import { FeeRateByBlockTarget } from './type';
import { findLowestBlockTargetByFeeRate, findNearestBlockTargetFeeRate } from './utils';

const getFeeRateNote = (blockTarget: number): string => {
    if (blockTarget < 5) {
        return c('Wallet send').t`high`;
    } else if (blockTarget > 10) {
        return c('Wallet send').t`low`;
    } else {
        return c('Wallet send').t`moderate`;
    }
};

export const useFeesInput = (
    txBuilder: WasmTxBuilder,
    updateTxBuilder: (updater: (txBuilder: WasmTxBuilder) => WasmTxBuilder | Promise<WasmTxBuilder>) => void
) => {
    const { feesEstimation: contextFeesEstimation } = useBitcoinBlockchainContext();
    const [isRecommended, setIsRecommended] = useState(true);

    const feesEstimations = useMemo(() => {
        return [...contextFeesEstimation.entries()]
            .map(([block, feeRate]): FeeRateByBlockTarget => [Number(block), feeRate])
            .filter(([block]) => Number.isFinite(block))
            .sort(([a], [b]) => a - b);
    }, [contextFeesEstimation]);

    const handleFeesSelected = useCallback(
        (feeRate: number, isRecommended = false) => {
            updateTxBuilder((txBuilder) => txBuilder.setFeeRate(BigInt(Math.round(feeRate))));
            setIsRecommended(isRecommended);
        },
        // all references are stable at mount here
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    useEffect(() => {
        const defaultFeeRate = findNearestBlockTargetFeeRate(DEFAULT_TARGET_BLOCK, feesEstimations);

        if (defaultFeeRate && !txBuilder.getFeeRate()) {
            handleFeesSelected(defaultFeeRate, true);
        }
    }, [feesEstimations, handleFeesSelected, txBuilder]);

    const blockTarget = useMemo(() => {
        const feeRate = Number(txBuilder.getFeeRate() ?? MIN_FEE_RATE);
        return findLowestBlockTargetByFeeRate(feeRate, feesEstimations) ?? MAX_BLOCK_TARGET;
    }, [feesEstimations, txBuilder]);

    const handleBlockTargetChange = (blockTarget: number) => {
        const nearestBlockFeeRate = findNearestBlockTargetFeeRate(blockTarget, feesEstimations);

        if (nearestBlockFeeRate) {
            handleFeesSelected(nearestBlockFeeRate);
        }
    };

    const feeRate = Number(txBuilder.getFeeRate() ?? 1);

    return {
        isRecommended,
        blockTarget,
        feeRate,
        handleBlockTargetChange,
        handleFeesSelected,
        note: getFeeRateNote(blockTarget),
    };
};
