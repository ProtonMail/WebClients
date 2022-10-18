import { isWithinInterval } from 'date-fns';

export const CYBER_WEEK_START = new Date(2022, 10, 28, 6, 0, 0);
export const CYBER_WEEK_END = new Date(2022, 11, 5, 6, 0, 0);
export const END_OF_THE_YEAR_START = new Date(2022, 11, 5, 6, 0, 0);
export const END_OF_THE_YEAR_END = new Date(2022, 11, 31, 6, 0, 0);
export const FREE_DOWNGRADER_LIMIT = new Date(2022, 9, 1, 0, 0, 0); // October 1 2022 00:00:00 UTC

/**
 * After Nov 28 2022 6:00 AM UTC and before Dec 5 2022 6:00 AM UTC
 * @returns {boolean} true if the offer is available for the current date
 */
export const isCyberWeekPeriod = () => {
    const now = new Date();
    return isWithinInterval(now, { start: CYBER_WEEK_START, end: CYBER_WEEK_END });
};

/**
 * After Dec 5 2022 6:00 AM UTC and before Jan 2 2023 6:00 AM UTC
 * @returns {boolean} true if the offer is available for the current date
 */
export const isEndOfYearPeriod = () => {
    const now = new Date();
    return isWithinInterval(now, { start: END_OF_THE_YEAR_START, end: END_OF_THE_YEAR_END });
};
