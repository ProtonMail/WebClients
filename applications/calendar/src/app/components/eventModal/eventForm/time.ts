import { convertZonedDateTimeToUTC, toUTCDate } from '@proton/shared/lib/date/timezone';
import { DateTimeModel } from '@proton/shared/lib/interfaces/calendar';

export const getDateTimeState = (utcDate: Date, tzid: string): DateTimeModel => {
    return {
        // These should be local dates since the mini calendar and time input uses that.
        date: new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(), 0, 0),
        // Assuming there is no timezone that has a DST shift at this date
        time: new Date(2000, 0, 1, utcDate.getUTCHours(), utcDate.getUTCMinutes()),
        tzid,
    };
};

export const getDateTime = ({ date, time }: DateTimeModel) => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes());
};

export const getTimeInUtc = ({ date, time, tzid }: DateTimeModel, isAllDay: boolean) => {
    if (isAllDay) {
        return toUTCDate({
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
        });
    }
    return toUTCDate(
        convertZonedDateTimeToUTC(
            {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate(),
                hours: time.getHours(),
                minutes: time.getMinutes(),
                seconds: 0,
            },
            tzid
        )
    );
};
