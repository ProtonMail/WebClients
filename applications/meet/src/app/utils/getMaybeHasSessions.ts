import { readAccountSessions } from '@proton/account/accountSessions/storage';
import { getPersistedSessions } from '@proton/shared/lib/authentication/persistedSessionStorage';

/** Account's session list, when it publishes one, takes precedence over the locally persisted sessions. */
export const getMaybeHasSessions = () => {
    const accountSessions = readAccountSessions();
    return accountSessions ? accountSessions.length > 0 : getPersistedSessions().length > 0;
};
