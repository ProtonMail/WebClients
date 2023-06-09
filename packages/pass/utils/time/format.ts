import { format } from '@proton/shared/lib/date-fns-utc';

export const getFormattedDateFromTimestamp = (timestamp: number) => {
    return `${format(new Date(timestamp * 1000), 'dd MMM yyyy, HH:mmaaa')} UTC`;
};

export const getFormattedDayFromTimestamp = (timestamp: number) => {
    return format(new Date(timestamp * 1000), 'dd MMM yyyy');
};
