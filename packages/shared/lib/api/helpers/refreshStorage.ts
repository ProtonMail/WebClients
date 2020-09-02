import { encodeBase64URL } from '../../helpers/string';
import { getItem, setItem, removeItem } from '../../helpers/storage';

const getKey = (UID: string) => {
    return encodeBase64URL(`r-${UID}`);
};

export const setLastRefreshDate = (UID: string, now: Date) => {
    setItem(getKey(UID), `${+now}`);
};

export const getLastRefreshDate = (UID: string) => {
    const oldString = getItem(getKey(UID));
    const parsed = Number.parseInt(oldString || '', 10);
    const date = new Date(parsed);
    return Number.isNaN(+date) ? undefined : date;
};

export const removeLastRefreshDate = (UID: string) => {
    removeItem(getKey(UID));
};
