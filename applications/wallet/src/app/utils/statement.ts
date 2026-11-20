import { convertZonedDateTimeToUTC, toUTCDate } from '@proton/shared/lib/date/timezone';
import { getDeviceTimeZone } from '@proton/shared/lib/date/zonedTime';

export const getDeviceStartOfDay = (day: Date) =>
    toUTCDate(
        convertZonedDateTimeToUTC(
            {
                year: day.getFullYear(),
                month: day.getMonth() + 1,
                day: day.getDate(),
                hours: 0,
                minutes: 0,
                seconds: 0,
            },
            getDeviceTimeZone(),
            { moveAmbiguousForward: false }
        )
    );
