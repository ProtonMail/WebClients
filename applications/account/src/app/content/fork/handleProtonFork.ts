import type { AuthSession } from '@proton/components/containers/login/interface';
import { getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import {
    ForkType,
    type ProduceForkParametersFull,
    getProduceForkParameters,
    getRequiredForkParameters,
} from '@proton/shared/lib/authentication/fork';
import {
    type GetActiveSessionsResult,
    getActiveSessions,
    resumeSession,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { Api } from '@proton/shared/lib/interfaces';

import { type ProtonForkData, SSOType } from '../actions/forkInterface';
import { getProduceForkLoginResult } from '../actions/getProduceForkLoginResult';
import type { LoginResult } from '../actions/interface';
import type { Paths } from '../helper';

type ProtonForkResult =
    | { type: 'invalid' }
    | { type: 'login'; payload: LoginResult; fork: ProtonForkData }
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
    // A switch fork type is an explicit request for the account switcher, so it takes priority over
    // silently resuming the requested session. getActiveSessionLoginResult owns that routing, and it
    // applies the same fork type condition before auto-signing in.
    if (localID === undefined || forkParameters.forkType === ForkType.SWITCH) {
        const activeSessionsResult = await getActiveSessions({ api, email: forkParameters.email, localID });
        return handleActiveSessions(activeSessionsResult, forkParameters);
    }

    try {
        // Resume session and produce the fork
        const resumedSessionResult = await resumeSession({ api, localID });
        const session: AuthSession = { data: resumedSessionResult, flow: 'auto-resume' };

        const fork: ProtonForkData = { type: SSOType.Proton, payload: { forkParameters } };
        const loginResult = await getProduceForkLoginResult({
            api,
            session,
            data: fork,
            paths,
        });

        return { type: 'login', payload: loginResult, fork };
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
