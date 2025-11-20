import { addHours, set, setMinutes } from 'date-fns';

import { convertTimestampToTimezone, toLocalDate } from '@proton/shared/lib/date/timezone';

export const roundToNextHalfHour = (date: Date): Date => {
    const minutes = date.getMinutes();

    const normalized = set(date, {
        seconds: 0,
        milliseconds: 0,
    });

    return minutes < 30 ? setMinutes(normalized, 30) : addHours(setMinutes(normalized, 0), 1);
};

export const fromTimestampToUTCDate = (date: number, timezone: string) => {
    return toLocalDate(convertTimestampToTimezone(date, timezone));
};
