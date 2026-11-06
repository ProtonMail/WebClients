import { fromPromise } from 'xstate';

import type { GetActiveSessionsResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';

import type { AuthSession } from '../authSession';
import { type OAuthPartnersCallbackState, type OAuthPartnersInitiateState, handleOAuthPartners } from './oauthPartners';

/** The partner's account is already a Proton account, which signs in with its Proton credentials. */
export interface ExistingAccount {
    sessions: GetActiveSessionsResult;
    email: string;
}

export interface OAuthPartnersServices {
    unauthenticatedApi: UnauthenticatedApi;
    login: (session: AuthSession) => Promise<unknown>;
}

export const createOAuthPartnersActors = (services: OAuthPartnersServices) => ({
    /** Signs in, or returns the Proton account the partner's account already is. */
    signIn: fromPromise<ExistingAccount | undefined, OAuthPartnersInitiateState | OAuthPartnersCallbackState>(
        async ({ input: state }) => {
            const result = await handleOAuthPartners({ state, unauthenticatedApi: services.unauthenticatedApi });
            if (result.type === 'existing-account') {
                return result.payload;
            }
            await services.login({ data: result.payload, flow: 'login' });
        }
    ),
});

export type OAuthPartnersActors = ReturnType<typeof createOAuthPartnersActors>;
