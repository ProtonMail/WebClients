import { useCallback, useEffect, useMemo, useState } from 'react';

import useLoading from '@proton/hooks/useLoading';

import { WasmClient, WasmTxBuilder } from '../../../pkg';
import { findLowestBlockTargetByFeeRate, findNearestBlockTargetFeeRate } from './utils';

export type FeeRateNote = 'LOW' | 'MODERATE' | 'HIGH';

const DEFAULT_TARGET_BLOCK = 5;
const MIN_FEE_RATE = 1;

const getFeeRate = (blockTarget: number): FeeRateNote => {
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
    updateTxBuilder: (updater: (txBuilder: WasmTxBuilder) => WasmTxBuilder) => void
) => {
    const [isRecommended, setIsRecommended] = useState(true);
    const [loadingFeeEstimation, withLoading] = useLoading();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [feeEstimations, setFeeEstimations] = useState<[number, number][]>([]);

    useEffect(() => {
        // TODO: cache this request
        void withLoading(
            new WasmClient().get_fees_estimation().then((estimationMap) => {
                const newFeeEstimations = [...estimationMap.entries()]
                    .map(([block, feeRate]): [number, number] => [Number(block), feeRate])
                    .filter(([block]) => Number.isFinite(block))
                    .sort(([a], [b]) => a - b);

                setFeeEstimations(newFeeEstimations);
            })
        );

        // withLoading deps makes hook rerun too often
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleFeesSelected = useCallback(
        (feeRate: number, isRecommended = false) => {
            updateTxBuilder((txBuilder) => txBuilder.set_fee_rate(feeRate));
            setIsRecommended(isRecommended);
            closeModal();
        },
        // all references are stable at mount here
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    useEffect(() => {
        const defaultFeeRate = findNearestBlockTargetFeeRate(DEFAULT_TARGET_BLOCK, feeEstimations);

        if (defaultFeeRate && !txBuilder.get_fee_rate()) {
            handleFeesSelected(defaultFeeRate, true);
        }
    }, [feeEstimations, handleFeesSelected, txBuilder]);

    const blockTarget = useMemo(() => {
        const feeRate = txBuilder.get_fee_rate() ?? MIN_FEE_RATE;
        const { blockTarget: lowestBlockTarget } = findLowestBlockTargetByFeeRate(feeRate, feeEstimations) ?? {
            blockTarget: 99,
        };

        return lowestBlockTarget;
    }, [feeEstimations, txBuilder]);

    return {
        feeEstimations,
        feeRateNote: getFeeRate(blockTarget),
        blockTarget,
        isModalOpen,
        loadingFeeEstimation,
        isRecommended,
        openModal,
        closeModal,
        handleFeesSelected,
    };
};
