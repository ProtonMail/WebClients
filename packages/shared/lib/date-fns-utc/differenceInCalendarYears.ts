/**
 * Same result as date-fns `differenceInCalendarYears` with `in: utc`, which is about 8x slower.
 */
const differenceInCalendarYears = (left: Date, right: Date) => left.getUTCFullYear() - right.getUTCFullYear();

export default differenceInCalendarYears;
