/**
 * The credentials step: the sign-in machine runs this as a child for the whole page. Its forms (`auto`, `autoSrp`,
 * `srp`, `externalSSO`) decide what a submission does; each runs its own requests and keeps the form up while they
 * run. A password the account rejects but an account its address belonged to accepts signs in to that one, to
 * recover it. When the address's domain has an identity provider, the forms that use it ask first
 * (`claimedAddress`), and back returns to the form it came from. A successful first authentication is sent to the
 * sign-in (`credentials.authenticated`) and the form waits in its `submitted` state, loading, until the next step is
 * ready; the sign-in sends `credentials.reopened` when the attempt ends without signing in. Alongside the forms,
 * the auth session is started early, and again on reopen. It emits `notice.ssoRequired` for the credentials route's
 * frame when the account should continue with its SSO provider.
 */
import { type SnapshotFrom, and, assertEvent, assign, emit, enqueueActions, sendParent, setup } from 'xstate';

import type { ChallengeResult } from '@proton/challenge/interface';
import type { SSOInfoResponse } from '@proton/shared/lib/authentication/interface';
import { ExternalSSOError } from '@proton/shared/lib/authentication/ssoExternalLogin';

import { AuthType, type AuthTypeData } from '../../../auth/interface';
import {
    type StepErrorEvent,
    errorOf,
    isErrorOf,
    reportActorError,
    unprovidedAction,
    unprovidedActors,
} from '../../../state-machine/machineHelpers';
import type {
    AccountType,
    CredentialsActors,
    CredentialsFormValues,
    PrimaryAuthResult,
    SSOProviderResult,
    UsernameFormValues,
} from './credentialsActors';
import { InvalidLoginError, SwitchToSRPError, SwitchToSSOError } from './credentialsErrors';

export interface CredentialsMachineInput {
    username: string;
    /** The form the page starts on. */
    authTypeData: AuthTypeData;
    canNavigateBack: boolean;
    /** Apps other than account send SSO users to account's SSO page instead of signing in inline. */
    redirectsSSOToAccount: boolean;
    /** SSO response token handed over by the identity provider redirect, with the page's remember choice. */
    externalSSO: { token: string; persistent: boolean } | undefined;
    /** Tell the user to press Sign in to continue with their SSO provider. */
    showSSONotice: boolean;
}

/**
 * The credentials forms; the state machine is in one of them. The two claimed ones are for an address an organization
 * claimed whose domain has an identity provider: the choice between it and recovering the account the address
 * belonged to, and proving ownership of that account with its password.
 */
export type CredentialsForm = 'auto' | 'autoSrp' | 'srp' | 'externalSSO' | 'claimedChoice' | 'claimedVerify';

interface CredentialsMachineContext {
    canNavigateBack: boolean;
    redirectsSSOToAccount: boolean;
    showSSONotice: boolean;
    /** The form the page starts on; after that, the state says which form shows. */
    initialForm: CredentialsForm;
    /**
     * The username the credentials forms start with, and the requests use: from the page, then the last one submitted
     * or switched with, so it carries over between forms. Keystrokes stay in the forms.
     */
    username: string;
    /** The remember choice of the last submission. The password is never kept: only the login request gets it. */
    persistent: boolean;
    /** Exchanged once when the SSO form opens, then cleared. */
    externalSSO: { token: string; persistent: boolean } | undefined;
    /**
     * The SSO info last loaded for the username: its challenge token opens the provider's window, and in the
     * claimed-address recovery, its `ClaimedAddresses` are the candidates the old password is tried against.
     */
    ssoInfo: SSOInfoResponse | undefined;
    ssoProviderResult: SSOProviderResult | undefined;
    /** Shown inline in the credentials form (wrong username or password). */
    errorMessage: string | undefined;
}

type CredentialsEvent =
    | { type: 'credentials.submitted'; payload: CredentialsFormValues }
    | { type: 'credentials.usernameSubmitted'; payload: UsernameFormValues }
    | { type: 'credentials.edited' }
    | { type: 'credentials.passwordSignInRequested'; payload: { username: string } }
    | { type: 'externalSSO.cancelled' }
    /** From the claimed-address choice: continue to the organization's identity provider after all. */
    | { type: 'claimed.ssoRequested' }
    /** From the claimed-address choice: recover the personal account rather than use the identity provider. */
    | { type: 'claimed.recoveryChosen' }
    /** Proving ownership of the claimed address, with the password of the account it belonged to. */
    | { type: 'claimed.submitted'; payload: { password: string; payload: ChallengeResult } }
    | { type: 'decision.back' }
    /** From the sign-in: the attempt ended without signing in; show the form again. */
    | { type: 'credentials.reopened' };

/** Sent to the sign-in machine. */
export type CredentialsParentEvent =
    | { type: 'credentials.authenticated'; payload: { primaryAuth: PrimaryAuthResult } }
    /** An error to show; the form stays up. */
    | StepErrorEvent;

/** For the credentials route's frame: tell the user to press Sign in to continue with their SSO provider. */
type CredentialsEmitted = { type: 'notice.ssoRequired' };

enum CredentialsStateMachineTags {
    /** A request runs, or the next step is being prepared; the form shows its loading state. */
    submitting = 'submitting',
    /** The identity provider's window is open; the form offers to cancel it. */
    awaitingProvider = 'awaitingProvider',
}

const initialForms: Record<AuthType, CredentialsForm> = {
    [AuthType.Auto]: 'auto',
    [AuthType.AutoSrp]: 'autoSrp',
    [AuthType.Srp]: 'srp',
    [AuthType.ExternalSSO]: 'externalSSO',
};

/** The SSO info an account type carries; a password account has none. */
const getAccountSSOInfo = (accountType: AccountType) => (accountType.type === 'sso' ? accountType.ssoInfo : undefined);

const credentialsSetup = setup({
    types: {
        context: {} as CredentialsMachineContext,
        events: {} as CredentialsEvent,
        emitted: {} as CredentialsEmitted,
        input: {} as CredentialsMachineInput,
        tags: {} as `${CredentialsStateMachineTags}`,
    },
    actors: {
        ...unprovidedActors<CredentialsActors>({
            startAuthSession: true,
            fetchAccountType: true,
            fetchSSOInfo: true,
            authenticateWithPassword: true,
            authorizeWithSSOProvider: true,
            authenticateWithSSOToken: true,
            authenticateWithClaimedAddress: true,
        }),
    },
    actions: {
        // Provided by `useSignInMachine` (or a test)
        navigateBack: () => unprovidedAction('navigateBack'),
        redirectToAccountSSO: (_, _params: { username: string }) => unprovidedAction('redirectToAccountSSO'),
        /**
         * A new submission starts from scratch: no error and no leftover SSO state. Only the username and remember
         * choice are kept; the password stays in the submitted event, which starts the login request.
         */
        storeForm: assign((_, params: { form: UsernameFormValues }) => ({
            // The next form (password after the username step, SSO after a switch) starts with it
            username: params.form.username,
            persistent: params.form.persistent,
            errorMessage: undefined,
            ssoInfo: undefined,
            ssoProviderResult: undefined,
        })),
        /** After `errorOf(InvalidLoginError)`: the error has the API's message, or a fallback. */
        setErrorMessage: assign((_, params: { error: unknown }) => ({
            errorMessage: params.error instanceof InvalidLoginError ? params.error.message : undefined,
        })),
        clearErrorMessage: assign({ errorMessage: undefined }),
        setSSOInfo: assign((_, params: { ssoInfo: SSOInfoResponse | undefined }) => ({ ssoInfo: params.ssoInfo })),
        setSSOProviderResult: assign((_, params: { result: SSOProviderResult }) => ({
            ssoProviderResult: params.result,
        })),
        /**
         * Exchange the token from the identity provider redirect; it can only be used once. Only run when the page
         * brought one (see `hasExternalSSOToken`); `authenticateWithSSOToken` fails if there isn't.
         */
        consumeExternalSSOToken: assign(({ context }) => ({
            persistent: context.externalSSO?.persistent ?? context.persistent,
            ssoProviderResult: context.externalSSO && { uid: undefined, token: context.externalSSO.token },
            externalSSO: undefined,
        })),
        /** The attempt starts over from the form: drop the last submission's SSO state. */
        resetAttempt: assign({ ssoInfo: undefined, ssoProviderResult: undefined }),
        reportAuthenticated: sendParent((_, params: { primaryAuth: PrimaryAuthResult }): CredentialsParentEvent => ({
            type: 'credentials.authenticated',
            payload: { primaryAuth: params.primaryAuth },
        })),
        reportError: sendParent((_, params: { error: unknown }): CredentialsParentEvent => ({
            type: 'step.errorReported',
            payload: { error: params.error },
        })),
        notifySSORequired: emit({ type: 'notice.ssoRequired' as const }),
    },
    guards: {
        shouldShowSSONotice: ({ context }) => context.showSSONotice,
        canNavigateBack: ({ context }) => context.canNavigateBack,
        isInitialForm: ({ context }, params: { form: CredentialsForm }) => context.initialForm === params.form,
        hasExternalSSOToken: ({ context }) => !!context.externalSSO,
        isAccountType: (_, params: { accountType: AccountType; type: AccountType['type'] }) =>
            params.accountType.type === params.type,
        /** This app sends SSO accounts to the account app. */
        redirectsSSOToAccount: ({ context }) => context.redirectsSSOToAccount,
        isErrorOf,
        /** The organization whose identity provider signs the address's domain in also claimed the address. */
        hasClaimedAddresses: (_, params: { ssoInfo: SSOInfoResponse | undefined }) =>
            !!params.ssoInfo?.ClaimedAddresses?.length,
    },
});

/** An SSO account of an app that doesn't sign them in: send them to account's SSO page, and stay on the form. */
const redirectSSOToAccount = {
    guard: and(['redirectsSSOToAccount', errorOf(SwitchToSSOError)]),
    target: 'idle',
    actions: {
        type: 'redirectToAccountSSO' as const,
        params: ({ context }: { context: CredentialsMachineContext }) => ({ username: context.username }),
    },
};

/** Authenticated: the form stays up, loading, while the sign-in prepares the next step. */
const submitted = credentialsSetup.createStateConfig({
    tags: [CredentialsStateMachineTags.submitting],
    on: {
        'credentials.reopened': { target: 'idle', actions: 'resetAttempt' },
        // The sign-in may complete and leave the page from here, so back no longer works
        'decision.back': {},
    },
});

/** The password login, for the password forms (`srp` and `autoSrp`). */
const signingIn = credentialsSetup.createStateConfig({
    tags: [CredentialsStateMachineTags.submitting],
    invoke: {
        src: 'authenticateWithPassword',
        // Only the password forms' submission gets here; its password goes to the request only
        input: ({ event }) => {
            assertEvent(event, 'credentials.submitted');
            return event.payload;
        },
        onDone: {
            target: 'submitted',
            actions: { type: 'reportAuthenticated', params: ({ event }) => ({ primaryAuth: event.output }) },
        },
        onError: [
            redirectSSOToAccount,
            {
                guard: errorOf(SwitchToSSOError),
                target: '#credentials.form.signIn.externalSSO',
                actions: 'notifySSORequired',
            },
            {
                guard: errorOf(InvalidLoginError),
                target: 'idle',
                actions: { type: 'setErrorMessage', params: ({ event }) => ({ error: event.error }) },
            },
            { target: 'idle', actions: reportActorError },
        ],
    },
});

/**
 * Sign in through the organization's identity provider, in a window of its own, then exchange the token it hands
 * over. The window opens with the challenge token of the SSO info in context, which it uses up, so it's entered right
 * after that info is loaded (or at `exchangingToken`, with a token from the provider's redirect). Cancel, or leaving
 * the state, aborts the window. It's done (`closed`) when the window closes or a request fails, or once signed in, when
 * the attempt ends without signing in; the state that uses it decides where to go then, with its `onDone`.
 */
const ssoProvider = credentialsSetup.createStateConfig({
    tags: [CredentialsStateMachineTags.submitting],
    initial: 'awaitingProvider',
    states: {
        awaitingProvider: {
            tags: [CredentialsStateMachineTags.awaitingProvider],
            on: {
                'externalSSO.cancelled': { target: 'closed' },
            },
            invoke: {
                src: 'authorizeWithSSOProvider',
                input: ({ context }) => ({ token: context.ssoInfo?.SSOChallengeToken }),
                onDone: {
                    target: 'exchangingToken',
                    actions: { type: 'setSSOProviderResult', params: ({ event }) => ({ result: event.output }) },
                },
                onError: [
                    {
                        // The user closed the provider window, or it timed out
                        guard: errorOf(ExternalSSOError),
                        target: 'closed',
                    },
                    { target: 'closed', actions: reportActorError },
                ],
            },
        },
        exchangingToken: {
            // The sign-in may complete from here, so back no longer works
            on: { 'decision.back': {} },
            invoke: {
                src: 'authenticateWithSSOToken',
                input: ({ context }) => ({
                    uid: context.ssoProviderResult?.uid,
                    token: context.ssoProviderResult?.token,
                    username: context.username,
                    persistent: context.persistent,
                }),
                onDone: {
                    target: 'submitted',
                    actions: { type: 'reportAuthenticated', params: ({ event }) => ({ primaryAuth: event.output }) },
                },
                onError: { target: 'closed', actions: reportActorError },
            },
        },
        /** Authenticated: the screen stays up, loading, while the sign-in prepares the next step. */
        submitted: {
            on: {
                // The attempt ended without signing in
                'credentials.reopened': { target: 'closed' },
                // The sign-in may complete and leave the page from here, so back no longer works
                'decision.back': {},
            },
        },
        closed: { type: 'final' },
    },
});

/** The forms' sign-in with the identity provider: back, which leaves the page, waits for it; then the form starts over. */
const formSSOProvider = credentialsSetup.createStateConfig({
    ...ssoProvider,
    on: { 'decision.back': {} },
    onDone: { target: 'idle', actions: 'resetAttempt' },
});

/**
 * The forms' SSO info for the username, to open the provider's window with. When the organization also claimed the
 * address, the personal account it belonged to is a valid destination too, so it asks which way to go first
 * (`claimedAddress`). Back, which leaves the page, waits for the request.
 */
const loadingSSOInfo = credentialsSetup.createStateConfig({
    tags: [CredentialsStateMachineTags.submitting],
    on: { 'decision.back': {} },
    invoke: {
        src: 'fetchSSOInfo',
        input: ({ context }) => ({ username: context.username }),
        onDone: [
            {
                guard: { type: 'hasClaimedAddresses', params: ({ event }) => ({ ssoInfo: event.output }) },
                target: '#credentials.form.claimedAddress',
                actions: { type: 'setSSOInfo', params: ({ event }) => ({ ssoInfo: event.output }) },
            },
            {
                target: 'ssoProvider',
                actions: { type: 'setSSOInfo', params: ({ event }) => ({ ssoInfo: event.output }) },
            },
        ],
        onError: [
            { guard: errorOf(SwitchToSRPError), target: '#credentials.form.signIn.srp', actions: reportActorError },
            { target: 'idle', actions: reportActorError },
        ],
    },
});

export const credentialsStateMachine = credentialsSetup.createMachine({
    id: 'credentials',
    type: 'parallel',
    context: ({ input }) => ({
        canNavigateBack: input.canNavigateBack,
        redirectsSSOToAccount: input.redirectsSSOToAccount,
        showSSONotice: input.showSSONotice,
        initialForm: initialForms[input.authTypeData.type],
        username: input.username,
        persistent: false,
        externalSSO: input.externalSSO,
        ssoInfo: undefined,
        ssoProviderResult: undefined,
        errorMessage: undefined,
    }),
    entry: enqueueActions(({ enqueue, check }) => {
        if (check('shouldShowSSONotice')) {
            enqueue('notifySSORequired');
        }
    }),
    states: {
        /**
         * Preemptively starts the auth session, and again when the form reopens after a later step. Best-effort: a
         * failure doesn't block the form, and the requests start the session again before they run.
         */
        authSession: {
            initial: 'starting',
            on: {
                'credentials.reopened': { target: '.starting' },
            },
            states: {
                starting: {
                    invoke: { src: 'startAuthSession', onDone: { target: 'started' }, onError: { target: 'started' } },
                },
                started: {},
            },
        },

        form: {
            initial: 'signIn',
            on: {
                'credentials.edited': { actions: 'clearErrorMessage' },
            },
            states: {
                /** The forms that start an attempt; the claimed-address recovery is reached from them. */
                signIn: {
                    initial: 'routeForm',
                    states: {
                        routeForm: {
                            always: [
                                {
                                    guard: { type: 'isInitialForm', params: { form: 'externalSSO' } },
                                    target: 'externalSSO',
                                },
                                { guard: { type: 'isInitialForm', params: { form: 'auto' } }, target: 'auto' },
                                { guard: { type: 'isInitialForm', params: { form: 'autoSrp' } }, target: 'autoSrp' },
                                { target: 'srp' },
                            ],
                        },

                        /** Username only; the server tells whether the account signs in with a password or SSO. */
                        auto: {
                            initial: 'idle',
                            on: {
                                'decision.back': { guard: 'canNavigateBack', actions: 'navigateBack' },
                            },
                            states: {
                                idle: {
                                    on: {
                                        'credentials.usernameSubmitted': {
                                            target: 'checkingAccountType',
                                            actions: {
                                                type: 'storeForm',
                                                params: ({ event }) => ({ form: event.payload }),
                                            },
                                        },
                                    },
                                },
                                checkingAccountType: {
                                    tags: [CredentialsStateMachineTags.submitting],
                                    // The page's back, which leaves the page, waits for the request
                                    on: { 'decision.back': {} },
                                    invoke: {
                                        src: 'fetchAccountType',
                                        input: ({ context }) => ({ username: context.username }),
                                        onDone: [
                                            {
                                                guard: {
                                                    type: 'hasClaimedAddresses',
                                                    params: ({ event }) => ({
                                                        ssoInfo: getAccountSSOInfo(event.output),
                                                    }),
                                                },
                                                target: '#credentials.form.claimedAddress',
                                                actions: {
                                                    type: 'setSSOInfo',
                                                    params: ({ event }) => ({
                                                        ssoInfo: getAccountSSOInfo(event.output),
                                                    }),
                                                },
                                            },
                                            {
                                                guard: {
                                                    type: 'isAccountType',
                                                    params: ({ event }) => ({ accountType: event.output, type: 'sso' }),
                                                },
                                                target: 'ssoProvider',
                                                actions: {
                                                    type: 'setSSOInfo',
                                                    params: ({ event }) => ({
                                                        ssoInfo: getAccountSSOInfo(event.output),
                                                    }),
                                                },
                                            },
                                            { target: '#credentials.form.signIn.autoSrp' },
                                        ],
                                        onError: [
                                            redirectSSOToAccount,
                                            {
                                                guard: errorOf(SwitchToSSOError),
                                                target: 'loadingSSOInfo',
                                            },
                                            { target: 'idle', actions: reportActorError },
                                        ],
                                    },
                                },
                                loadingSSOInfo,
                                ssoProvider: formSSOProvider,
                            },
                        },

                        /**
                         * The password for the username checked in `auto`; back returns to the username, also while
                         * it's checked.
                         */
                        autoSrp: {
                            initial: 'idle',
                            on: {
                                'decision.back': { target: 'auto' },
                            },
                            states: {
                                idle: {
                                    on: {
                                        'credentials.submitted': {
                                            target: 'signingIn',
                                            actions: {
                                                type: 'storeForm',
                                                params: ({ event }) => ({ form: event.payload }),
                                            },
                                        },
                                    },
                                },
                                signingIn,
                                submitted,
                            },
                        },

                        srp: {
                            initial: 'idle',
                            on: {
                                'decision.back': { guard: 'canNavigateBack', actions: 'navigateBack' },
                            },
                            states: {
                                idle: {
                                    on: {
                                        'credentials.submitted': {
                                            target: 'signingIn',
                                            actions: {
                                                type: 'storeForm',
                                                params: ({ event }) => ({ form: event.payload }),
                                            },
                                        },
                                    },
                                },
                                // The page's back, which leaves the page, waits for the request
                                signingIn: { ...signingIn, on: { 'decision.back': {} } },
                                submitted,
                            },
                        },

                        externalSSO: {
                            initial: 'idle',
                            on: {
                                'decision.back': { guard: 'canNavigateBack', actions: 'navigateBack' },
                            },
                            states: {
                                idle: {
                                    // Coming back from the identity provider redirect: exchange its token right away
                                    always: {
                                        guard: 'hasExternalSSOToken',
                                        target: 'ssoProvider.exchangingToken',
                                        actions: 'consumeExternalSSOToken',
                                    },
                                    on: {
                                        'credentials.usernameSubmitted': {
                                            target: 'loadingSSOInfo',
                                            actions: {
                                                type: 'storeForm',
                                                params: ({ event }) => ({ form: event.payload }),
                                            },
                                        },
                                        'credentials.passwordSignInRequested': {
                                            target: '#credentials.form.signIn.srp',
                                            // A new attempt: the last one's claimed address and SSO state don't
                                            // carry over
                                            actions: [
                                                'resetAttempt',
                                                assign(({ event }) => ({ username: event.payload.username })),
                                            ],
                                        },
                                    },
                                },
                                loadingSSOInfo,
                                ssoProvider: formSSOProvider,
                            },
                        },

                        /** The form the claimed-address recovery was reached from, which back returns to. */
                        previous: { type: 'history', target: 'routeForm' },
                    },
                },

                /**
                 * An address an organization claimed, on a domain with its identity provider: registering a domain
                 * disables the addresses on it, so the address can no longer be found by email, and the candidate IDs
                 * found for it are the way into the account it belonged to. Both destinations are legitimate, so it
                 * asks. (Without an identity provider, the password forms sign in to that account directly.) Back
                 * returns to the form it came from.
                 */
                claimedAddress: {
                    initial: 'choice',
                    // Its error is its own; the forms' doesn't carry over in either direction
                    entry: 'clearErrorMessage',
                    exit: 'clearErrorMessage',
                    on: {
                        'decision.back': { target: 'signIn.previous' },
                    },
                    states: {
                        /** The identity provider, or the personal account the address used to belong to. */
                        choice: {
                            on: {
                                'claimed.recoveryChosen': { target: 'verify' },
                                'claimed.ssoRequested': { target: 'loadingSSOInfo' },
                            },
                        },
                        /** Each window uses up its challenge token, so every opening fetches a fresh one. */
                        loadingSSOInfo: {
                            tags: [CredentialsStateMachineTags.submitting],
                            invoke: {
                                src: 'fetchSSOInfo',
                                input: ({ context }) => ({ username: context.username }),
                                onDone: {
                                    target: 'ssoProvider',
                                    actions: { type: 'setSSOInfo', params: ({ event }) => ({ ssoInfo: event.output }) },
                                },
                                onError: [
                                    {
                                        guard: errorOf(SwitchToSRPError),
                                        target: '#credentials.form.signIn.srp',
                                        actions: reportActorError,
                                    },
                                    { target: 'choice', actions: reportActorError },
                                ],
                            },
                        },
                        // Back returns to the form while the window is open; the choice shows again when it's done
                        ssoProvider: { ...ssoProvider, onDone: { target: 'choice' } },

                        /** Proving ownership with the password of the account the address belonged to. */
                        verify: {
                            initial: 'idle',
                            states: {
                                idle: {
                                    on: {
                                        'claimed.submitted': { target: 'verifying', actions: 'clearErrorMessage' },
                                    },
                                },
                                verifying: {
                                    tags: [CredentialsStateMachineTags.submitting],
                                    invoke: {
                                        src: 'authenticateWithClaimedAddress',
                                        input: ({ context, event }) => {
                                            assertEvent(event, 'claimed.submitted');
                                            return {
                                                claimedAddresses: context.ssoInfo?.ClaimedAddresses ?? [],
                                                email: context.username,
                                                password: event.payload.password,
                                                payload: event.payload.payload,
                                                persistent: context.persistent,
                                            };
                                        },
                                        onDone: {
                                            target: 'submitted',
                                            actions: {
                                                type: 'reportAuthenticated',
                                                params: ({ event }) => ({ primaryAuth: event.output }),
                                            },
                                        },
                                        onError: [
                                            {
                                                // None of the candidates matched, so the password is wrong for all
                                                guard: errorOf(InvalidLoginError),
                                                target: 'idle',
                                                actions: {
                                                    type: 'setErrorMessage',
                                                    params: ({ event }) => ({ error: event.error }),
                                                },
                                            },
                                            { target: 'idle', actions: reportActorError },
                                        ],
                                    },
                                },
                                /** Authenticated: the screen stays up, loading, while the sign-in continues. */
                                submitted: {
                                    tags: [CredentialsStateMachineTags.submitting],
                                    on: {
                                        // The attempt ended without signing in: the recovery starts over at the choice
                                        'credentials.reopened': { target: '#credentials.form.claimedAddress.choice' },
                                        // The sign-in may complete and leave the page from here, so back no longer works
                                        'decision.back': {},
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
});

type CredentialsSnapshot = SnapshotFrom<typeof credentialsStateMachine>;

/** Which credentials form shows, for the UI. */
export const selectCredentialsForm = (snapshot: CredentialsSnapshot): CredentialsForm => {
    if (snapshot.matches({ form: { claimedAddress: 'verify' } })) {
        return 'claimedVerify';
    }
    // The choice stays up while the identity provider's window is open, and after it
    if (snapshot.matches({ form: 'claimedAddress' })) {
        return 'claimedChoice';
    }
    if (snapshot.matches({ form: { signIn: 'auto' } })) {
        return 'auto';
    }
    if (snapshot.matches({ form: { signIn: 'autoSrp' } })) {
        return 'autoSrp';
    }
    if (snapshot.matches({ form: { signIn: 'externalSSO' } })) {
        return 'externalSSO';
    }
    return 'srp';
};

/** A request runs, or the next step is being prepared; the form shows its loading state. */
export const selectSubmitting = (snapshot: CredentialsSnapshot) =>
    snapshot.hasTag(CredentialsStateMachineTags.submitting);

/** The identity provider's window is open; the form offers to cancel it. */
export const selectAwaitingProvider = (snapshot: CredentialsSnapshot) =>
    snapshot.hasTag(CredentialsStateMachineTags.awaitingProvider);

/** Shown inline in the form: a wrong username or password. */
export const selectErrorMessage = (snapshot: CredentialsSnapshot) => snapshot.context.errorMessage;

/** The username the forms start with, carried over between them. */
export const selectUsername = (snapshot: CredentialsSnapshot) => snapshot.context.username;

/** Whether the page itself can be left, which is what back means for the forms that start an attempt. */
export const selectCanNavigateBack = (snapshot: CredentialsSnapshot) => snapshot.context.canNavigateBack;

/** Back works now: it doesn't while a request runs, or once the sign-in has taken over. */
export const selectCanGoBack = (snapshot: CredentialsSnapshot) => snapshot.can({ type: 'decision.back' });
