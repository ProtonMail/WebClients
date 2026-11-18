import differenceInCalendarDays from './differenceInCalendarDays';

/**
 * Unlike date-fns differenceInCalendarWeeks, this counts whole 7-day spans between the two days rather than week
 * boundaries crossed.
 */
const differenceInCalendarWeeks = (left: Date, right: Date) => Math.floor(differenceInCalendarDays(left, right) / 7);

export default differenceInCalendarWeeks;
