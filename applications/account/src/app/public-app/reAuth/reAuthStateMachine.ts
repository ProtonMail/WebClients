/**
 * Re-authentication of a signed-in session before a fork: with the password (SRP), then the key password in
 * two-password mode, or for SSO accounts with the identity provider or the backup password. Each step ends with the
 * login, so a failure keeps the user on the step. An admin or delegated session signs in with the admin's or trusted
 * contact's own account, so the machine first asks the API how that account signs in, and never unlocks keys.
 * `createReAuthActors` provides the actors.
 */
import { type SnapshotFrom, assertEvent, assign, emit, setup } from 'xstate';

import type { KeySalt } from '@proton/shared/lib/interfaces/KeySalt';
import { getIsSSOAccount, getIsSSOVPNOnlyAccount } from '@proton/shared/lib/keys/accountType';
import { isSelf } from '@proton/shared/lib/user/helpers';

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

export type ReAuthMethod = 'password' | 'idp' | 'backupPassword';

interface ReAuthContext {
    state: ReAuthState;
    /** The key salts, once fetched. */
    salts: KeySalt[] | undefined;
    /** The backup password: unlike the sign-in's, it's kept in context to outlive the identity provider's step. */
    backupPassword: string;
    /** How the user re-authenticates; undefined while an admin or delegated session asks the API. */
    method: ReAuthMethod | undefined;
    /** Whether the password re-authentication unlocks the keys, see `getNeedsKeys`. */
    needsKeys: boolean;
}

/**
 * How the account's own user re-authenticates. An SSO account uses its backup password when the fork needs its keys,
 * and the identity provider otherwise or when it has no keys (VPN only).
 */
const getOwnMethod = ({ session, reAuthType }: ReAuthState): ReAuthMethod => {
    const { User } = session.data;
    if (!getIsSSOAccount(User)) {
        return 'password';
    }
    return reAuthType === 'default' || getIsSSOVPNOnlyAccount(User) ? 'idp' : 'backupPassword';
};

/**
 * Whether a password re-authentication has to unlock the keys: the fork needs them, the session doesn't keep them in an
 * offline key, and the password is this account's own (an admin's or trusted contact's doesn't unlock its keys).
 */
const getNeedsKeys = ({ session, reAuthType }: ReAuthState) =>
    reAuthType !== 'default' &&
    isSelf(session.data.User) &&
    !session.data.offlineKey &&
    session.data.User.Keys.length > 0;

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
        fetchMethod: true,
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
        assignMethod: assign((_, { method }: { method: ReAuthMethod }) => ({ method })),
    },
    guards: {
        hasNoMethod: ({ context }) => context.method === undefined,
        usesIdP: ({ context }) => context.method === 'idp',
        hasSalts: (_, { salts }: { salts: KeySalt[] | undefined }) => salts !== undefined,
    },
}).createMachine({
    id: 'reAuth',
    initial: 'starting',
    context: ({ input }) => ({
        state: input,
        salts: undefined,
        backupPassword: '',
        method: isSelf(input.session.data.User) ? getOwnMethod(input) : undefined,
        needsKeys: getNeedsKeys(input),
    }),
    states: {
        starting: {
            always: [
                { guard: 'hasNoMethod', target: 'fetchingMethod' },
                { guard: 'usesIdP', target: 'withIdP' },
                { target: 'awaitingPassword' },
            ],
        },
        fetchingMethod: {
            invoke: {
                src: 'fetchMethod',
                onDone: {
                    target: 'starting',
                    actions: { type: 'assignMethod', params: ({ event }) => ({ method: event.output }) },
                },
                onError: {
                    target: 'starting',
                    actions: [{ type: 'assignMethod', params: { method: 'password' } }, reportActorError],
                },
            },
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
                    return { state: context.state, password: event.password, needsKeys: context.needsKeys };
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

/** How the user re-authenticates; undefined while it loads. */
export const selectMethod = (snapshot: ReAuthSnapshot) => snapshot.context.method;
