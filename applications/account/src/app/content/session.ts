import type { OnLoginCallbackArguments } from '@proton/components';
import type { ActiveSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getPersistedSession } from '@proton/shared/lib/authentication/persistedSessionStorage';

export const addSession = (previousSessions: ActiveSession[] | undefined, session: OnLoginCallbackArguments) => {
    if (!previousSessions) {
        return undefined;
    }
    const sessionExists = previousSessions.some((previousSession) => {
        return previousSession.remote.LocalID === session.data.LocalID;
    });
    if (sessionExists) {
        return previousSessions;
    }
    const persistedSession = getPersistedSession(session.data.LocalID);
    if (!persistedSession) {
        return previousSessions;
    }
    const { LocalID, User, UID } = session.data;
    const activeSession: ActiveSession = {
        remote: {
            LocalID,
            UID,
            DisplayName: User.DisplayName,
            Username: User.Name,
            UserID: User.ID,
            PrimaryEmail: User.Email,
        },
        persisted: {
            ...persistedSession,
            localID: LocalID,
        },
    };
    return [...previousSessions, activeSession];
};
