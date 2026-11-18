import { DAY } from '../constants';

/**
 * Same result as date-fns `differenceInCalendarDays` with `in: utc`, which is about 10x slower. UTC days always last
 * exactly `DAY` milliseconds, so counting day numbers is enough.
 */
const differenceInCalendarDays = (left: Date, right: Date) => Math.floor(+left / DAY) - Math.floor(+right / DAY);

export default differenceInCalendarDays;
