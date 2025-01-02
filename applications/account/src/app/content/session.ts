import type { OnLoginCallbackArguments } from '@proton/components';
import type { ActiveSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getPersistedSession } from '@proton/shared/lib/authentication/persistedSessionStorage';

export const addSession = (previousSessions: ActiveSession[] | undefined, session: OnLoginCallbackArguments) => {
    if (!previousSessions) {
        return undefined;
    }
    const sessionExists = previousSessions.some((previousSession) => {
        return previousSession.remote.LocalID === session.LocalID;
    });
    if (sessionExists) {
        return previousSessions;
    }
    const persisted = getPersistedSession(session.LocalID);
    if (!persisted) {
        return previousSessions;
    }
    const { LocalID, User, UID } = session;
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
            ...persisted,
            localID: LocalID,
        },
    };
    return [...previousSessions, activeSession];
};
