/**
 * Activating an account through an organization's joining link: the member confirms their email, verifies the code
 * sent to it, then replaces the link's temporary password with their own. `createTokenRedemptionActors` provides the
 * actors.
 */
import { type SnapshotFrom, assertEvent, assign, emit, setup } from 'xstate';

import type { parseJoiningLinkConfig } from '@proton/account/orgJoiningLink/helpers';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import type { PasswordPolicies } from '@proton/shared/lib/interfaces/PasswordPolicy';

import { reportActorError, unprovidedAction, unprovidedActors } from '../sign-in/state-machine/machineHelpers';
import type { TokenRedemptionActors, TokenRedemptionSession } from './tokenRedemptionActors';

export type TokenRedemptionConfig = NonNullable<ReturnType<typeof parseJoiningLinkConfig>>;

/** The page's steps, in order: each is a state of the machine. */
export const tokenRedemptionSteps = ['email', 'otp', 'password'] as const;
export type TokenRedemptionStep = (typeof tokenRedemptionSteps)[number];

export type TokenRedemptionEvent =
    | { type: 'email.submitted'; email: string }
    | { type: 'email.edited' }
    | { type: 'code.submitted'; code: string }
    | { type: 'code.resendRequested' }
    | { type: 'back' }
    | { type: 'password.submitted'; password: string }
    /** From `watchSession`: the unauthenticated session expired, taking the code sent for it. */
    | { type: 'session.expired' };

export type TokenRedemptionEmitted =
    { type: 'error'; error: unknown } | { type: 'code.resent' } | { type: 'session.expired' };

interface TokenRedemptionContext {
    /** Read from the link; undefined when the link is invalid. */
    config: TokenRedemptionConfig | undefined;
    /** The email submitted on the first step: resending the code sends it to the same one. */
    email: string;
    /** The member's session and unlocked keys, from verifying the code: the password step re-encrypts the keys. */
    session: TokenRedemptionSession | undefined;
    /** The organization's password policies, for the password step's form. */
    passwordPolicies: PasswordPolicies;
    /**
     * Back on the email step because the session expired under the code step: the email step says so until the member
     * types or submits.
     */
    sessionExpired: boolean;
}

enum TokenRedemptionStateMachineTags {
    /** A step's request runs; the form shows its loading state. */
    submitting = 'submitting',
    /** The code is being sent again. */
    resending = 'resending',
}

export const tokenRedemptionStateMachine = setup({
    types: {
        context: {} as TokenRedemptionContext,
        input: {} as { config: TokenRedemptionConfig | undefined },
        events: {} as TokenRedemptionEvent,
        emitted: {} as TokenRedemptionEmitted,
        tags: {} as `${TokenRedemptionStateMachineTags}`,
    },
    actors: unprovidedActors<TokenRedemptionActors>({
        watchSession: true,
        redeemToken: true,
        verifyCode: true,
        changePassword: true,
    }),
    actions: {
        assignEmail: assign((_, { email }: { email: string }) => ({ email })),
        assignSession: assign(
            (_, params: { session: TokenRedemptionSession; passwordPolicies: PasswordPolicies }) => params
        ),
        /** Hands the error to the page to show. */
        reportError: emit((_, { error }: { error: unknown }) => ({ type: 'error' as const, error })),
        notifyCodeResent: emit({ type: 'code.resent' as const }),
        notifySessionExpired: emit({ type: 'session.expired' as const }),
        showSessionExpired: assign({ sessionExpired: true }),
        clearSessionExpired: assign({ sessionExpired: false }),
        // Provided by the page (or a test)
        /** Removes the link's secrets from the address bar. */
        clearLinkFromUrl: () => unprovidedAction('clearLinkFromUrl'),
    },
    guards: {
        hasConfig: ({ context }) => !!context.config,
        isUnauthorized: ({ event }) =>
            'error' in event && getApiError(event.error).status === HTTP_STATUS_CODE.UNAUTHORIZED,
    },
}).createMachine({
    id: 'tokenRedemption',
    initial: 'starting',
    context: ({ input }) => ({
        config: input.config,
        email: '',
        session: undefined,
        passwordPolicies: [],
        sessionExpired: false,
    }),
    states: {
        starting: {
            entry: 'clearLinkFromUrl',
            always: [{ guard: 'hasConfig', target: 'email' }, { target: 'invalid' }],
        },
        email: {
            initial: 'idle',
            states: {
                idle: {
                    on: {
                        'email.submitted': {
                            target: 'requestingCode',
                            actions: [
                                { type: 'assignEmail', params: ({ event }) => ({ email: event.email }) },
                                'clearSessionExpired',
                            ],
                        },
                        'email.edited': { actions: 'clearSessionExpired' },
                    },
                },
                requestingCode: {
                    tags: [TokenRedemptionStateMachineTags.submitting],
                    invoke: {
                        src: 'redeemToken',
                        input: ({ context }) => ({ email: context.email, config: context.config }),
                        onDone: '#tokenRedemption.otp',
                        onError: { target: 'idle', actions: reportActorError },
                    },
                },
            },
        },
        otp: {
            initial: 'idle',
            // The code was sent for the session, which the API looks it up by: once it expires, the member has to ask for
            // a new one. Leaving stops the code's requests, so their own 401 isn't reported as well
            invoke: { src: 'watchSession' },
            on: { 'session.expired': { target: '#tokenRedemption.email', actions: 'showSessionExpired' } },
            states: {
                idle: {
                    on: {
                        'code.submitted': 'verifying',
                        'code.resendRequested': 'resending',
                        back: '#tokenRedemption.email',
                    },
                },
                verifying: {
                    tags: [TokenRedemptionStateMachineTags.submitting],
                    invoke: {
                        src: 'verifyCode',
                        input: ({ context, event }) => {
                            assertEvent(event, 'code.submitted');
                            return { code: event.code, config: context.config };
                        },
                        onDone: {
                            target: '#tokenRedemption.password',
                            actions: { type: 'assignSession', params: ({ event }) => event.output },
                        },
                        onError: { target: 'idle', actions: reportActorError },
                    },
                },
                resending: {
                    tags: [TokenRedemptionStateMachineTags.resending],
                    invoke: {
                        src: 'redeemToken',
                        input: ({ context }) => ({ email: context.email, config: context.config }),
                        onDone: { target: 'idle', actions: 'notifyCodeResent' },
                        onError: { target: 'idle', actions: reportActorError },
                    },
                },
            },
        },
        password: {
            initial: 'idle',
            states: {
                idle: {
                    on: { 'password.submitted': 'changing' },
                },
                changing: {
                    tags: [TokenRedemptionStateMachineTags.submitting],
                    invoke: {
                        src: 'changePassword',
                        input: ({ context, event }) => {
                            assertEvent(event, 'password.submitted');
                            return { session: context.session, password: event.password };
                        },
                        // Signed in: the page leaves, with the loading button still up
                        onError: [
                            { guard: 'isUnauthorized', target: 'idle', actions: 'notifySessionExpired' },
                            { target: 'idle', actions: reportActorError },
                        ],
                    },
                },
            },
        },
        /** The link can't be read: the page says so. */
        invalid: {},
    },
});

type TokenRedemptionSnapshot = SnapshotFrom<typeof tokenRedemptionStateMachine>;

/** The step the page shows; the email step while the link is checked. */
export const selectStep = (snapshot: TokenRedemptionSnapshot): TokenRedemptionStep =>
    tokenRedemptionSteps.find((step) => snapshot.matches(step)) ?? 'email';

/** A step's request runs; the form shows its loading state. */
export const selectSubmitting = (snapshot: TokenRedemptionSnapshot) =>
    snapshot.hasTag(TokenRedemptionStateMachineTags.submitting);

/** The code is being sent again. */
export const selectResending = (snapshot: TokenRedemptionSnapshot) =>
    snapshot.hasTag(TokenRedemptionStateMachineTags.resending);

/** Back on the email step because the session expired; the step says so without marking the field. */
export const selectSessionExpired = (snapshot: TokenRedemptionSnapshot) => snapshot.context.sessionExpired;
