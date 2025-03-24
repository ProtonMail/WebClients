import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';

const LAST_USED_LOCAL_ID_KEY = 'llid';

export const setLastUsedLocalID = (localID: number | undefined) => {
    if (localID !== undefined) {
        setItem(LAST_USED_LOCAL_ID_KEY, localID.toString());
    }
};

/** Returns the last used local ID or -1 if it's not set */
export const getLastUsedLocalID = () => {
    const lastUsedLocalID = parseInt(getItem(LAST_USED_LOCAL_ID_KEY) ?? '', 10);
    return !isNaN(lastUsedLocalID) ? lastUsedLocalID : -1;
};

export const removeLastUsedLocalID = () => {
    removeItem(LAST_USED_LOCAL_ID_KEY);
};
