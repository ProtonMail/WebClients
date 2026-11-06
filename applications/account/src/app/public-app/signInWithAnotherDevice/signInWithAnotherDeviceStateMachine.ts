/**
 * Sign-in with another device: shows a QR code while it polls for the fork the other device produces, then signs in
 * with the session it hands over. `createSignInWithAnotherDeviceActors` provides the actors; leaving `pulling` stops
 * the poll.
 */
import { assertEvent, assign, emit, setup } from 'xstate';

import type { ResumedSessionResult } from '@proton/shared/lib/authentication/persistedSessionHelper';

import { reportActorError, unprovidedActors } from '../sign-in/state-machine/machineHelpers';
import type { SignInWithAnotherDeviceActors } from './signInWithAnotherDeviceActors';

export type PullEvent =
    | { type: 'pull.qrCodeCreated'; qrCode: string }
    | { type: 'pull.failed'; error: unknown }
    | { type: 'pull.signedIn'; session: ResumedSessionResult; forkDurationTime: number };

export type SignInWithAnotherDeviceEvent = PullEvent | { type: 'qrCode.requested' };

export type SignInWithAnotherDeviceEmitted = { type: 'signIn.failed'; error: unknown };

interface SignInWithAnotherDeviceContext {
    /** The QR code of the current fork, once it's created. */
    qrCode: string | undefined;
    error: unknown;
}

/** The QR code to show; not while signing in or after a failure. */
export const selectQrCode = ({ context, value }: { context: SignInWithAnotherDeviceContext; value: unknown }) =>
    value === 'pulling' ? context.qrCode : undefined;

export const signInWithAnotherDeviceStateMachine = setup({
    types: {
        context: {} as SignInWithAnotherDeviceContext,
        events: {} as SignInWithAnotherDeviceEvent,
        emitted: {} as SignInWithAnotherDeviceEmitted,
    },
    actors: unprovidedActors<SignInWithAnotherDeviceActors>({ pull: true, signIn: true }),
    actions: {
        resetPull: assign({ qrCode: undefined, error: undefined }),
        setQrCode: assign((_, { qrCode }: { qrCode: string }) => ({ qrCode })),
        reportError: assign((_, { error }: { error: unknown }) => ({ error })),
        /** Hands what failed to the page, to trace without showing it. */
        traceSignInFailure: emit((_, { error }: { error: unknown }) => ({ type: 'signIn.failed' as const, error })),
    },
}).createMachine({
    id: 'signInWithAnotherDevice',
    initial: 'pulling',
    context: { qrCode: undefined, error: undefined },
    states: {
        pulling: {
            entry: 'resetPull',
            invoke: { src: 'pull' },
            on: {
                'pull.qrCodeCreated': {
                    actions: { type: 'setQrCode', params: ({ event }) => ({ qrCode: event.qrCode }) },
                },
                'pull.failed': {
                    target: 'failed',
                    actions: [
                        { type: 'reportError', params: ({ event }) => ({ error: event.error }) },
                        { type: 'traceSignInFailure', params: ({ event }) => ({ error: event.error }) },
                    ],
                },
                'pull.signedIn': 'signingIn',
            },
        },
        signingIn: {
            invoke: {
                src: 'signIn',
                input: ({ event }) => {
                    assertEvent(event, 'pull.signedIn');
                    return { session: event.session, forkDurationTime: event.forkDurationTime };
                },
                // A signed-in session leaves the page, or the login shows its next step
                onError: {
                    target: 'failed',
                    actions: [
                        reportActorError,
                        { type: 'traceSignInFailure', params: ({ event }) => ({ error: event.error }) },
                    ],
                },
            },
        },
        failed: {
            on: { 'qrCode.requested': 'pulling' },
        },
    },
});
