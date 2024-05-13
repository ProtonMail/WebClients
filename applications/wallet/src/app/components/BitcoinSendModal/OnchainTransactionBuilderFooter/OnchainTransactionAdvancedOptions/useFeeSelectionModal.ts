import { useEffect, useMemo, useState } from 'react';

import { MAX_BLOCK_TARGET } from '../../../../constants';
import { FeeRateByBlockTarget } from './type';
import { findLowestBlockTargetByFeeRate, findNearestBlockTargetFeeRate } from './utils';

export const useFeeSelectionModal = (feeEstimations: FeeRateByBlockTarget[], feeRate: number, isOpen: boolean) => {
    const [tmpFeeRate, setTmpFeeRate] = useState(1);

    const handleBlockTargetChange = (blockTarget: number) => {
        const nearestBlockFeeRate = findNearestBlockTargetFeeRate(blockTarget, feeEstimations);

        if (nearestBlockFeeRate) {
            setTmpFeeRate(nearestBlockFeeRate);
        }
    };

    const handleFeeRateChange = (value: string) => {
        setTmpFeeRate(Number(value));
    };

    useEffect(() => {
        if (!isOpen) {
            setTmpFeeRate(1);
        } else {
            setTmpFeeRate(feeRate);
        }

        // Only triggers this on visibility change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const tmpBlockTarget = useMemo(() => {
        return findLowestBlockTargetByFeeRate(tmpFeeRate, feeEstimations) ?? MAX_BLOCK_TARGET;
    }, [feeEstimations, tmpFeeRate]);

    return { tmpBlockTarget, tmpFeeRate, handleBlockTargetChange, handleFeeRateChange };
};
