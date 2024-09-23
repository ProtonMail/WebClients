import { isBefore, isWithinInterval } from 'date-fns';

const CYBER_WEEK_START = new Date(Date.UTC(2023, 10, 27, 9, 0, 0)); // November 27 09:00:00 UTC
const CYBER_WEEK_END = new Date(Date.UTC(2023, 11, 4, 9, 0, 0)); // December 4 09:00:00 UTC
const END_OF_THE_YEAR_START = new Date(Date.UTC(2023, 11, 23, 9, 0, 0)); // December 23 09:00:00 UTC
const END_OF_THE_YEAR_END = new Date(Date.UTC(2024, 0, 3, 9, 0, 0)); // January 3 09:00:00 UTC
export const FREE_DOWNGRADER_LIMIT = new Date(Date.UTC(2023, 9, 1, 0, 0, 0)); // October 1 2023 00:00:00 UTC

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

export const isBlackFridayPeriod = () => {
    const now = new Date();
    return isBefore(now, CYBER_WEEK_START);
};
