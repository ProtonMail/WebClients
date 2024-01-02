import { format } from 'date-fns';

import { SECOND } from '@proton/shared/lib/constants';

import { IWasmSimpleTransaction, IWasmSimpleTransactionArray, IWasmTransactionTime } from '../../pkg';

export const sortTransactionsByTime = (transactions: IWasmSimpleTransactionArray) => {
    return [...transactions].sort(
        ({ time: confirmationA }, { time: confirmationB }) =>
            Number(confirmationB.confirmation_time) - Number(confirmationA.confirmation_time)
    );
};

export const confirmationTimeToHumanReadable = (confirmation: IWasmTransactionTime): string => {
    if (confirmation.confirmed && confirmation.confirmation_time) {
        return format(new Date(Number(confirmation.confirmation_time) * 1000), 'dd MMM yyyy, hh:mm');
    }

    if (confirmation.last_seen) {
        return `(${format(new Date(Number(confirmation.last_seen) * 1000), 'dd MMM yyyy, hh:mm')})`;
    }

    return '-';
};

const toMsTimestamp = (ts: number | BigInt) => {
    return Number(ts) * SECOND;
};

export const transactionTime = (transaction: IWasmSimpleTransaction) => {
    if (transaction.time.confirmation_time) {
        return toMsTimestamp(transaction.time.confirmation_time);
    }

    if (transaction.time.last_seen) {
        return toMsTimestamp(transaction.time.last_seen);
    }

    return new Date().getTime();
};
