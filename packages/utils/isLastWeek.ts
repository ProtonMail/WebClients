/* This helper is inspired from https://github.com/date-fns/date-fns/blob/main/src/isSameWeek/index.ts helper */
import { startOfWeek, subDays } from 'date-fns';

/**
 * The {@link isLastWeek} function options.
 */

/**
 * @name isLastWeek
 * @category Week Helpers
 * @summary Is the given date in the last week?
 *
 * @description
 * Is the given date in the last week?
 *
 * @param dirtyDate - the date to check
 * @param options - an object with options.
 * @returns the date is in the last week
 *
 * @example
 * // If Current date is 03/27/2023
 * // Is 20 March 2023 in the last week?
 * const result = isLastWeek(new Date(2023, 2, 20))
 * //=> true
 *
 * @example
 * // If Current date is 03/27/2023 and if week starts with Monday,
 * // Is 20 March 2023 in the last week?
 * const result = isLastWeek(new Date(2023, 2, 20), {
 *   weekStartsOn: 1
 * })
 * //=> true
 *
 * @example
 * // If Current date is 03/27/2023
 * // Is 27 March 2023 in the last week?
 * const result = isLastWeek(new Date(2023, 2, 27))
 * //=> false
 */

export default function isLastWeek(
    dirtyDate: Date | number,
    options?: { locale?: Locale; weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 }
): boolean {
    const currentDate = new Date();
    const dateStartOfWeek = startOfWeek(currentDate, options);

    const lastWeekStart = subDays(dateStartOfWeek, 7);
    const lastWeekEnd = subDays(lastWeekStart, -6);

    const dateToCheck = new Date(dirtyDate);
    return dateToCheck >= lastWeekStart && dateToCheck <= lastWeekEnd;
}
