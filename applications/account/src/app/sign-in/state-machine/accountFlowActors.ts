import { fromPromise } from 'xstate';

import { getUser } from '@proton/shared/lib/authentication/getUser';

import type { AuthSession } from '../../content/authSession';
import { getAccountKeySalts } from '../auth/accountData';
import type { SignInActorServices } from './signInActors';
import type { SignInAuthState } from './signInAuthState';

/** The account data the unlock steps need; loaded before them. */
export const getUserAndSalts = (auth: SignInAuthState) => {
    const { user, salts } = auth.account;
    if (!user || !salts) {
        throw new Error('Missing account data');
    }
    return { user, salts };
};

/** The actors both account flows use: loading the account and handing the session to the app. */
export const createAccountFlowActors = (services: SignInActorServices) => {
    const { api } = services;
    return {
        loadAccount: fromPromise<Required<Pick<SignInAuthState['account'], 'user' | 'salts'>>>(async () => {
            const [user, salts] = await Promise.all([getUser(api), getAccountKeySalts(api)]);
            return { user, salts };
        }),
        /** Every way to `completing` sets the session; checked here, so a missing one fails the flow like a request. */
        completeSignIn: fromPromise<void, { session: AuthSession | undefined }>(async ({ input }) => {
            if (!input.session) {
                throw new Error('Missing session');
            }
            await services.onLogin(input.session);
        }),
    };
};
