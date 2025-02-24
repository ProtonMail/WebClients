import { getApiError, getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import {
    type ProduceForkParametersFull,
    getProduceForkParameters,
    getRequiredForkParameters,
    getShouldReAuth,
} from '@proton/shared/lib/authentication/fork';
import { type ProtonForkData, SSOType } from '@proton/shared/lib/authentication/fork/interface';
import type { GetActiveSessionsResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import {
    GetActiveSessionType,
    getActiveSessions,
    getActiveSessionsData,
    resumeSession,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getPersistedSessions } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { Api } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import type { AppSwitcherState } from '../../public/AppSwitcherContainer';
import { getOrganization } from '../../public/organization';
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
        const session = await resumeSession({ api, localID });

        if (getShouldReAuth(forkParameters, session)) {
            const persistedSessions = getPersistedSessions();
            const sessions = await getActiveSessionsData({ api: getUIDApi(session.UID, api), persistedSessions });
            const activeSessionsResult = { session, sessions, type: GetActiveSessionType.AutoPick };
            return await handleActiveSessions(activeSessionsResult, forkParameters);
        }

        try {
            const loginResult = await getProduceForkLoginResult({
                api,
                session,
                data: { type: SSOType.Proton, payload: { forkParameters } },
                paths,
            });

            return { type: 'login', payload: loginResult };
        } catch (e: any) {
            const { code, message } = getApiError(e);
            if (
                [API_CUSTOM_ERROR_CODES.SSO_APPLICATION_INVALID, API_CUSTOM_ERROR_CODES.APPLICATION_BLOCKED].some(
                    (errorCode) => errorCode === code
                )
            ) {
                const organization = await getOrganization({ session, api }).catch(noop);
                const appSwitcherState: AppSwitcherState = {
                    session: { ...session, Organization: organization },
                    error: {
                        type: 'unsupported-app',
                        app: forkParameters.app,
                        message,
                    },
                };

                return {
                    type: 'login',
                    payload: {
                        type: 'app-switcher',
                        location: { pathname: paths.appSwitcher },
                        payload: appSwitcherState,
                    },
                };
            }
            throw e;
        }
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
