/**
 * Sign-in flow state machine — naming conventions follow the forgot-password machine:
 * - **States:** camelCase, named after what the machine waits for or does. The steps' work states carry the
 *   `submitting` tag.
 * - **Events:** `domain.action` (e.g. `credentials.authenticated`, `decision.back`).
 * - **Actors / machine actions:** camelCase verbs (`createAuthState`, `reopenCredentials`).
 *
 * It orchestrates the steps, which run as children with their own machines and screens:
 * the credentials step (`steps/credentials/state-machine`) for the whole page, then after the first authentication
 * the password account flow (`steps/password-account/state-machine`) or the SSO account flow
 * (`steps/sso/state-machine`), which complete the sign-in themselves. When an account flow ends without signing in,
 * the credentials form reopens.
 *
 * Flow: awaitingCredentials → authenticated → passwordAccount | sso → done (or back to awaitingCredentials).
 *
 * Every API call is an actor invoked by a work state, so leaving a state stops the call and its result can never
 * land in a later step. App services (API, config) stay out of context.
 */
import { type DoneActorEvent, assertEvent, assign, emit, sendTo, setup, spawnChild } from 'xstate';

import { AuthType } from '../auth/interface';
import {
    type CredentialsMachineInput,
    type CredentialsParentEvent,
    credentialsStateMachine,
} from '../steps/credentials/state-machine/credentialsStateMachine';
import { passwordAccountStateMachine } from '../steps/password-account/state-machine/passwordAccountStateMachine';
import { ssoStateMachine } from '../steps/sso/state-machine/ssoStateMachine';
import type { AccountFlowResult } from './accountFlow';
import { type StepErrorEvent, reportActorError, unprovidedActors } from './machineHelpers';
import type { CreatedAuth, SignInActors } from './signInActors';
import type { SignInAuthState } from './signInAuthState';

/**
 * The step shown to the user; kept while the machine works in the background. An account flow's step shows once
 * the flow has a screen, so the credentials form stays up (loading) until then.
 */
export type SignInStep = 'credentials' | 'passwordAccount' | 'sso';

export interface SignInMachineInput extends CredentialsMachineInput {
    /** Whether VPN-only accounts get keys set up on sign-in. */
    setupVPN: boolean;
}

interface SignInMachineContext {
    step: SignInStep;
    setupVPN: boolean;
    /** The credentials step's input, used once when the page starts it. */
    credentials: CredentialsMachineInput;
}

const CREATE_AUTH_STATE = 'createAuthState';

export type SignInMachineEvent =
    /** From the credentials step (a child actor). */
    | CredentialsParentEvent
    /** From any step (a child actor): an error to show while it continues. */
    | StepErrorEvent
    /**
     * `createAuthState` built the auth state. Listed so the account flows can read it from the event that started
     * them rather than from context: the auth state holds the password, and nothing else needs it.
     */
    | DoneActorEvent<CreatedAuth, typeof CREATE_AUTH_STATE>;

export type SignInMachineEmitted = { type: 'error'; error: unknown };

type AccountFlowDoneEvent = { event: { output: AccountFlowResult } };

/** Guard: the account flow ended this way. */
const accountFlowEnded = (type: AccountFlowResult['type']) => ({
    type: 'isAccountFlowResult' as const,
    params: ({ event }: AccountFlowDoneEvent) => ({ result: event.output, type }),
});

/**
 * How an account flow ends: signed in (it completed the sign-in), failed (report and go back to the form),
 * or cancelled (back to the form).
 */
const onAccountFlowDone = [
    { guard: accountFlowEnded('signedIn'), target: '#signIn.done' },
    {
        guard: accountFlowEnded('failed'),
        target: '#signIn.awaitingCredentials',
        actions: [
            {
                type: 'reportError' as const,
                params: ({ event }: AccountFlowDoneEvent) => ({
                    error: event.output.type === 'failed' ? event.output.error : undefined,
                }),
            },
            'reopenCredentials' as const,
        ],
    },
    { target: '#signIn.awaitingCredentials', actions: 'reopenCredentials' as const },
];

/**
 * An account flow that crashed (an unexpected exception, not a failed request, which the flows handle themselves):
 * report it and go back to the form, like a failed flow.
 */
const onAccountFlowError = {
    target: '#signIn.awaitingCredentials',
    actions: [reportActorError, 'reopenCredentials' as const],
};

/**
 * The credentials form stays up, loading, until the account flow shows a screen; then its step shows. Only once:
 * the flow's later snapshots leave the step as it is.
 */
const showAccountFlowStep = (step: SignInStep) => ({
    guard: {
        type: 'shouldShowStep' as const,
        params: ({ event }: { event: { snapshot: { context: { screen: unknown } } } }) => ({
            screen: event.snapshot.context.screen,
            step,
        }),
    },
    actions: { type: 'setStep' as const, params: { step } },
});

export const SignInStateMachine = setup({
    types: {
        context: {} as SignInMachineContext,
        events: {} as SignInMachineEvent,
        emitted: {} as SignInMachineEmitted,
        input: {} as SignInMachineInput,
        children: {} as { credentials: 'credentialsFlow'; passwordAccount: 'passwordAccountFlow'; sso: 'ssoFlow' },
    },
    actors: {
        ...unprovidedActors<SignInActors>({ prepareSignIn: true, createAuthState: true }),
        credentialsFlow: credentialsStateMachine,
        passwordAccountFlow: passwordAccountStateMachine,
        ssoFlow: ssoStateMachine,
    },
    actions: {
        setStep: assign((_, params: { step: SignInStep }) => ({ step: params.step })),
        reopenCredentials: sendTo('credentials', { type: 'credentials.reopened' as const }),
        /**
         * The credentials step crashed: start a new one, on the form. Without the SSO redirect's token, which was
         * already used, and its notice.
         */
        restartCredentials: spawnChild('credentialsFlow', {
            id: 'credentials',
            input: ({ context }) => ({ ...context.credentials, externalSSO: undefined, showSSONotice: false }),
        }),
        /** Hands the error to the page to show. */
        reportError: emit((_, params: { error: unknown }) => ({ type: 'error' as const, error: params.error })),
    },
    guards: {
        isSSOAuth: (_, params: { auth: SignInAuthState }) => params.auth.credentials.authType === AuthType.ExternalSSO,
        isAccountFlowResult: (_, params: { result: AccountFlowResult; type: AccountFlowResult['type'] }) =>
            params.result.type === params.type,
        /** The account flow has a screen, and its step isn't showing yet. */
        shouldShowStep: ({ context }, params: { screen: unknown; step: SignInStep }) =>
            params.screen !== undefined && context.step !== params.step,
    },
}).createMachine({
    id: 'signIn',
    initial: 'awaitingCredentials',
    context: ({ input: { setupVPN, ...credentials } }) => ({
        step: 'credentials',
        setupVPN,
        credentials,
    }),
    invoke: [
        // Starts with the page, like main's login; best-effort, so a failure must not block the sign-in
        { src: 'prepareSignIn', onError: {} },
        // The credentials step lives as long as the page: the form keeps its state when it reopens
        {
            id: 'credentials',
            src: 'credentialsFlow',
            input: ({ context }) => context.credentials,
            // Also catches a restarted step's crash: its errors carry the same id
            onError: { actions: [reportActorError, 'restartCredentials'] },
        },
    ],
    on: {
        'step.errorReported': {
            actions: { type: 'reportError', params: ({ event }) => ({ error: event.payload.error }) },
        },
    },
    states: {
        awaitingCredentials: {
            entry: { type: 'setStep', params: { step: 'credentials' } },
            on: {
                'credentials.authenticated': { target: 'authenticated' },
            },
        },

        authenticated: {
            invoke: {
                id: CREATE_AUTH_STATE,
                src: 'createAuthState',
                input: ({ event }) => {
                    assertEvent(event, 'credentials.authenticated');
                    return event.payload.primaryAuth;
                },
                onDone: [
                    {
                        // The backend never asks an SSO sign-in for a second factor, so only the password flow has one
                        guard: { type: 'isSSOAuth', params: ({ event }) => ({ auth: event.output.auth }) },
                        target: 'sso',
                    },
                    { target: 'passwordAccount' },
                ],
                onError: {
                    target: 'awaitingCredentials',
                    actions: [reportActorError, 'reopenCredentials'],
                },
            },
        },

        /** A password (SRP) account: second factor, unlock or setup (`passwordAccountStateMachine`). */
        passwordAccount: {
            invoke: {
                id: 'passwordAccount',
                src: 'passwordAccountFlow',
                input: ({ context, event }) => {
                    assertEvent(event, `xstate.done.actor.${CREATE_AUTH_STATE}`);
                    return { auth: event.output.auth, authTypes: event.output.authTypes, setupVPN: context.setupVPN };
                },
                onSnapshot: showAccountFlowStep('passwordAccount'),
                onDone: onAccountFlowDone,
                onError: onAccountFlowError,
            },
        },

        /** An SSO account: signs in directly, or through the SSO steps (`steps/sso/state-machine`). */
        sso: {
            invoke: {
                id: 'sso',
                src: 'ssoFlow',
                input: ({ event }) => {
                    assertEvent(event, `xstate.done.actor.${CREATE_AUTH_STATE}`);
                    return { auth: event.output.auth };
                },
                onSnapshot: showAccountFlowStep('sso'),
                onDone: onAccountFlowDone,
                onError: onAccountFlowError,
            },
        },

        done: {
            type: 'final',
        },
    },
});
