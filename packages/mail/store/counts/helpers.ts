export const decrementUnread = (currentUnread: number = 0, decrement: number = 1) => {
    return Math.max(currentUnread - decrement, 0);
};

export const incrementUnread = (currentUnread: number = 0, increment: number = 1) => {
    return currentUnread + increment;
};
