import { removeLastUsedLocalID, setLastUsedLocalID } from '@proton/account/bootstrap/lastUsedLocalID';
import type { PersistedSession } from '@proton/shared/lib/authentication/SessionInterface';
import type { AuthenticationStore } from '@proton/shared/lib/authentication/createAuthenticationStore';
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

const pickSession = (session: PersistedSession, sessions: PersistedSession[], api: Api) => {
    setLastUsedLocalID(session.localID);

    // Only one session at a time is supported, because the account switcher isn't supported.
    removeSessions({ sessions: sessions.filter((otherSession) => otherSession !== session), api });

    return session;
};

export const initStandaloneSession = ({
    authentication,
    api,
}: {
    authentication: AuthenticationStore;
    api: Api;
}): PersistedSession | undefined => {
    const sessions = getPersistedSessions().sort((a, b) => {
        return b.persistedAt - a.persistedAt;
    });

    if (authentication.UID) {
        const session = sessions.find((session) => session.UID === authentication.UID);
        if (session) {
            return pickSession(session, sessions, api);
        }
    }

    if (sessions[0]) {
        return pickSession(sessions[0], sessions, api);
    }

    removeLastUsedLocalID();
    return;
};
