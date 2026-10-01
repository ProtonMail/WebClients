/**
 * The password account flow: after a password (SRP) sign-in, the sign-in machine runs this as a child with the
 * auth state. Second factor (or the lost-2FA flow), loading the account, then whatever the account needs: a new
 * password, key setup, the second password, or unlocking with the login password. It completes the sign-in itself,
 * then waits on its last screen, loading, until the app takes the sign-in away (`handedOver`); it only ends, with a
 * result, when cancelled or failed.
 * Each screen sets `screen`; the work states keep it, so the screen stays up while a request runs.
 */
import { c } from 'ttag';
import {
    type DoneActorEvent,
    type ErrorActorEvent,
    type SnapshotFrom,
    assertEvent,
    assign,
    sendParent,
    setup,
    spawnChild,
    stopChild,
} from 'xstate';

import type { TwoFactorCredentials } from '@proton/shared/lib/api/auth';
import { PasswordError, TOTPError } from '@proton/shared/lib/authentication/error';
import type { AuthTypes } from '@proton/shared/lib/authentication/twoFactor';
import { getRequiresPasswordSetup } from '@proton/shared/lib/keys';
import type { OrganizationData } from '@proton/shared/lib/keys/unprivatization/helper';

import type { AuthSession } from '../../../../content/authSession';
import {
    ACCOUNT_FLOW_FAILED,
    type AccountFlowInput,
    type AccountFlowResult,
    NO_PASSWORD_POLICIES,
    failAccountFlow,
    failAccountFlowOnReport,
} from '../../../state-machine/accountFlow';
import {
    type StepErrorEvent,
    errorOf,
    isErrorOf,
    unprovidedAction,
    unprovidedActors,
} from '../../../state-machine/machineHelpers';
import type { SignInAuthState } from '../../../state-machine/signInAuthState';
import {
    type Lost2FAEnd,
    type Lost2FAParentEvent,
    lost2FAStateMachine,
} from '../screens/lost-two-factor/state-machine/lost2FAStateMachine';
import type { PasswordAccountActors } from './passwordAccountActors';

export type PasswordAccountScreen = 'twoFactor' | 'lostTwoFactor' | 'unlock' | 'newPassword';

export type PasswordAccountEvent =
    | { type: 'twoFactor.submitted'; payload: { credentials: TwoFactorCredentials } }
    /** The user changed the code; a rejected code's message goes. */
    | { type: 'twoFactor.codeEdited' }
    | { type: 'lost2FA.opened' }
    | { type: 'unlock.submitted'; payload: { password: string } }
    /** The user changed the second password; a rejected one's message goes. */
    | { type: 'unlock.passwordEdited' }
    | { type: 'newPassword.submitted'; payload: { password: string } }
    /** From the lost-2FA flow (a child actor): a backup code signed in, or an error to show. */
    | Lost2FAParentEvent
    /** The spawned lost-2FA flow ended, or crashed. */
    | DoneActorEvent<{ outcome: Lost2FAEnd }, 'lostTwoFactor'>
    | ErrorActorEvent<unknown, 'lostTwoFactor'>
    | { type: 'decision.back' };

export enum PasswordAccountStateMachineTags {
    /** A request runs; the current screen shows its loading state. */
    submitting = 'submitting',
}

interface PasswordAccountInput extends AccountFlowInput {
    /** Which second factors the account has, and whether it has a second password. */
    authTypes: AuthTypes;
    /** Whether VPN-only accounts get keys set up on sign-in. */
    setupVPN: boolean;
}

interface PasswordAccountMachineContext {
    auth: SignInAuthState;
    authTypes: AuthTypes;
    setupVPN: boolean;
    screen: PasswordAccountScreen | undefined;
    session: AuthSession | undefined;
    /** The organization's rules for the new password, loaded before the new password screen. */
    passwordPolicies: OrganizationData['passwordPolicies'];
    /** Why the last code was rejected; shown in the code form, like the backup code screen's. */
    twoFactorError: string | undefined;
    /** Why the last second password was rejected; shown in the unlock form, like the code form's. */
    unlockError: string | undefined;
    result: AccountFlowResult | undefined;
}

/** The screen that shows; the work states keep the last one up. */
export const selectScreen = ({ context }: { context: PasswordAccountMachineContext }) => context.screen;

/**
 * The id of the actor the screen belongs to: this flow, or while it's open, the lost-2FA flow, its child under that id.
 */
export const selectScreenActor = ({ context }: { context: PasswordAccountMachineContext }) =>
    context.screen === 'lostTwoFactor' ? ('lostTwoFactor' as const) : ('passwordAccount' as const);

/** Derived from the flow's auth state; the screens read them with `useSelector`. */
export const selectTwoFactorTypes = ({ context }: { context: PasswordAccountMachineContext }) =>
    context.authTypes.twoFactor;

/** The security key challenge, when the account signs in with one. */
export const selectFido2 = ({ context }: { context: PasswordAccountMachineContext }) =>
    context.auth.credentials.authResponse?.['2FA']?.FIDO2;

export const selectPasswordPolicies = ({ context }: { context: PasswordAccountMachineContext }) =>
    context.passwordPolicies;

/** Why the last code was rejected, for the code form. */
export const selectTwoFactorError = ({ context }: { context: PasswordAccountMachineContext }) => context.twoFactorError;

/** Guard: the lost-2FA flow ended with this outcome. */
const lostTwoFactorEnded = (outcome: Lost2FAEnd) => ({
    type: 'isLostTwoFactorOutcome' as const,
    params: ({ event }: { event: { output: { outcome: Lost2FAEnd } } }) => ({
        outcome: event.output.outcome,
        expected: outcome,
    }),
});

/**
 * Shows a screen other than the lost-2FA flow's. That flow outlives its own screen (see `lostTwoFactor`), so it stops
 * once another screen shows, and its id is free again for the next visit.
 */
const showScreen = (screen: Exclude<PasswordAccountScreen, 'lostTwoFactor'>) => [
    'stopLostTwoFactor' as const,
    { type: 'setScreen' as const, params: { screen } },
];

/** The session is ready: complete the sign-in, with the current screen still up. */
const completeWithSession = {
    target: '#passwordAccount.completing',
    actions: {
        type: 'setSession' as const,
        params: ({ event }: { event: { output: AuthSession } }) => ({ session: event.output }),
    },
};

export const passwordAccountStateMachine = setup({
    types: {
        context: {} as PasswordAccountMachineContext,
        events: {} as PasswordAccountEvent,
        input: {} as PasswordAccountInput,
        output: {} as AccountFlowResult,
        tags: {} as `${PasswordAccountStateMachineTags}`,
        children: {} as { lostTwoFactor: 'lostTwoFactorFlow' },
    },
    actors: {
        ...unprovidedActors<Omit<PasswordAccountActors, 'lostTwoFactorFlow'>>({
            loadAccount: true,
            completeSignIn: true,
            verifyTwoFactor: true,
            loadPasswordPolicies: true,
            setupPassword: true,
            finalize: true,
            unlockKeys: true,
        }),
        lostTwoFactorFlow: lost2FAStateMachine,
    },
    actions: {
        // Provided by `useSignInMachine` (or a test)
        goToResetPassword: (_, _params: { username: string }) => unprovidedAction('goToResetPassword'),
        setScreen: assign((_, params: { screen: PasswordAccountScreen }) => ({ screen: params.screen })),
        /** Only through `showScreen`: once another screen shows. */
        stopLostTwoFactor: stopChild('lostTwoFactor'),
        setSession: assign((_, params: { session: AuthSession }) => ({ session: params.session })),
        setResult: assign((_, params: { result: AccountFlowResult }) => ({ result: params.result })),
        /** The actors return what they loaded; these merge it into a new auth state. */
        setAccount: assign(({ context }, params: { account: Partial<SignInAuthState['account']> }) => ({
            auth: { ...context.auth, account: { ...context.auth.account, ...params.account } },
        })),
        /** Shown in the code form, so the user can try another code. */
        setTwoFactorError: assign((_, params: { error: unknown }) => ({
            twoFactorError:
                (params.error instanceof TOTPError && params.error.message) ||
                c('Error').t`Incorrect login credentials. Please try again.`,
        })),
        clearTwoFactorError: assign({ twoFactorError: undefined }),
        /** Shown in the unlock form, so the user can try again. */
        setUnlockError: assign((_, params: { error: unknown }) => ({
            unlockError:
                (params.error instanceof PasswordError && params.error.message) ||
                c('Error').t`Incorrect second password. Please try again.`,
        })),
        clearUnlockError: assign({ unlockError: undefined }),
        setPasswordPolicies: assign((_, params: { passwordPolicies: OrganizationData['passwordPolicies'] }) => ({
            passwordPolicies: params.passwordPolicies,
        })),
        reportError: sendParent((_, params: { error: unknown }): StepErrorEvent => ({
            type: 'step.errorReported',
            payload: { error: params.error },
        })),
    },
    guards: {
        hasTwoFactor: ({ context }) => context.authTypes.twoFactor.enabled,
        isErrorOf,
        isLostTwoFactorOutcome: (_, params: { outcome: Lost2FAEnd; expected: Lost2FAEnd }) =>
            params.outcome === params.expected,
        hasTemporaryPassword: ({ context }) =>
            context.auth.account.user?.Keys.length === 0 && !!context.auth.credentials.authResponse.TemporaryPassword,
        requiresPasswordSetup: ({ context }) => {
            const user = context.auth.account.user;
            return !!user && user.Keys.length === 0 && getRequiresPasswordSetup(user, context.setupVPN);
        },
        hasNoKeys: ({ context }) => context.auth.account.user?.Keys.length === 0,
        requiresSecondPassword: ({ context }) => context.authTypes.unlock,
    },
}).createMachine({
    id: 'passwordAccount',
    initial: 'routeTwoFactor',
    context: ({ input }) => ({
        auth: input.auth,
        authTypes: input.authTypes,
        setupVPN: input.setupVPN,
        screen: undefined,
        session: undefined,
        passwordPolicies: NO_PASSWORD_POLICIES,
        twoFactorError: undefined,
        unlockError: undefined,
        result: undefined,
    }),
    output: ({ context }) => context.result ?? { type: 'cancelled' },
    states: {
        routeTwoFactor: {
            always: [{ guard: 'hasTwoFactor', target: 'twoFactor' }, { target: 'loadingAccount' }],
        },

        twoFactor: {
            entry: [
                ...showScreen('twoFactor'),
                // A code rejected before leaving the screen doesn't show when coming back to it
                'clearTwoFactorError',
            ],
            initial: 'idle',
            // On the screen, so they also work while a code is checked: abandoning a check loses nothing
            on: {
                'twoFactor.codeEdited': { actions: 'clearTwoFactorError' },
                'decision.back': { target: 'cancelled' },
                'lost2FA.opened': { target: 'lostTwoFactor' },
            },
            states: {
                idle: {
                    on: {
                        'twoFactor.submitted': { target: 'submitting', actions: 'clearTwoFactorError' },
                    },
                },
                submitting: {
                    tags: [PasswordAccountStateMachineTags.submitting],
                    invoke: {
                        src: 'verifyTwoFactor',
                        input: ({ event }) => {
                            assertEvent(event, 'twoFactor.submitted');
                            return { credentials: event.payload.credentials };
                        },
                        onDone: { target: '#passwordAccount.loadingAccount' },
                        onError: [
                            {
                                guard: errorOf(TOTPError),
                                target: 'idle',
                                actions: { type: 'setTwoFactorError', params: ({ event }) => ({ error: event.error }) },
                            },
                            failAccountFlow,
                        ],
                    },
                },
            },
        },

        /**
         * Shows the lost-2FA flow, a child spawned on entry; it sends backup codes here to verify and ends with its
         * outcome. Spawned rather than invoked, so it outlives this state: after a valid code, its form stays up
         * with its loading state while the account loads and the sign-in completes.
         */
        lostTwoFactor: {
            entry: [
                { type: 'setScreen', params: { screen: 'lostTwoFactor' } },
                spawnChild('lostTwoFactorFlow', {
                    id: 'lostTwoFactor',
                    input: ({ context }) => {
                        const { credentials } = context.auth;
                        return {
                            username: credentials.username,
                            recoveryMethods: {
                                email: credentials.authResponse.HasRecoveryEmail,
                                phone: credentials.authResponse.HasRecoveryPhone,
                                phrase: credentials.authResponse.HasRecoveryPhrase,
                            },
                            twoFactorAuthTypes: context.authTypes.twoFactor,
                        };
                    },
                }),
            ],
            on: {
                'xstate.done.actor.lostTwoFactor': [
                    {
                        guard: lostTwoFactorEnded('returnToTwoFactor'),
                        target: 'twoFactor',
                    },
                    // Two-factor authentication is disabled: back to the credentials form, with the username, to
                    // sign in again in the page
                    { guard: lostTwoFactorEnded('signInAgain'), target: 'cancelled' },
                ],
                // Resetting the password leaves the page; the flow stays on its screen, loading, until it unloads
                'lost2FA.passwordResetChosen': {
                    actions: {
                        type: 'goToResetPassword',
                        params: ({ context }) => ({ username: context.auth.credentials.username }),
                    },
                },
                // The flow or one of its verifications crashed
                'xstate.error.actor.lostTwoFactor': failAccountFlow,
                'lost2FA.backupCodeAccepted': { target: 'loadingAccount' },
                'lost2FA.backupCodeFailed': failAccountFlowOnReport,
                'lost2FA.errorReported': {
                    actions: { type: 'reportError', params: ({ event }) => ({ error: event.payload.error }) },
                },
            },
        },

        loadingAccount: {
            tags: [PasswordAccountStateMachineTags.submitting],
            invoke: {
                src: 'loadAccount',
                onDone: {
                    target: 'routeAccount',
                    actions: { type: 'setAccount', params: ({ event }) => ({ account: event.output }) },
                },
                onError: failAccountFlow,
            },
        },

        /** Decides how to finish from the account's keys and settings. */
        routeAccount: {
            always: [
                { guard: 'hasTemporaryPassword', target: 'loadingPasswordPolicies' },
                { guard: 'requiresPasswordSetup', target: 'settingUpPassword' },
                { guard: 'hasNoKeys', target: 'finalizing' },
                { guard: 'requiresSecondPassword', target: 'unlock' },
                { target: 'unlockingKeys' },
            ],
        },

        loadingPasswordPolicies: {
            tags: [PasswordAccountStateMachineTags.submitting],
            invoke: {
                src: 'loadPasswordPolicies',
                input: ({ context }) => ({ auth: context.auth }),
                onDone: {
                    target: 'newPassword',
                    actions: {
                        type: 'setPasswordPolicies',
                        params: ({ event }) => ({ passwordPolicies: event.output }),
                    },
                },
                onError: failAccountFlow,
            },
        },

        /** The account has no keys yet; create them with the sign-in password. */
        settingUpPassword: {
            tags: [PasswordAccountStateMachineTags.submitting],
            invoke: {
                src: 'setupPassword',
                input: ({ context }) => {
                    const auth = context.auth;
                    return { auth, password: auth.credentials.loginPassword };
                },
                onDone: completeWithSession,
                onError: failAccountFlow,
            },
        },

        finalizing: {
            tags: [PasswordAccountStateMachineTags.submitting],
            invoke: {
                src: 'finalize',
                input: ({ context }) => ({ auth: context.auth }),
                onDone: completeWithSession,
                onError: failAccountFlow,
            },
        },

        /** One-password mode: the sign-in password also unlocks the keys. */
        unlockingKeys: {
            tags: [PasswordAccountStateMachineTags.submitting],
            invoke: {
                src: 'unlockKeys',
                input: ({ context }) => {
                    const auth = context.auth;
                    return { auth, password: auth.credentials.loginPassword, isOnePasswordMode: true };
                },
                onDone: completeWithSession,
                onError: failAccountFlow,
            },
        },

        /** Two-password mode: unlock the keys with the second password. */
        unlock: {
            entry: [
                ...showScreen('unlock'),
                // A password rejected before leaving the screen doesn't show when coming back to it
                'clearUnlockError',
            ],
            initial: 'idle',
            on: {
                'unlock.passwordEdited': { actions: 'clearUnlockError' },
                'decision.back': { target: 'cancelled' },
            },
            states: {
                idle: {
                    on: {
                        'unlock.submitted': { target: 'submitting', actions: 'clearUnlockError' },
                    },
                },
                submitting: {
                    tags: [PasswordAccountStateMachineTags.submitting],
                    // Back is ignored: by then a session may be persisted, which leaving would drop
                    on: { 'decision.back': {} },
                    invoke: {
                        src: 'unlockKeys',
                        input: ({ context, event }) => {
                            assertEvent(event, 'unlock.submitted');
                            return {
                                auth: context.auth,
                                password: event.payload.password,
                                isOnePasswordMode: false,
                            };
                        },
                        onDone: completeWithSession,
                        onError: [
                            {
                                guard: errorOf(PasswordError),
                                target: 'idle',
                                actions: { type: 'setUnlockError', params: ({ event }) => ({ error: event.error }) },
                            },
                            failAccountFlow,
                        ],
                    },
                },
            },
        },

        /** Signed in with a temporary password; replace it. */
        newPassword: {
            entry: showScreen('newPassword'),
            initial: 'idle',
            on: {
                'decision.back': { target: 'cancelled' },
            },
            states: {
                idle: {
                    on: {
                        'newPassword.submitted': { target: 'submitting' },
                    },
                },
                submitting: {
                    tags: [PasswordAccountStateMachineTags.submitting],
                    // Back is ignored: by then the password may be changed, which leaving would drop
                    on: { 'decision.back': {} },
                    invoke: {
                        src: 'setupPassword',
                        input: ({ context, event }) => {
                            assertEvent(event, 'newPassword.submitted');
                            return { auth: context.auth, password: event.payload.password };
                        },
                        onDone: completeWithSession,
                        onError: failAccountFlow,
                    },
                },
            },
        },

        /** Hands the session to the app; the current screen stays up with its loading state. */
        completing: {
            tags: [PasswordAccountStateMachineTags.submitting],
            invoke: {
                src: 'completeSignIn',
                input: ({ context }) => ({ session: context.session }),
                onDone: { target: 'handedOver' },
                onError: failAccountFlow,
            },
        },

        /**
         * The app has the session. The screen stays up, loading, until the app takes the sign-in away: a redirect to
         * another app keeps the page until the next one loads.
         */
        handedOver: {
            tags: [PasswordAccountStateMachineTags.submitting],
        },

        cancelled: {
            type: 'final',
            entry: { type: 'setResult', params: { result: { type: 'cancelled' } } },
        },
        failed: {
            id: ACCOUNT_FLOW_FAILED,
            type: 'final',
        },
    },
});

export const selectUnlockError = ({ context }: { context: PasswordAccountMachineContext }) => context.unlockError;

type PasswordAccountSnapshot = SnapshotFrom<typeof passwordAccountStateMachine>;

/** A request runs; the screen shows its loading state. */
export const selectSubmitting = (snapshot: PasswordAccountSnapshot) =>
    snapshot.hasTag(PasswordAccountStateMachineTags.submitting);
