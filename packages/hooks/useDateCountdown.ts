import { useState } from 'react';

import { differenceInMilliseconds } from 'date-fns';

import { DAY, HOUR, MINUTE, SECOND } from '@proton/shared/lib/constants';

import useInterval from './useInterval';

const EVERY_SECOND = SECOND;

export interface DateCountdown {
    /**
     * Difference between the two dates in milliseconds.
     */
    diff: number;
    /**
     * Number of days remaining.
     */
    days: number;
    /**
     * Number of hours remaining.
     */
    hours: number;
    /**
     * Number of minutes remaining.
     */
    minutes: number;
    /**
     * Number of seconds remaining.
     */
    seconds: number;
    /**
     * Whether the countdown is expired.
     * `true` if the `end` date is in the past.
     */
    expired: boolean;
}

export interface DateCountdownOptions {
    interval?: number;
}

const useDateCountdown = (
    /**
     * The date the countdown counts down to.
     */
    expiry: Date,
    {
        /**
         * Number of milliseconds between updates
         */
        interval = EVERY_SECOND,
    }: DateCountdownOptions = {}
): DateCountdown => {
    const [now, setNow] = useState(() => new Date());

    useInterval(() => setNow(new Date()), interval);

    const diff = differenceInMilliseconds(expiry, now);
    const expired = diff < 0;
    const absoluteDiff = Math.abs(diff);
    const days = Math.floor(absoluteDiff / DAY);
    const hours = Math.floor((absoluteDiff % DAY) / HOUR);
    const minutes = Math.floor((absoluteDiff % HOUR) / MINUTE);
    const seconds = Math.floor((absoluteDiff % MINUTE) / SECOND);

    return { expired, diff, days, hours, minutes, seconds };
};

export default useDateCountdown;
