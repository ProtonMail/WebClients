/**
 * Joining an organization through a magic link: reads the link's token and the organization's data, verifies the
 * invitation, then sets the member's password and keys and signs them in. `createJoinMagicLinkActors` provides the actors.
 */
import { assertEvent, assign, emit, setup } from 'xstate';

import { UnprivatizationIdentityError, UnprivatizationRevisionError } from '@proton/account/members/unprivatization';
import { getApiError, getIsConnectionIssue } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import {
    errorOf,
    isErrorOf,
    reportActorError,
    unprovidedAction,
    unprovidedActors,
} from '../sign-in/state-machine/machineHelpers';
import type { JoinMagicLinkActors, JoinMagicLinkData } from './joinMagicLinkActors';

/** Why the link can't be used. */
export type JoinMagicLinkError = 'expired' | 'used' | 'connection' | 'identity' | 'invalid' | 'unknown';

export type JoinMagicLinkEvent = { type: 'password.submitted'; password: string } | { type: 'retry' };

export type JoinMagicLinkEmitted =
    | { type: 'error'; error: unknown }
    | { type: 'invitation.invalid'; error: unknown }
    | { type: 'link.used'; message: string }
    | { type: 'session.expired' };

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
    actors: unprovidedActors<JoinMagicLinkActors>({ prepare: true, validate: true, holdLogo: true, setUp: true }),
    actions: {
        assignData: assign((_, { data }: { data: JoinMagicLinkData }) => ({ data })),
        assignError: assign((_, { error }: { error: JoinMagicLinkError }) => ({ error })),
        /** Hands the error to the page to show. */
        reportError: emit((_, { error }: { error: unknown }) => ({ type: 'error' as const, error })),
        /** The invitation didn't verify: the page reports it, the failed screen explains it. */
        notifyInvitationInvalid: emit((_, { error }: { error: unknown }) => ({
            type: 'invitation.invalid' as const,
            error,
        })),
        /** The member already joined: tells them to sign in. */
        notifyLinkUsed: emit((_, { message }: { message: string }) => ({ type: 'link.used' as const, message })),
        notifySessionExpired: emit({ type: 'session.expired' as const }),
        redirectToSignIn: () => unprovidedAction('redirectToSignIn'),
    },
    guards: {
        isApiErrorCode,
        isErrorOf,
        isConnectionIssue: ({ event }) => 'error' in event && getIsConnectionIssue(event.error),
        isInvalidInvitation: ({ event }) =>
            'error' in event &&
            event.error instanceof Error &&
            (event.error.name === 'SignatureError' || event.error instanceof UnprivatizationRevisionError),
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
                    { guard: 'isConnectionIssue', target: 'failed', actions: failWith('connection') },
                    { target: 'failed', actions: [reportActorError, failWith('unknown')] },
                ],
            },
        },
        joining: {
            // The organization's logo lives until the page leaves the invitation, retries included
            invoke: { src: 'holdLogo', input: ({ context }) => context.data?.organizationData.logo },
            initial: 'validating',
            states: {
                validating: {
                    // The data stays in context on failure: the failed screen names the admin to contact
                    invoke: {
                        src: 'validate',
                        input: ({ context }) => ({ data: context.data }),
                        onDone: 'awaitingPassword',
                        onError: [
                            {
                                guard: 'isConnectionIssue',
                                target: '#joinMagicLink.failed',
                                actions: failWith('connection'),
                            },
                            {
                                guard: errorOf(UnprivatizationIdentityError),
                                target: '#joinMagicLink.failed',
                                actions: [
                                    {
                                        type: 'notifyInvitationInvalid',
                                        params: ({ event }) => ({ error: event.error }),
                                    },
                                    failWith('identity'),
                                ],
                            },
                            {
                                guard: 'isInvalidInvitation',
                                target: '#joinMagicLink.failed',
                                actions: [
                                    {
                                        type: 'notifyInvitationInvalid',
                                        params: ({ event }) => ({ error: event.error }),
                                    },
                                    failWith('invalid'),
                                ],
                            },
                            { target: '#joinMagicLink.failed', actions: [reportActorError, failWith('unknown')] },
                        ],
                    },
                },
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
        failed: {
            // The link stays valid until the member's keys are set up, so reading it again is safe
            on: { retry: 'preparing' },
        },
    },
});
