import { ForkType, getShouldReAuth } from '@proton/shared/lib/authentication/fork';
import {
    GetActiveSessionType,
    type GetActiveSessionsResult,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { type APP_NAMES, SSO_PATHS } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces';

import type { ReAuthState } from '../../public/ReAuthContainer';
import { type ProduceForkData, SSOType } from '../fork/interface';
import type { Paths } from '../helper';
import type { LocalRedirect } from '../localRedirect';
import { getLoginResult } from './getLoginResult';
import { getProduceForkLoginResult } from './getProduceForkLoginResult';
import type { LoginResult } from './interface';

export const getActiveSessionLoginResult = async ({
    api,
    forkState,
    sessionsResult,
    localRedirect,
    initialSearchParams,
    preAppIntent,
    paths,
}: {
    forkState: ProduceForkData | undefined | null;
    sessionsResult: GetActiveSessionsResult;
    api: Api;
    localRedirect?: LocalRedirect;
    initialSearchParams: URLSearchParams;
    preAppIntent?: APP_NAMES;
    paths: Paths;
}): Promise<LoginResult> => {
    const autoSignIn = sessionsResult.type === GetActiveSessionType.AutoPick;

    if (forkState?.type === SSOType.Proton) {
        const forkParameters = forkState.payload.forkParameters;

        if (forkParameters.forkType === ForkType.SIGNUP) {
            return {
                type: 'signup',
                pathname: paths.signup,
                payload: null,
            };
        }

        if (forkParameters.forkType === ForkType.LOGIN) {
            return {
                type: 'login',
                pathname: paths.login,
                payload: null,
            };
        }

        if (autoSignIn && forkParameters.forkType === undefined) {
            if (getShouldReAuth(forkParameters, sessionsResult.session)) {
                const reAuthState: ReAuthState = {
                    session: sessionsResult.session,
                    reAuthType: forkParameters.promptType,
                };
                return {
                    type: 'reauth',
                    payload: reAuthState,
                    pathname: paths.reauth,
                };
            }

            return getProduceForkLoginResult({
                api,
                data: {
                    type: SSOType.Proton,
                    payload: { forkParameters },
                },
                session: sessionsResult.session,
                paths,
            });
        }

        return {
            type: 'sessions-switcher',
            payload: null,
            pathname: sessionsResult.sessions.length >= 1 ? SSO_PATHS.SWITCH : paths.login,
        };
    }

    if (initialSearchParams.get('prompt') === 'login') {
        return {
            type: 'login',
            pathname: paths.login,
            payload: null,
        };
    }

    if (autoSignIn) {
        return getLoginResult({
            api,
            session: sessionsResult.session,
            localRedirect,
            initialSearchParams,
            forkState: undefined,
            preAppIntent,
            paths,
        });
    }

    return {
        type: 'sessions-switcher',
        payload: null,
        pathname: sessionsResult.sessions.length >= 1 ? SSO_PATHS.SWITCH : paths.login,
    };
};
