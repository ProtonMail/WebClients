// There is already a help for getting the noon date,
// getNoonDateForTimeZoneOffset in applications/calendar/src/app/helpers/date
// but that causes problems because it simply changes the hour of the given day
// to 12 rather than taking timezones into account. This function relies on
// knowing whether the time is at the start or end of the day and add or subtracts
// 12 hours as appropriate.
const HOUR = 60 * 60 * 1000;

export const getNoonDate = (date: Date, isStartOfDay: boolean) => {
    const time = date.getTime();
    // This isn't precise, as end of day is 23:59:59, but it's close enough.
    const offset = 12 * (isStartOfDay ? HOUR : -HOUR);

    return new Date(time + offset);
};
