import { DAY } from '@proton/shared/lib/constants';

import { encodeBase64URL, uint8ArrayToString } from '../../helpers/encoding';
import { getItem, removeItem, setItem } from '../../helpers/storage';
import { isNumber } from '../../helpers/validators';

const prefix = 'r-';

const getKey = (UID: string) => {
    return encodeBase64URL(`${prefix}${UID}`);
};

export const setLastRefreshDate = (UID: string, now: Date) => {
    setItem(getKey(UID), `${+now}`);
};

const getParsedValue = (value: string | null | undefined) => {
    // 13 is the (current) length of the number of milliseconds since epoch
    if (!value || value.length !== 13 || !isNumber(value)) {
        return;
    }
    const parsed = Number.parseInt(value || '', 10);
    const date = new Date(parsed);
    return Number.isNaN(+date) ? undefined : date;
};

export const getLastRefreshDate = (UID: string) => {
    return getParsedValue(getItem(getKey(UID)));
};

export const removeLastRefreshDate = (UID: string) => {
    removeItem(getKey(UID));
};

interface LastRefreshDate {
    key: string;
    value: Date;
}

export const getLastRefreshDates = (): LastRefreshDate[] => {
    return Object.entries(localStorage).reduce<LastRefreshDate[]>((acc, [key, value]) => {
        try {
            const parsedValue = getParsedValue(value);
            if (parsedValue === undefined) {
                return acc;
            }
            const parsedKey = uint8ArrayToString(Uint8Array.fromBase64(key, { alphabet: 'base64url' }));
            if (!parsedKey.startsWith(prefix)) {
                return acc;
            }
            acc.push({ key, value: parsedValue });
        } catch (e) {
            // ignore
        }
        return acc;
    }, []);
};

export const cleanupLastRefreshDate = () => {
    const lastRefreshDates = getLastRefreshDates();
    const now = Date.now();
    lastRefreshDates
        .filter((item) => {
            return now - +item.value > 1 * DAY;
        })
        .forEach((item) => {
            removeItem(item.key);
        });
};
