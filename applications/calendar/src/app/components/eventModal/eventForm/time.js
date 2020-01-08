import { convertZonedDateTimeToUTC, toUTCDate } from 'proton-shared/lib/date/timezone';

export const getDateTimeState = (utcDate, tzid) => {
    return {
        // These should be local dates since the mini calendar and time input uses that.
        date: new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(), 0, 0),
        // Assuming there is no timezone that has a DST shift at this date
        time: new Date(2000, 0, 1, utcDate.getUTCHours(), utcDate.getUTCMinutes()),
        tzid
    };
};

export const getTimeInUtc = ({ date, time, tzid }, isAllDay) => {
    if (isAllDay) {
        return toUTCDate({
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate()
        });
    }
    return toUTCDate(
        convertZonedDateTimeToUTC(
            {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate(),
                hours: time.getHours(),
                minutes: time.getMinutes()
            },
            tzid
        )
    );
};
