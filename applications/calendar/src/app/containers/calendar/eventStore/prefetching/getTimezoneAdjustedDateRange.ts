import type { DateTuple } from '@proton/components/components/miniCalendar/interface';
import { convertZonedDateTimeToUTC, fromUTCDate, toUTCDate } from '@proton/shared/lib/date/timezone';

export const getTimezoneAdjustedDateRange = (dateRange: [Date, Date], tzid: string): DateTuple => [
    toUTCDate(convertZonedDateTimeToUTC(fromUTCDate(dateRange[0]), tzid)),
    toUTCDate(convertZonedDateTimeToUTC(fromUTCDate(dateRange[1]), tzid)),
];
