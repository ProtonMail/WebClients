import { removeLastUsedLocalID, setLastUsedLocalID } from '@proton/account/bootstrap/lastUsedLocalID';
import type { PersistedSession } from '@proton/shared/lib/authentication/SessionInterface';
import { clearSession } from '@proton/shared/lib/authentication/handleLogoutFromURL';
import { getPersistedSessions } from '@proton/shared/lib/authentication/persistedSessionStorage';
import type { Api } from '@proton/shared/lib/interfaces';

export const removeSessions = ({
    sessions = getPersistedSessions(),
    api,
}: {
    sessions?: PersistedSession[];
    api: Api;
}) => {
    sessions.forEach((session) => {
        clearSession({ session, api, revokeSession: true });
    });
};

export const initStandaloneSession = ({ api }: { api: Api }): PersistedSession | undefined => {
    const [session, ...rest] = getPersistedSessions();
    // Only one session at a time is supported, because the account switcher isn't supported.
    removeSessions({ sessions: rest, api });
    if (session) {
        // Set the last used local ID so that it's attempted to be resumed
        setLastUsedLocalID(session.localID);
    } else {
        removeLastUsedLocalID();
    }
    return session;
};
