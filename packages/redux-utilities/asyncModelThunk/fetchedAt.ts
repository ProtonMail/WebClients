import { DAY, MINUTE } from '@proton/shared/lib/constants';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

// By default, the client re-fetches models after this expiry date. If the cache type is `stale` or `stale-refetch`
// and this expiration date is passed, it won't use the stale value.
export const defaultExpiry = 5 * DAY;
export const defaultLongExpiry = 90 * DAY;

export const getMinuteJitter = () => {
    return randomIntFromInterval(0, 5) * MINUTE;
};

export const getFetchedAt = () => {
    return Date.now() + getMinuteJitter();
};

export const isExpired = (fetchedAt: number | undefined, expiry: number) => {
    return Date.now() - (fetchedAt || 0) >= expiry;
};

// Can be any value. It relies on the ephemeral meta field never being stored
export const getFetchedEphemeral = () => {
    return true;
};
