export const findNearestBlockTargetFeeRate = (blockEstimate: number, blockEstimationKeys: [number, number][]) => {
    const nearest = blockEstimationKeys.find(([block]) => block > blockEstimate);

    return nearest ? nearest[1] : undefined;
};

export const findLowestBlockTargetByFeeRate = (feeRate: number, blockEstimationKeys: [number, number][]) => {
    const lowest = blockEstimationKeys.find(([, blockEstimateFeeRate]) => blockEstimateFeeRate <= feeRate);

    return lowest
        ? {
              blockTarget: lowest[0],
              feeRate: lowest[1],
          }
        : undefined;
};
