import type {
    ActiveSession,
    GetActiveSessionsResult,
    ResumedSessionResult,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { GetActiveSessionType, resumeSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import type { SignupParameters2 } from './interface';

export const getSessionsData = async ({
    signupParameters,
    activeSessions,
    onGetActiveSessions,
    api,
}: {
    signupParameters: SignupParameters2;
    activeSessions?: ActiveSession[];
    onGetActiveSessions?: () => Promise<GetActiveSessionsResult>;
    api: Api;
}): Promise<{
    sessions: ActiveSession[];
    session: ResumedSessionResult | undefined;
}> => {
    // If it's porkbun, we let the session get autopicked through the `email` query parameter which is used by onGetActiveSessions
    if (signupParameters.invite?.type === 'porkbun') {
        const activeSessionsResult = await onGetActiveSessions?.();
        if (activeSessionsResult?.type === GetActiveSessionType.AutoPick) {
            return {
                sessions: activeSessionsResult.sessions,
                session: activeSessionsResult.session,
            };
        }
        return {
            sessions: activeSessionsResult?.sessions || [],
            session: undefined,
        };
    }

    if (signupParameters.localID === -1) {
        return {
            sessions: [],
            session: undefined,
        };
    }

    let { sessions, session } = await (async () => {
        if (activeSessions?.length) {
            return {
                sessions: activeSessions,
                session: undefined,
            };
        }

        const activeSessionsResult = await onGetActiveSessions?.();
        if (activeSessionsResult) {
            return {
                sessions: activeSessionsResult.sessions,
                session: activeSessionsResult.session,
            };
        }

        return {
            sessions: [],
            session: undefined,
        };
    })();

    if (!session && sessions.length) {
        const firstSession = sessions[0];
        session = await resumeSession({
            api,
            localID: firstSession.persisted.localID,
        }).catch(noop);
    }

    return {
        sessions,
        session,
    };
};
