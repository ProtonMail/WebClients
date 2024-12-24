import { DAY, MINUTE } from '@proton/shared/lib/constants';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

// By default, the client re-fetches models after this expiry date. This is because it doesn't trust the event loop to give
// the client up-to-date values. For example in structural interface updates or when manual DB modifications are performed.
export const defaultExpiry = 2 * DAY;
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
