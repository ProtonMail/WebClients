import { ChangeEvent, useEffect, useState } from 'react';

import { findLowestBlockTargetByFeeRate, findNearestBlockTargetFeeRate } from './utils';

export const useFeeSelectionModal = (
    feeEstimations: [number, number][],
    isOpen: boolean,
    blockEstimate: number,
    feeRate: number
) => {
    const [tmpBlockTarget, setBlockTarget] = useState(1);
    const [tmpFeeRate, setFeeRate] = useState(1);

    const handleBlockTargetChange = (value: number) => {
        setBlockTarget(value);

        const nearestBlockFeeRate = findNearestBlockTargetFeeRate(tmpBlockTarget, feeEstimations);

        if (nearestBlockFeeRate) {
            setFeeRate(nearestBlockFeeRate);
        }
    };

    const handleFeeRateChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = Number(event.target.value);
        setFeeRate(value);

        const lowestBlockTarget = findLowestBlockTargetByFeeRate(value, feeEstimations);

        if (lowestBlockTarget) {
            const { blockTarget } = lowestBlockTarget;
            setBlockTarget(blockTarget);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setBlockTarget(1);
            setFeeRate(1);
        } else {
            setFeeRate(feeRate);
            setBlockTarget(blockEstimate);
        }

        // Only triggers this on visibility change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    return { tmpBlockTarget, tmpFeeRate, handleBlockTargetChange, handleFeeRateChange };
};
