import { format } from 'date-fns';

import { SECOND } from '@proton/shared/lib/constants';

import { IWasmBlockTime, IWasmSimpleTransaction, IWasmSimpleTransactionArray } from '../../pkg';

export const sortTransactionsByTime = (transactions: IWasmSimpleTransactionArray) => {
    return [...transactions].sort(
        ({ confirmation_time: confirmationA }, { confirmation_time: confirmationB }) =>
            Number(confirmationB?.timestamp) - Number(confirmationA?.timestamp)
    );
};

export const confirmationTimeToHumanReadable = (confirmation?: IWasmBlockTime): string => {
    if (confirmation?.timestamp) {
        return format(new Date(Number(confirmation.timestamp) * 1000), 'dd MMM yyyy, hh:mm');
    }

    return '-';
};

const toMsTimestamp = (ts: number | BigInt) => {
    return Number(ts) * SECOND;
};

export const transactionTime = (transaction: IWasmSimpleTransaction) => {
    if (transaction.confirmation_time?.timestamp) {
        return toMsTimestamp(transaction.confirmation_time?.timestamp);
    }

    return new Date().getTime();
};
