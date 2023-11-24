import { Transaction } from '../types';

export const sortTransactionsByTime = (transactions: Transaction[]) => {
    return [...transactions].sort(({ timestamp: timestampA }, { timestamp: timestampB }) => timestampB - timestampA);
};
