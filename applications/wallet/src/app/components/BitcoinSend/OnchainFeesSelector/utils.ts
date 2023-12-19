import { WasmChain } from '../../../../pkg';

export const findNearestBlockTargetFeeRate = (blockEstimate: number, blockEstimationKeys: [number, number][]) => {
    const nearest = blockEstimationKeys.find(([block]) => {
        return block >= blockEstimate;
    });

    return nearest ? nearest[1] : undefined;
};

export const findLowestBlockTargetByFeeRate = (feeRate: number, blockEstimationKeys: [number, number][]) => {
    const lowest = blockEstimationKeys.find(([, blockEstimateFeeRate]) => {
        return blockEstimateFeeRate <= feeRate;
    });

    return lowest ? lowest[0] : undefined;
};

// TODO: move this to BlockchainContext
export const getFeesEstimation = () => {
    return new WasmChain().get_fees_estimation();
};
