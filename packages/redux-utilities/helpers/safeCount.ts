export const safeIncreaseCount = (current: number = 0, increment: number = 1) => {
    return Math.max(current + increment, 0);
};

export const safeDecreaseCount = (current: number = 0, decrement: number = 1) => {
    return Math.max(current - decrement, 0);
};
