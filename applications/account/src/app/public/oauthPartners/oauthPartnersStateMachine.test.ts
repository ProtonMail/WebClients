import { createActor, fromPromise, waitFor } from 'xstate';

import type { GetActiveSessionsResult } from '@proton/shared/lib/authentication/persistedSessionHelper';

import type { OAuthPartnersCallbackState } from './oauthPartners';
import type { ExistingAccount } from './oauthPartnersActors';
import { type OAuthPartnersEmitted, oauthPartnersStateMachine } from './oauthPartnersStateMachine';

const state: OAuthPartnersCallbackState = { type: 'callback', payload: { token: 'token', uid: 'uid' } };

const start = (signIn: (input: unknown) => Promise<ExistingAccount | undefined>) => {
    const continueWithCredentials = jest.fn();
    const emitted: OAuthPartnersEmitted[] = [];
    const actor = createActor(
        oauthPartnersStateMachine.provide({
            actors: { signIn: fromPromise(({ input }) => signIn(input)) },
            actions: { continueWithCredentials: (_, account) => continueWithCredentials(account) },
        }),
        { input: state }
    );
    actor.on('*', (event) => emitted.push(event));
    actor.start();
    return { actor, continueWithCredentials, emitted };
};

describe('oauthPartnersStateMachine', () => {
    it('signs in with the partner state', () => {
        const signIn = jest.fn(() => new Promise<never>(() => {}));
        const { actor } = start(signIn);
        expect(actor.getSnapshot().value).toBe('working');
        expect(signIn).toHaveBeenCalledWith(state);
    });

    it('sends an existing Proton account to sign in with its credentials', async () => {
        const account: ExistingAccount = {
            email: 'user@proton.me',
            sessions: { sessions: [] } as unknown as GetActiveSessionsResult,
        };
        const { actor, continueWithCredentials, emitted } = start(async () => account);
        await waitFor(actor, () => continueWithCredentials.mock.calls.length > 0);
        expect(continueWithCredentials).toHaveBeenCalledWith(account);
        expect(emitted).toEqual([{ type: 'notice.existingAccount', email: 'user@proton.me' }]);
    });

    it('shows a failed sign-in', async () => {
        const error = new Error('Unexpected oauth state');
        const { actor, continueWithCredentials } = start(() => Promise.reject(error));
        await waitFor(actor, (snapshot) => snapshot.matches('failed'));
        expect(actor.getSnapshot().context.error).toBe(error);
        expect(continueWithCredentials).not.toHaveBeenCalled();
    });
});
