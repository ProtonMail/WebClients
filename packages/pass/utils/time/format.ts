import { format } from 'date-fns';

export const getFormattedDateFromTimestamp = (timestamp: number) => {
    return `${format(new Date(timestamp * 1000), 'dd MMM yyyy, HH:mmaaa')}`;
};

export const getFormattedDayFromTimestamp = (timestamp: number) => {
    return format(new Date(timestamp * 1000), 'dd MMM yyyy');
};
