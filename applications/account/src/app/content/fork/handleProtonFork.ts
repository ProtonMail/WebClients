import type { AuthSession } from '@proton/components/containers/login/interface';
import { getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import {
    type ProduceForkParametersFull,
    getProduceForkParameters,
    getRequiredForkParameters,
    getShouldReAuth,
} from '@proton/shared/lib/authentication/fork';
import { type ProtonForkData, SSOType } from '@proton/shared/lib/authentication/fork/interface';
import {
    type GetActiveSessionsResult,
    getActiveSessions,
    getActiveSessionsResult,
    resumeSession,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { Api } from '@proton/shared/lib/interfaces';

import { getProduceForkLoginResult } from '../actions/getProduceForkLoginResult';
import type { LoginResult } from '../actions/interface';
import type { Paths } from '../helper';

type ProtonForkResult =
    | { type: 'invalid' }
    | { type: 'login'; payload: LoginResult }
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

export const handleProtonFork = async ({ api, paths }: { api: Api; paths: Paths }): Promise<ProtonForkResult> => {
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
        const resumedSessionResult = await resumeSession({ api, localID });
        const session: AuthSession = { data: resumedSessionResult };

        if (getShouldReAuth(forkParameters, session)) {
            const activeSessionsResult = await getActiveSessionsResult({
                api,
                localID: resumedSessionResult.localID,
                session: resumedSessionResult,
            });
            return await handleActiveSessions(activeSessionsResult, forkParameters);
        }

        const loginResult = await getProduceForkLoginResult({
            api,
            session,
            data: { type: SSOType.Proton, payload: { forkParameters } },
            paths,
        });

        return { type: 'login', payload: loginResult };
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
