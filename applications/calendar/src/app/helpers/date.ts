/**
 * Given a date, if we are to display a single time zone offset for the whole day,
 * we pick the UTC offset at noon. DST changes usually happens at 2:00,
 * so the offset at noon is more representative of the offset of the day.
 */
export const getNoonDateForTimeZoneOffset = (date: Date) => {
    const noonDate = new Date(+date);
    noonDate.setHours(12);

    return noonDate;
};
