import { format } from 'date-fns';

import { SECOND } from '@proton/shared/lib/constants';

import { WasmSimpleTransaction } from '../../pkg';

export const sortTransactionsByTime = (transactions: WasmSimpleTransaction[]) => {
    return [...transactions].sort(
        ({ confirmation: confirmationA }, { confirmation: confirmationB }) =>
            Number(confirmationB.confirmation_time) - Number(confirmationA.confirmation_time)
    );
};

export const confirmationTimeToHumanReadable = (transaction: WasmSimpleTransaction) =>
    format(new Date(Number(transaction.confirmation.confirmation_time) * 1000), 'dd MMM yyyy, hh:mm');

const toMsTimestamp = (ts: number | BigInt) => {
    return Number(ts) * SECOND;
};

export const transactionTime = (transaction: WasmSimpleTransaction) => {
    if (transaction.confirmation.confirmation_time) {
        return toMsTimestamp(transaction.confirmation.confirmation_time);
    }

    if (transaction.confirmation.last_seen) {
        return toMsTimestamp(transaction.confirmation.last_seen);
    }

    return new Date().getTime();
};
