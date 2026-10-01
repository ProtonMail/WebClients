/**
 * The credentials step: the sign-in machine runs this as a child for the whole page. Its forms (`auto`, `autoSrp`,
 * `srp`, `externalSSO`) decide what a submission does; each runs its own requests and keeps the form up while they
 * run. A successful first authentication is sent to the sign-in (`credentials.authenticated`) and the form waits in
 * its `submitted` state, loading, until the next step is ready; the sign-in sends `credentials.reopened` when the
 * attempt ends without signing in. Alongside the forms, the auth session is started early, and again on reopen.
 * It emits `notice.ssoRequired` for the credentials route's frame when the account should continue with its SSO
 * provider.
 */
import { type SnapshotFrom, and, assertEvent, assign, emit, enqueueActions, sendParent, setup } from 'xstate';

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

/** The credentials forms; the state machine is in one of them. */
type CredentialsForm = 'auto' | 'autoSrp' | 'srp' | 'externalSSO';

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
        isErrorOf,
        /** This app sends SSO accounts to the account app. */
        redirectsSSOToAccount: ({ context }) => context.redirectsSSOToAccount,
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
                target: '#credentials.form.externalSSO',
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
 * Sign in through the organization's identity provider in a separate window, from the auto form (an SSO account) or
 * the SSO form. The form stays up; back is ignored, and cancel (or leaving the state) aborts the window.
 */
const ssoProvider = (form: 'auto' | 'externalSSO') =>
    credentialsSetup.createStateConfig({
        tags: [CredentialsStateMachineTags.submitting],
        initial: 'loadingInfo',
        on: {
            'decision.back': {},
        },
        states: {
            loadingInfo: {
                invoke: {
                    src: 'fetchSSOInfo',
                    input: ({ context }) => ({ username: context.username }),
                    onDone: {
                        target: 'awaitingProvider',
                        actions: { type: 'setSSOInfo', params: ({ event }) => ({ ssoInfo: event.output }) },
                    },
                    onError: [
                        {
                            guard: errorOf(SwitchToSRPError),
                            target: '#credentials.form.srp',
                            actions: reportActorError,
                        },
                        { target: `#credentials.form.${form}.idle`, actions: reportActorError },
                    ],
                },
            },
            awaitingProvider: {
                tags: [CredentialsStateMachineTags.awaitingProvider],
                on: {
                    'externalSSO.cancelled': { target: `#credentials.form.${form}.idle` },
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
                            target: `#credentials.form.${form}.idle`,
                        },
                        { target: `#credentials.form.${form}.idle`, actions: reportActorError },
                    ],
                },
            },
            exchangingToken: {
                invoke: {
                    src: 'authenticateWithSSOToken',
                    input: ({ context }) => ({
                        uid: context.ssoProviderResult?.uid,
                        token: context.ssoProviderResult?.token,
                        username: context.username,
                        persistent: context.persistent,
                    }),
                    onDone: {
                        target: `#credentials.form.${form}.submitted`,
                        actions: {
                            type: 'reportAuthenticated',
                            params: ({ event }) => ({ primaryAuth: event.output }),
                        },
                    },
                    onError: { target: `#credentials.form.${form}.idle`, actions: reportActorError },
                },
            },
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
            initial: 'routeForm',
            on: {
                'credentials.edited': { actions: 'clearErrorMessage' },
            },
            states: {
                routeForm: {
                    always: [
                        { guard: { type: 'isInitialForm', params: { form: 'externalSSO' } }, target: 'externalSSO' },
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
                                    actions: { type: 'storeForm', params: ({ event }) => ({ form: event.payload }) },
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
                                            type: 'isAccountType',
                                            params: ({ event }) => ({ accountType: event.output, type: 'sso' }),
                                        },
                                        target: 'ssoProvider.awaitingProvider',
                                        actions: {
                                            type: 'setSSOInfo',
                                            params: ({ event }) => ({
                                                ssoInfo: event.output.type === 'sso' ? event.output.ssoInfo : undefined,
                                            }),
                                        },
                                    },
                                    { target: '#credentials.form.autoSrp' },
                                ],
                                onError: [
                                    redirectSSOToAccount,
                                    {
                                        guard: errorOf(SwitchToSSOError),
                                        target: 'ssoProvider',
                                    },
                                    { target: 'idle', actions: reportActorError },
                                ],
                            },
                        },
                        ssoProvider: ssoProvider('auto'),
                        submitted,
                    },
                },

                /** The password for the username checked in `auto`; back returns to the username, also while it's checked. */
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
                                    actions: { type: 'storeForm', params: ({ event }) => ({ form: event.payload }) },
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
                                    actions: { type: 'storeForm', params: ({ event }) => ({ form: event.payload }) },
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
                                    target: 'ssoProvider',
                                    actions: { type: 'storeForm', params: ({ event }) => ({ form: event.payload }) },
                                },
                                'credentials.passwordSignInRequested': {
                                    target: '#credentials.form.srp',
                                    actions: assign(({ event }) => ({ username: event.payload.username })),
                                },
                            },
                        },
                        ssoProvider: ssoProvider('externalSSO'),
                        submitted,
                    },
                },
            },
        },
    },
});

type CredentialsSnapshot = SnapshotFrom<typeof credentialsStateMachine>;

/** Which credentials form shows, for the UI. */
export const selectAuthType = (snapshot: CredentialsSnapshot): AuthType => {
    if (snapshot.matches({ form: 'auto' })) {
        return AuthType.Auto;
    }
    if (snapshot.matches({ form: 'autoSrp' })) {
        return AuthType.AutoSrp;
    }
    if (snapshot.matches({ form: 'externalSSO' })) {
        return AuthType.ExternalSSO;
    }
    return AuthType.Srp;
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
