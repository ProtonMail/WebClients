import { getAppHref } from '@proton/shared/lib/apps/helper';
import { ForkType, getShouldReAuth } from '@proton/shared/lib/authentication/fork';
import { type ProduceForkData, SSOType } from '@proton/shared/lib/authentication/fork/interface';
import {
    GetActiveSessionType,
    type GetActiveSessionsResult,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { type APP_NAMES, SSO_PATHS } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces';

import type { OAuthPartnersInitiateState } from '../../public/OAuthPartnersContainer';
import type { ReAuthState } from '../../public/ReAuthContainer';
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
                location: { pathname: paths.signup },
                payload: null,
            };
        }

        if (forkParameters.forkType === ForkType.LOGIN) {
            return {
                type: 'login',
                location: { pathname: paths.login },
                payload: null,
            };
        }

        // The oauth partner flow is only used in case there are no valid sessions that already exist in proton
        // Otherwise, a proton session takes precedence
        if (forkParameters.partnerId && !sessionsResult.sessions.length) {
            const payload: OAuthPartnersInitiateState = {
                type: 'initiate',
                payload: {
                    forkData: forkState,
                },
            };
            return {
                type: 'oauth-partners',
                payload,
                location: { pathname: SSO_PATHS.OAUTH_PARTNERS },
            };
        }

        if (!sessionsResult.sessions.length && forkParameters.unauthenticatedReturnUrl && preAppIntent) {
            const url = new URL(getAppHref(forkParameters.unauthenticatedReturnUrl, preAppIntent));
            return {
                type: 'done',
                payload: {
                    url,
                },
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
                    location: { pathname: paths.reauth },
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
            location: { pathname: sessionsResult.sessions.length >= 1 ? SSO_PATHS.SWITCH : paths.login },
        };
    }

    if (initialSearchParams.get('prompt') === 'login') {
        return {
            type: 'login',
            location: { pathname: paths.login, search: initialSearchParams.toString() },
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
        location: { pathname: sessionsResult.sessions.length >= 1 ? SSO_PATHS.SWITCH : paths.login },
    };
};
