import { getUnixTime, subMonths, subYears } from 'date-fns';

import { TIME_PERIOD } from '../interface';

export const getStartTimeFromTimePeriod = (importPeriod: TIME_PERIOD): number | undefined => {
    const now = new Date();
    let result: Date | undefined;

    switch (importPeriod) {
        case TIME_PERIOD.BIG_BANG:
            result = undefined;
            break;
        case TIME_PERIOD.LAST_YEAR:
            result = subYears(now, 1);
            break;
        case TIME_PERIOD.LAST_6_MONTHS:
            result = subMonths(now, 6);
            break;
        case TIME_PERIOD.LAST_3_MONTHS:
            result = subMonths(now, 3);
            break;
        case TIME_PERIOD.LAST_MONTH:
            result = subMonths(now, 1);
            break;
        default:
            throw new Error('importPeriod should be specified');
    }

    return result ? getUnixTime(result) : undefined;
};
