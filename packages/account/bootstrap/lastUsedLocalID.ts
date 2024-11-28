import { getItem, setItem } from '@proton/shared/lib/helpers/storage';

const LAST_USED_LOCAL_ID_KEY = 'llid';

export const setLastUsedLocalID = (localID: number | undefined) => {
    if (localID !== undefined) {
        setItem(LAST_USED_LOCAL_ID_KEY, localID.toString());
    }
};

export const getLastUsedLocalID = () => {
    const lastUsedLocalID = parseInt(getItem(LAST_USED_LOCAL_ID_KEY) ?? '', 10);
    return !isNaN(lastUsedLocalID) ? lastUsedLocalID : -1;
};
