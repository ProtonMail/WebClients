import type { AuthSession } from '@proton/components/containers/login/interface';
import { getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import {
    type ProduceForkParametersFull,
    getProduceForkParameters,
    getRequiredForkParameters,
    getShouldReAuth,
} from '@proton/shared/lib/authentication/fork';
import type { GetActiveSessionsResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import {
    GetActiveSessionType,
    getActiveSessions,
    getActiveSessionsData,
    resumeSession,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getPersistedSessions } from '@proton/shared/lib/authentication/persistedSessionStorage';
import type { Api } from '@proton/shared/lib/interfaces';

import type { ProtonForkData } from './interface';
import { SSOType } from './interface';

type ProtonForkResult =
    | { type: 'invalid' }
    | { type: 'produce'; payload: { fork: ProtonForkData; session: AuthSession } }
    | { type: 'switch'; payload: { fork: ProtonForkData; activeSessionsResult: GetActiveSessionsResult } };

const handleActiveSessions = async (
    activeSessionsResult: GetActiveSessionsResult,
    forkParameters: ProduceForkParametersFull
) => {
    return {
        type: 'switch',
        payload: { fork: { type: SSOType.Proton, payload: { forkParameters } }, activeSessionsResult },
    } as const;
};

const handleProduceFork = async (session: AuthSession, forkParameters: ProduceForkParametersFull) => {
    return {
        type: 'produce',
        payload: { fork: { type: SSOType.Proton, payload: { forkParameters } }, session },
    } as const;
};

export const handleProtonFork = async ({ api }: { api: Api }): Promise<ProtonForkResult> => {
    const searchParams = new URLSearchParams(window.location.search);
    const forkParameters = getProduceForkParameters(searchParams);
    if (!getRequiredForkParameters(forkParameters)) {
        return {
            type: 'invalid',
        } as const;
    }

    const localID = forkParameters.localID;
    if (localID === undefined) {
        const activeSessionsResult = await getActiveSessions({ api, email: forkParameters.email });
        return handleActiveSessions(activeSessionsResult, forkParameters);
    }

    try {
        // Resume session and produce the fork
        const session = await resumeSession({ api, localID });

        if (getShouldReAuth(forkParameters, session)) {
            const persistedSessions = getPersistedSessions();
            const sessions = await getActiveSessionsData({ api: getUIDApi(session.UID, api), persistedSessions });
            const activeSessionsResult = { session, sessions, type: GetActiveSessionType.AutoPick };
            return await handleActiveSessions(activeSessionsResult, forkParameters);
        }

        return await handleProduceFork(session, forkParameters);
    } catch (e: any) {
        if (e instanceof InvalidPersistentSessionError || getIs401Error(e)) {
            const activeSessionsResult = await getActiveSessions({
                api,
                email: forkParameters.email,
                localID,
            });
            return handleActiveSessions(activeSessionsResult, forkParameters);
        }
        throw e;
    }
};
