export const feesEstimations: [number, number][] = [
    [1, 45],
    [2, 42],
    [3, 37],
    [4, 32],
    [5, 29],
    [6, 23],
    [7, 15],
    [8, 12],
    [9, 7],
    [12, 6],
    [16, 4],
    [20, 4],
    [22, 4],
    [40, 3],
    [86, 2],
    [173, 1],
];

export const getFeesEstimationMap = () => {
    const map = new Map();

    for (const feeItem of feesEstimations) {
        map.set(feeItem[0], feeItem[1]);
    }

    return map;
};
