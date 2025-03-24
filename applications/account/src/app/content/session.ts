import type { OnLoginCallbackArguments } from '@proton/components';
import type { ActiveSession } from '@proton/shared/lib/authentication/persistedSessionHelper';

export const addSession = (previousSessions: ActiveSession[] | undefined, session: OnLoginCallbackArguments) => {
    if (!previousSessions) {
        return undefined;
    }
    const sessionExists = previousSessions.some((previousSession) => {
        return previousSession.remote.LocalID === session.data.localID;
    });
    if (sessionExists) {
        return previousSessions;
    }
    const { localID, User, UID, persistedSession } = session.data;
    const activeSession: ActiveSession = {
        remote: {
            LocalID: localID,
            UID,
            DisplayName: User.DisplayName,
            Username: User.Name,
            UserID: User.ID,
            PrimaryEmail: User.Email,
        },
        persisted: persistedSession,
    };
    return [...previousSessions, activeSession];
};
