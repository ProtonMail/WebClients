import { useCallback, useEffect, useMemo, useState } from 'react';

import { WasmTxBuilder } from '@proton/andromeda';

import { useBitcoinBlockchainContext } from '../../../../contexts';
import { DEFAULT_TARGET_BLOCK, MAX_BLOCK_TARGET, MIN_FEE_RATE } from './constant';
import { FeeRateByBlockTarget } from './type';
import { findLowestBlockTargetByFeeRate, findNearestBlockTargetFeeRate } from './utils';

export type FeeRateNote = 'LOW' | 'MODERATE' | 'HIGH';

const getFeeRateNote = (blockTarget: number): FeeRateNote => {
    if (blockTarget < 5) {
        return 'HIGH';
    } else if (blockTarget > 10) {
        return 'LOW';
    } else {
        return 'MODERATE';
    }
};

export const useOnChainFeesSelector = (
    txBuilder: WasmTxBuilder,
    updateTxBuilder: (updater: (txBuilder: WasmTxBuilder) => WasmTxBuilder | Promise<WasmTxBuilder>) => void
) => {
    const { feesEstimation: contextFeesEstimation } = useBitcoinBlockchainContext();
    const [isRecommended, setIsRecommended] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const feesEstimations = useMemo(() => {
        return [...contextFeesEstimation.entries()]
            .map(([block, feeRate]): FeeRateByBlockTarget => [Number(block), feeRate])
            .filter(([block]) => Number.isFinite(block))
            .sort(([a], [b]) => a - b);
    }, [contextFeesEstimation]);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleFeesSelected = useCallback(
        (feeRate: number, isRecommended = false) => {
            updateTxBuilder((txBuilder) => txBuilder.setFeeRate(feeRate));
            setIsRecommended(isRecommended);
            closeModal();
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
        const feeRate = txBuilder.getFeeRate() ?? MIN_FEE_RATE;
        return findLowestBlockTargetByFeeRate(feeRate, feesEstimations) ?? MAX_BLOCK_TARGET;
    }, [feesEstimations, txBuilder]);

    return {
        feesEstimations,
        feeRateNote: getFeeRateNote(blockTarget),
        blockTarget,
        isModalOpen,
        isRecommended,
        openModal,
        closeModal,
        handleFeesSelected,
    };
};
