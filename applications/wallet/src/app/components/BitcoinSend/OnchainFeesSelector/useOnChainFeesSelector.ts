import { useCallback, useEffect, useMemo, useState } from 'react';

import { WasmTxBuilder } from '../../../../pkg';
import { useBlockchainContext } from '../../../contexts';
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
    const { fees } = useBlockchainContext();
    const [isRecommended, setIsRecommended] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const feeEstimations = useMemo(() => {
        return [...fees.entries()]
            .map(([block, feeRate]): FeeRateByBlockTarget => [Number(block), feeRate])
            .filter(([block]) => Number.isFinite(block))
            .sort(([a], [b]) => a - b);
    }, [fees]);

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
        const defaultFeeRate = findNearestBlockTargetFeeRate(DEFAULT_TARGET_BLOCK, feeEstimations);

        if (defaultFeeRate && !txBuilder.getFeeRate()) {
            handleFeesSelected(defaultFeeRate, true);
        }
    }, [feeEstimations, handleFeesSelected, txBuilder]);

    const blockTarget = useMemo(() => {
        const feeRate = txBuilder.getFeeRate() ?? MIN_FEE_RATE;
        return findLowestBlockTargetByFeeRate(feeRate, feeEstimations) ?? MAX_BLOCK_TARGET;
    }, [feeEstimations, txBuilder]);

    return {
        feeEstimations,
        feeRateNote: getFeeRateNote(blockTarget),
        blockTarget,
        isModalOpen,
        isRecommended,
        openModal,
        closeModal,
        handleFeesSelected,
    };
};
