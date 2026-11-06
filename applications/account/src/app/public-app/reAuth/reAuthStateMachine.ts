/**
 * Re-authentication of a signed-in session before a fork: with the password (SRP), then the key password in
 * two-password mode, or for SSO accounts with the identity provider or the backup password. Each step ends with the
 * login, so a failure keeps the user on the step. `createReAuthActors` provides the actors.
 */
import { type SnapshotFrom, assertEvent, assign, emit, setup } from 'xstate';

import type { KeySalt } from '@proton/shared/lib/interfaces/KeySalt';
import { getIsGlobalSSOAccount, getIsSSOVPNOnlyAccount } from '@proton/shared/lib/keys/accountType';

import { reportActorError, unprovidedActors } from '../sign-in/state-machine/machineHelpers';
import type { ReAuthActors } from './reAuthActors';
import type { ReAuthState } from './reauthContainerState';

export type ReAuthEvent =
    | { type: 'password.submitted'; password: string }
    | { type: 'unlockPassword.submitted'; keyPassword: string }
    | { type: 'backupPassword.submitted'; keyPassword: string }
    | { type: 'idp.started' }
    | { type: 'idp.authenticated' }
    | { type: 'idp.cancelled' };

export type ReAuthEmitted = { type: 'error'; error: unknown };

interface ReAuthContext {
    state: ReAuthState;
    /** The key salts, once fetched. */
    salts: KeySalt[] | undefined;
    /** The backup password: unlike the sign-in's, it's kept in context to outlive the identity provider's step. */
    backupPassword: string;
}

enum ReAuthStateMachineTags {
    /** A request runs; the form shows its loading state. */
    submitting = 'submitting',
    /** The SSO modal shows: the identity provider authenticates the session. */
    awaitingProvider = 'awaitingProvider',
}

export const reAuthStateMachine = setup({
    types: {
        context: {} as ReAuthContext,
        events: {} as ReAuthEvent,
        emitted: {} as ReAuthEmitted,
        input: {} as ReAuthState,
        tags: {} as `${ReAuthStateMachineTags}`,
    },
    actors: unprovidedActors<ReAuthActors>({
        preSubmit: true,
        submitPassword: true,
        unlockKeys: true,
        fetchSSOSalts: true,
        loginWithIdP: true,
    }),
    actions: {
        /** Hands the error to the page to show. */
        reportError: emit((_, { error }: { error: unknown }) => ({ type: 'error' as const, error })),
        assignSalts: assign((_, { salts }: { salts: KeySalt[] | undefined }) => ({ salts })),
        assignBackupPassword: assign((_, { backupPassword }: { backupPassword: string }) => ({ backupPassword })),
        forgetBackupPassword: assign({ backupPassword: '' }),
    },
    guards: {
        /** SSO accounts that re-authenticate with the identity provider start with it. */
        startsWithIdP: ({ context: { state } }) =>
            getIsGlobalSSOAccount(state.session.data.User) &&
            (state.reAuthType === 'default' || getIsSSOVPNOnlyAccount(state.session.data.User)),
        hasSalts: (_, { salts }: { salts: KeySalt[] | undefined }) => salts !== undefined,
    },
}).createMachine({
    id: 'reAuth',
    initial: 'starting',
    context: ({ input }) => ({ state: input, salts: undefined, backupPassword: '' }),
    states: {
        starting: {
            always: [{ guard: 'startsWithIdP', target: 'withIdP' }, { target: 'awaitingPassword' }],
        },
        awaitingPassword: {
            on: {
                'password.submitted': 'submittingPassword',
                'backupPassword.submitted': {
                    target: 'withBackupPassword',
                    actions: {
                        type: 'assignBackupPassword',
                        params: ({ event }) => ({ backupPassword: event.keyPassword }),
                    },
                },
                'idp.started': 'withIdP',
            },
        },
        submittingPassword: {
            tags: [ReAuthStateMachineTags.submitting],
            invoke: {
                src: 'submitPassword',
                input: ({ context, event }) => {
                    assertEvent(event, 'password.submitted');
                    return { state: context.state, password: event.password };
                },
                // Signed in, or the keys have their own password
                onDone: {
                    guard: { type: 'hasSalts', params: ({ event }) => ({ salts: event.output.unlockWithSalts }) },
                    target: 'awaitingUnlockPassword',
                    actions: { type: 'assignSalts', params: ({ event }) => ({ salts: event.output.unlockWithSalts }) },
                },
                onError: { target: 'awaitingPassword', actions: reportActorError },
            },
        },
        awaitingUnlockPassword: {
            on: { 'unlockPassword.submitted': 'unlocking' },
        },
        unlocking: {
            tags: [ReAuthStateMachineTags.submitting],
            invoke: {
                src: 'unlockKeys',
                input: ({ context, event }) => {
                    assertEvent(event, 'unlockPassword.submitted');
                    return { state: context.state, keyPassword: event.keyPassword, salts: context.salts ?? [] };
                },
                onError: { target: 'awaitingUnlockPassword', actions: reportActorError },
            },
        },
        withIdP: {
            initial: 'preparing',
            states: {
                preparing: {
                    invoke: { src: 'preSubmit', onDone: 'authenticatingWithIdP', onError: 'authenticatingWithIdP' },
                },
                authenticatingWithIdP: {
                    tags: [ReAuthStateMachineTags.awaitingProvider],
                    on: { 'idp.authenticated': 'signingIn', 'idp.cancelled': '#reAuth.awaitingPassword' },
                },
                signingIn: {
                    tags: [ReAuthStateMachineTags.submitting],
                    invoke: {
                        src: 'loginWithIdP',
                        input: ({ context }) => context.state,
                        onError: { target: '#reAuth.awaitingPassword', actions: reportActorError },
                    },
                },
            },
        },
        withBackupPassword: {
            tags: [ReAuthStateMachineTags.submitting],
            initial: 'fetchingSalts',
            exit: 'forgetBackupPassword',
            states: {
                fetchingSalts: {
                    invoke: {
                        src: 'fetchSSOSalts',
                        input: ({ context }) => context.salts,
                        onDone: [
                            {
                                guard: { type: 'hasSalts', params: ({ event }) => ({ salts: event.output }) },
                                target: 'unlocking',
                                actions: { type: 'assignSalts', params: ({ event }) => ({ salts: event.output }) },
                            },
                            // The session is still locked: the identity provider unlocks it first
                            { target: 'authenticatingWithIdP' },
                        ],
                        onError: { target: '#reAuth.awaitingPassword', actions: reportActorError },
                    },
                },
                authenticatingWithIdP: {
                    tags: [ReAuthStateMachineTags.awaitingProvider],
                    on: { 'idp.authenticated': 'refetchingSalts', 'idp.cancelled': '#reAuth.awaitingPassword' },
                },
                refetchingSalts: {
                    invoke: {
                        src: 'fetchSSOSalts',
                        input: () => undefined,
                        onDone: [
                            {
                                guard: { type: 'hasSalts', params: ({ event }) => ({ salts: event.output }) },
                                target: 'unlocking',
                                actions: { type: 'assignSalts', params: ({ event }) => ({ salts: event.output }) },
                            },
                            { target: '#reAuth.awaitingPassword' },
                        ],
                        onError: { target: '#reAuth.awaitingPassword', actions: reportActorError },
                    },
                },
                unlocking: {
                    invoke: {
                        src: 'unlockKeys',
                        input: ({ context }) => ({
                            state: context.state,
                            keyPassword: context.backupPassword,
                            salts: context.salts ?? [],
                        }),
                        // Signed in: the page leaves, or the login shows its next step
                        onDone: { actions: 'forgetBackupPassword' },
                        onError: { target: '#reAuth.awaitingPassword', actions: reportActorError },
                    },
                },
            },
        },
    },
});

type ReAuthSnapshot = SnapshotFrom<typeof reAuthStateMachine>;

/** A request runs; the form shows its loading state. */
export const selectSubmitting = (snapshot: ReAuthSnapshot) => snapshot.hasTag(ReAuthStateMachineTags.submitting);

/** The SSO modal shows: the identity provider authenticates the session. */
export const selectAwaitingProvider = (snapshot: ReAuthSnapshot) =>
    snapshot.hasTag(ReAuthStateMachineTags.awaitingProvider);
