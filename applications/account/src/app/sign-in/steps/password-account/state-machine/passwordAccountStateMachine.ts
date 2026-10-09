/**
 * The password account flow: after a password (SRP) sign-in, the sign-in machine runs this as a child with the
 * auth state. Second factor (or the lost-2FA flow), loading the account, then whatever the account needs: a new
 * password, key setup, the second password, or unlocking with the login password. An account recovered through a
 * claimed address also needs a new address (`claimedAddress`), created before the session is. It completes the
 * sign-in itself, then waits on its last screen, loading, until the app takes the sign-in away (`handedOver`); it only
 * ends, with a result, when cancelled or failed.
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
import { ClaimableAddressType } from '@proton/shared/lib/keys/setupAddress';
import type { OrganizationData } from '@proton/shared/lib/keys/unprivatization/helper';

import type { AuthSession } from '../../../../content/authSession';
import type { ClaimedAddressSetup, UnlockedKeys } from '../../../auth/claimedAddress';
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

export type PasswordAccountScreen =
    'twoFactor' | 'lostTwoFactor' | 'unlock' | 'newPassword' | 'claimedAddressCreate' | 'claimedAddressDone';

export type PasswordAccountEvent =
    | { type: 'twoFactor.submitted'; payload: { credentials: TwoFactorCredentials } }
    /** The user changed the code; a rejected code's message goes. */
    | { type: 'twoFactor.codeEdited' }
    | { type: 'lost2FA.opened' }
    | { type: 'unlock.submitted'; payload: { password: string } }
    /** The user changed the second password; a rejected one's message goes. */
    | { type: 'unlock.passwordEdited' }
    | { type: 'newPassword.submitted'; payload: { password: string } }
    /** The new address for an account recovered through a claimed address. */
    | { type: 'claimedAddress.submitted'; payload: { username: string; domain: string } }
    /** From the screen telling where the recovered account's data now lives. */
    | { type: 'claimedAddress.continued' }
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
    /** How the claimed-address recovery finishes, once loaded. */
    claimedAddressSetup: ClaimedAddressSetup | undefined;
    /** The unlocked keys, for the new address's key; only while it's being created. */
    unlocked: UnlockedKeys | undefined;
    /** The address the recovery created. */
    createdAddress: string | undefined;
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

/** The address the user recovered from, as they typed it: the sign-in's username. */
export const selectClaimedEmail = ({ context }: { context: PasswordAccountMachineContext }) =>
    context.auth.credentials.username;

/** Where the new address can be created, for the claimed-address recovery's create screen. */
export const selectClaimedAddressGeneration = ({ context }: { context: PasswordAccountMachineContext }) =>
    context.claimedAddressSetup?.type === 'create' ? context.claimedAddressSetup.generation : undefined;

/** Where the recovered account's data now lives: a new address, or one the account already had. */
export const selectClaimedAddressDone = ({ context }: { context: PasswordAccountMachineContext }) => {
    if (context.createdAddress) {
        return { variant: 'created' as const, address: context.createdAddress };
    }
    if (context.claimedAddressSetup?.type === 'migrated') {
        return { variant: 'migrated' as const, address: context.claimedAddressSetup.address };
    }
};

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
            loadClaimedAddressSetup: true,
            unlockKeyPassword: true,
            createClaimedAddress: true,
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
        setClaimedAddressSetup: assign((_, params: { setup: ClaimedAddressSetup }) => ({
            claimedAddressSetup: params.setup,
        })),
        setUnlocked: assign((_, params: UnlockedKeys) => ({ unlocked: params })),
        /** The temporary password's replacement, which the new address's keys are set up with. */
        setLoginPassword: assign(({ context }, params: { password: string }) => ({
            auth: { ...context.auth, credentials: { ...context.auth.credentials, loginPassword: params.password } },
        })),
        /** The address exists and the session with it: the key password isn't needed anymore. */
        setCreatedAddress: assign((_, params: { address: string }) => ({
            createdAddress: params.address,
            unlocked: undefined,
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
        /** Recovered through a claimed address, whose account needs somewhere for its data to live. */
        isClaimedAddressRecovery: ({ context }) => !!context.auth.credentials.claimedAddress,
        isMigratedClaimedAddress: (_, params: { setup: ClaimedAddressSetup }) => params.setup.type === 'migrated',
        /** Unlocking for the new address's key, rather than to sign in. */
        isCreatingClaimedAddress: ({ context }) =>
            context.claimedAddressSetup?.type === 'create' && !context.createdAddress,
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
        claimedAddressSetup: undefined,
        unlocked: undefined,
        createdAddress: undefined,
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

        /**
         * Decides how to finish from the account's keys and settings. A claimed-address recovery goes first: replacing
         * a temporary password or setting up keys would otherwise create the session, or an address, before the new
         * one.
         */
        routeAccount: {
            always: [
                { guard: 'isClaimedAddressRecovery', target: 'claimedAddress' },
                { target: 'routeTemporaryPassword' },
            ],
        },

        routeTemporaryPassword: {
            always: [{ guard: 'hasTemporaryPassword', target: 'loadingPasswordPolicies' }, { target: 'routeKeys' }],
        },

        /** How the keys are set up or unlocked, which creates the session. */
        routeKeys: {
            always: [
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
                        'unlock.submitted': [
                            {
                                guard: 'isCreatingClaimedAddress',
                                target: 'unlockingForAddress',
                                actions: 'clearUnlockError',
                            },
                            { target: 'submitting', actions: 'clearUnlockError' },
                        ],
                    },
                },
                /** Only unlocks: the new address is created next, and with it the session. */
                unlockingForAddress: {
                    tags: [PasswordAccountStateMachineTags.submitting],
                    invoke: {
                        src: 'unlockKeyPassword',
                        input: ({ context, event }) => {
                            assertEvent(event, 'unlock.submitted');
                            return { auth: context.auth, password: event.payload.password, isOnePasswordMode: false };
                        },
                        onDone: {
                            target: '#passwordAccount.claimedAddress.create',
                            actions: {
                                type: 'setUnlocked',
                                params: ({ event }) => event.output,
                            },
                        },
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
                        'newPassword.submitted': [
                            {
                                // Kept for the new address's keys, which set it as the account's password
                                guard: 'isCreatingClaimedAddress',
                                target: '#passwordAccount.claimedAddress.create',
                                actions: {
                                    type: 'setLoginPassword',
                                    params: ({ event }) => ({ password: event.payload.password }),
                                },
                            },
                            { target: 'submitting' },
                        ],
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

        /**
         * The account was recovered through a claimed address, which is disabled. If it still has an enabled address,
         * the user only learns that their data lives there: the API cleared the claim with this sign-in already, so the
         * address no longer leads here. Otherwise they create a new address, and the session is created only once it
         * exists; the API keeps the claim until then, so leaving before signs nothing in and the next sign-in offers
         * recovery again.
         */
        claimedAddress: {
            initial: 'loading',
            states: {
                loading: {
                    tags: [PasswordAccountStateMachineTags.submitting],
                    invoke: {
                        src: 'loadClaimedAddressSetup',
                        input: ({ context }) => ({ auth: context.auth }),
                        onDone: [
                            {
                                guard: {
                                    type: 'isMigratedClaimedAddress',
                                    params: ({ event }) => ({ setup: event.output }),
                                },
                                target: 'migrated',
                                actions: {
                                    type: 'setClaimedAddressSetup',
                                    params: ({ event }) => ({ setup: event.output }),
                                },
                            },
                            {
                                target: 'routeUnlock',
                                actions: {
                                    type: 'setClaimedAddressSetup',
                                    params: ({ event }) => ({ setup: event.output }),
                                },
                            },
                        ],
                        onError: failAccountFlow,
                    },
                },

                /** Nothing to create: tell where the data lives, then sign in as usual. */
                migrated: {
                    entry: showScreen('claimedAddressDone'),
                    on: {
                        'claimedAddress.continued': { target: '#passwordAccount.routeTemporaryPassword' },
                        // The claim is already cleared, so leaving would lose the only notice of where the data went
                        'decision.back': {},
                    },
                },

                /**
                 * The new address's key needs the key password; an account without keys gets them with it, protected
                 * by the login password. A temporary login password is replaced first, by the new password screen.
                 */
                routeUnlock: {
                    always: [
                        { guard: 'hasTemporaryPassword', target: '#passwordAccount.loadingPasswordPolicies' },
                        { guard: 'hasNoKeys', target: 'create' },
                        { guard: 'requiresSecondPassword', target: '#passwordAccount.unlock' },
                        { target: 'unlockingKeyPassword' },
                    ],
                },

                /** One-password mode: the sign-in password also unlocks the keys. */
                unlockingKeyPassword: {
                    tags: [PasswordAccountStateMachineTags.submitting],
                    invoke: {
                        src: 'unlockKeyPassword',
                        input: ({ context }) => ({
                            auth: context.auth,
                            password: context.auth.credentials.loginPassword,
                            isOnePasswordMode: true,
                        }),
                        onDone: {
                            target: 'create',
                            actions: {
                                type: 'setUnlocked',
                                params: ({ event }) => event.output,
                            },
                        },
                        onError: failAccountFlow,
                    },
                },

                create: {
                    entry: showScreen('claimedAddressCreate'),
                    initial: 'idle',
                    on: {
                        'decision.back': { target: '#passwordAccount.cancelled' },
                    },
                    states: {
                        idle: {
                            on: {
                                'claimedAddress.submitted': { target: 'submitting' },
                            },
                        },
                        submitting: {
                            tags: [PasswordAccountStateMachineTags.submitting],
                            // Back is ignored: by then the address may exist, which leaving would hide
                            on: { 'decision.back': {} },
                            invoke: {
                                src: 'createClaimedAddress',
                                input: ({ context, event }) => {
                                    assertEvent(event, 'claimedAddress.submitted');
                                    const generation =
                                        context.claimedAddressSetup?.type === 'create'
                                            ? context.claimedAddressSetup.generation
                                            : undefined;
                                    return {
                                        auth: context.auth,
                                        unlocked: context.unlocked,
                                        username: event.payload.username,
                                        domain: event.payload.domain,
                                        checkAvailability:
                                            generation?.claimableAddress?.type !== ClaimableAddressType.Fixed,
                                    };
                                },
                                onDone: {
                                    target: '#passwordAccount.claimedAddress.created',
                                    actions: [
                                        {
                                            type: 'setSession',
                                            params: ({ event }) => ({ session: event.output.session }),
                                        },
                                        {
                                            type: 'setCreatedAddress',
                                            params: ({ event }) => ({ address: event.output.address }),
                                        },
                                    ],
                                },
                                // A taken username or a failed request: stay on the form and show it
                                onError: {
                                    target: 'idle',
                                    actions: { type: 'reportError', params: ({ event }) => ({ error: event.error }) },
                                },
                            },
                        },
                    },
                },

                /** The address and the session exist: tell where the data now lives, then hand the session over. */
                created: {
                    entry: showScreen('claimedAddressDone'),
                    on: {
                        'claimedAddress.continued': { target: '#passwordAccount.completing' },
                        // Signed in by now, which leaving would drop
                        'decision.back': {},
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
