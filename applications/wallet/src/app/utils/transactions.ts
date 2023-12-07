import { format } from 'date-fns';

import { SECOND } from '@proton/shared/lib/constants';

import { WasmConfirmation, WasmSimpleTransaction } from '../../pkg';

export const sortTransactionsByTime = (transactions: WasmSimpleTransaction[]) => {
    return [...transactions].sort(
        ({ confirmation: confirmationA }, { confirmation: confirmationB }) =>
            Number(confirmationB.confirmation_time) - Number(confirmationA.confirmation_time)
    );
};

export const confirmationTimeToHumanReadable = (confirmation: WasmConfirmation): string => {
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

export const transactionTime = (transaction: WasmSimpleTransaction) => {
    if (transaction.confirmation.confirmation_time) {
        return toMsTimestamp(transaction.confirmation.confirmation_time);
    }

    if (transaction.confirmation.last_seen) {
        return toMsTimestamp(transaction.confirmation.last_seen);
    }

    return new Date().getTime();
};
