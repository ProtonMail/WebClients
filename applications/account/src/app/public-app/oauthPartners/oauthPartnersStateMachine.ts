/**
 * Sign-in through a partner's OAuth: starts the partner's flow, which leaves the page, or finishes it once the partner
 * redirects back and signs in. `createOAuthPartnersActors` provides the actor.
 */
import { assign, emit, setup } from 'xstate';

import type { GetActiveSessionsResult } from '@proton/shared/lib/authentication/persistedSessionHelper';

import { reportActorError, unprovidedAction, unprovidedActors } from '../sign-in/state-machine/machineHelpers';
import type { OAuthPartnersCallbackState, OAuthPartnersInitiateState } from './oauthPartners';
import type { ExistingAccount, OAuthPartnersActors } from './oauthPartnersActors';

export type OAuthPartnersEmitted = { type: 'notice.existingAccount'; email: string };

type SignInDoneEvent = { event: { output: ExistingAccount | undefined } };

const existingAccount = ({ event }: SignInDoneEvent) => ({
    email: event.output?.email ?? '',
    sessions: event.output?.sessions,
});

export const oauthPartnersStateMachine = setup({
    types: {
        context: {} as { state: OAuthPartnersInitiateState | OAuthPartnersCallbackState; error: unknown },
        input: {} as OAuthPartnersInitiateState | OAuthPartnersCallbackState,
        emitted: {} as OAuthPartnersEmitted,
    },
    actors: unprovidedActors<OAuthPartnersActors>({ signIn: true }),
    actions: {
        reportError: assign((_, { error }: { error: unknown }) => ({ error })),
        /** Tells the user to sign in with the Proton account the partner's account already is. */
        notifyExistingAccount: emit((_, { email }: { email: string }) => ({
            type: 'notice.existingAccount' as const,
            email,
        })),
        continueWithCredentials: (_, _params: { email: string; sessions?: GetActiveSessionsResult }) =>
            unprovidedAction('continueWithCredentials'),
    },
    guards: {
        isExistingAccount: (_, { account }: { account: ExistingAccount | undefined }) => account !== undefined,
    },
}).createMachine({
    id: 'oauthPartners',
    initial: 'working',
    context: ({ input }) => ({ state: input, error: undefined }),
    states: {
        working: {
            invoke: {
                src: 'signIn',
                input: ({ context }) => context.state,
                // Signed in: the page leaves, or the login shows its next step
                onDone: {
                    guard: { type: 'isExistingAccount', params: ({ event }) => ({ account: event.output }) },
                    actions: [
                        { type: 'notifyExistingAccount', params: existingAccount },
                        { type: 'continueWithCredentials', params: existingAccount },
                    ],
                },
                onError: { target: 'failed', actions: reportActorError },
            },
        },
        failed: {},
    },
});
