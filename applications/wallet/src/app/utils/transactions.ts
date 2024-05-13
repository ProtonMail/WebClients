import { format } from 'date-fns';
import { intervalToDuration } from 'date-fns';
import { compact } from 'lodash';

import { WasmTransactionDetails, WasmTransactionTime } from '@proton/andromeda';
import { SECOND } from '@proton/shared/lib/constants';

const toMsTimestamp = (ts: number | BigInt) => {
    return Number(ts) * SECOND;
};

export const transactionTime = (transaction: WasmTransactionDetails) => {
    if (transaction.time?.confirmation_time) {
        return toMsTimestamp(transaction.time?.confirmation_time);
    }

    if (transaction.time?.last_seen) {
        return toMsTimestamp(transaction.time?.last_seen);
    }

    return new Date().getTime();
};

export const sortTransactionsByTime = (transactions: WasmTransactionDetails[]) => {
    return [...transactions].sort((txA, txB) => transactionTime(txB) - transactionTime(txA));
};

export const confirmationTimeToHumanReadable = (confirmation?: WasmTransactionTime | null): string => {
    if (confirmation?.confirmation_time) {
        return format(new Date(Number(confirmation.confirmation_time) * 1000), 'dd MMM yyyy, hh:mm');
    }

    if (confirmation?.last_seen) {
        return format(new Date(Number(confirmation.last_seen) * 1000), 'dd MMM yyyy, hh:mm');
    }

    return '-';
};

export const getFormattedPeriodSinceConfirmation = (now: Date, confirmation: Date) => {
    if (!confirmation) {
        return;
    }

    const confirmationInterval: Interval | undefined = { start: confirmation, end: now };
    const confirmedSince = intervalToDuration(confirmationInterval);

    if (confirmedSince.days) {
        return format(confirmation, 'MMM d, y, HH:mm');
    }

    const periods = compact([
        confirmedSince.hours && `${confirmedSince.hours} hours`,
        confirmedSince.minutes && `${confirmedSince.minutes} minutes`,
        confirmedSince.seconds && `${confirmedSince.seconds} seconds`,
    ]);

    return periods.reduce((acc, cur, index) => {
        if (!acc) {
            return cur;
        }

        return index < periods.length ? `${acc}, ${cur}` : `${acc} and ${cur} ago`;
    }, '');
};
