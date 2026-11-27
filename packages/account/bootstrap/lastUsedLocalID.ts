import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';

import { readAccountSessions } from '../accountSessions/storage';

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

/**
 * A local id that can't be resumed is otherwise forked from account, which costs a round trip through it.
 * When account doesn't list the local id either it has no session there to fork, so the last used session
 * is resumed in its place instead. Only as long as account still lists that one, so that it never falls
 * back to a session account no longer has.
 */
export const getFallbackLocalID = (localID: number) => {
    const accountSessions = readAccountSessions();
    // Without the cookie it's not known which sessions account has, so it's left to account to decide.
    if (!accountSessions) {
        return;
    }
    const hasLocalID = (value: number) => accountSessions.some((session) => session.localID === value);
    const lastUsedLocalID = getLastUsedLocalID();
    if (hasLocalID(localID) || !hasLocalID(lastUsedLocalID)) {
        return;
    }
    return lastUsedLocalID;
};
