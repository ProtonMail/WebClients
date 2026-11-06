/**
 * Joining an organization through a magic link: reads the link's token and the organization's data, then sets the
 * member's password and keys and signs them in. `createJoinMagicLinkActors` provides the actors.
 */
import { assertEvent, assign, emit, setup } from 'xstate';

import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import {
    errorOf,
    isErrorOf,
    reportActorError,
    unprovidedAction,
    unprovidedActors,
} from '../../sign-in/state-machine/machineHelpers';
import type { JoinMagicLinkActors, JoinMagicLinkData } from './joinMagicLinkActors';

/** Why the link can't be used. */
export type JoinMagicLinkError = 'expired' | 'used' | 'unknown';

export type JoinMagicLinkEvent = { type: 'password.submitted'; password: string };

export type JoinMagicLinkEmitted =
    { type: 'error'; error: unknown } | { type: 'link.used'; message: string } | { type: 'session.expired' };

interface JoinMagicLinkContext {
    /** The link's data and session API: the password step needs them later, so unlike the sign-in they're in context. */
    data: JoinMagicLinkData | undefined;
    error: JoinMagicLinkError | undefined;
}

/** The link has no token. */
export class MissingTokenError extends Error {}

const isApiErrorCode = ({ event }: { event: object }, { code }: { code: number }) =>
    'error' in event && getApiError(event.error).code === code;

const failWith = (error: JoinMagicLinkError) => ({ type: 'assignError' as const, params: { error } });

export const joinMagicLinkStateMachine = setup({
    types: {
        context: {} as JoinMagicLinkContext,
        events: {} as JoinMagicLinkEvent,
        emitted: {} as JoinMagicLinkEmitted,
    },
    actors: unprovidedActors<JoinMagicLinkActors>({ prepare: true, holdLogo: true, setUp: true }),
    actions: {
        assignData: assign((_, { data }: { data: JoinMagicLinkData }) => ({ data })),
        assignError: assign((_, { error }: { error: JoinMagicLinkError }) => ({ error })),
        /** Hands the error to the page to show. */
        reportError: emit((_, { error }: { error: unknown }) => ({ type: 'error' as const, error })),
        /** The member already joined: tells them to sign in. */
        notifyLinkUsed: emit((_, { message }: { message: string }) => ({ type: 'link.used' as const, message })),
        notifySessionExpired: emit({ type: 'session.expired' as const }),
        redirectToSignIn: () => unprovidedAction('redirectToSignIn'),
    },
    guards: {
        isApiErrorCode,
        isErrorOf,
        isUnauthorized: ({ event }) =>
            'error' in event && getApiError(event.error).status === HTTP_STATUS_CODE.UNAUTHORIZED,
    },
}).createMachine({
    id: 'joinMagicLink',
    initial: 'preparing',
    context: { data: undefined, error: undefined },
    states: {
        preparing: {
            invoke: {
                src: 'prepare',
                onDone: {
                    target: 'joining',
                    actions: { type: 'assignData', params: ({ event }) => ({ data: event.output }) },
                },
                onError: [
                    { guard: errorOf(MissingTokenError), target: 'failed', actions: failWith('unknown') },
                    {
                        guard: { type: 'isApiErrorCode', params: { code: API_CUSTOM_ERROR_CODES.JWT_EXPIRED } },
                        target: 'failed',
                        actions: failWith('expired'),
                    },
                    {
                        guard: { type: 'isApiErrorCode', params: { code: API_CUSTOM_ERROR_CODES.JWT_REDIRECT_LOGIN } },
                        target: 'failed',
                        actions: [
                            {
                                type: 'notifyLinkUsed',
                                params: ({ event }) => ({ message: getApiError(event.error).message }),
                            },
                            'redirectToSignIn',
                            failWith('used'),
                        ],
                    },
                    {
                        guard: { type: 'isApiErrorCode', params: { code: API_CUSTOM_ERROR_CODES.ALREADY_EXISTS } },
                        target: 'failed',
                        actions: failWith('used'),
                    },
                    { target: 'failed', actions: [reportActorError, failWith('unknown')] },
                ],
            },
        },
        joining: {
            // The organization's logo lives as long as the page shows it
            invoke: { src: 'holdLogo', input: ({ context }) => context.data?.organizationData.logo },
            initial: 'awaitingPassword',
            states: {
                awaitingPassword: {
                    on: { 'password.submitted': 'settingUp' },
                },
                settingUp: {
                    invoke: {
                        src: 'setUp',
                        input: ({ context, event }) => {
                            assertEvent(event, 'password.submitted');
                            return { data: context.data, password: event.password };
                        },
                        // Signed in: the page leaves, or the login shows its next step
                        onError: [
                            { guard: 'isUnauthorized', target: 'awaitingPassword', actions: 'notifySessionExpired' },
                            { target: 'awaitingPassword', actions: reportActorError },
                        ],
                    },
                },
            },
        },
        failed: {},
    },
});
