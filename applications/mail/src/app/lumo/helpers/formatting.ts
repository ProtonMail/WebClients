import { fromUnixTime, lightFormat } from 'date-fns';

import type { Recipient } from '@proton/shared/lib/interfaces';

/** Local parts, not UTC: a UTC serialisation shifts the day either side of midnight. */
export const formatLocalDate = (date: Date): string => {
    if (date.getTime() === 0) {
        return '';
    }

    return lightFormat(date, 'yyyy-MM-dd');
};

export const formatUnixDate = (time?: number): string => (time ? formatLocalDate(fromUnixTime(time)) : '');

export const formatSender = (recipients: (Recipient | undefined)[]): string => {
    const names = recipients.map((recipient) => recipient?.Name || recipient?.Address).filter(Boolean);
    return names.length ? names.join(', ') : '(unknown sender)';
};
