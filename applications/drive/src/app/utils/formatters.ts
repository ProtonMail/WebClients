export const COUNT_PLACEHOLDER = '…';

export const formatAccessCount = (count?: number) => {
    return count === undefined ? COUNT_PLACEHOLDER : count;
};
