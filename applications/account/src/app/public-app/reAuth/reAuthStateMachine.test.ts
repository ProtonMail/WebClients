import { createActor, fromPromise, waitFor } from 'xstate';

import { BackupPasswordError, SecondPasswordError } from '@proton/shared/lib/authentication/error';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { KeySalt } from '@proton/shared/lib/interfaces/KeySalt';
import type { User } from '@proton/shared/lib/interfaces/User';
import { UserType } from '@proton/shared/lib/interfaces/User';

import type { AuthSession } from '../authSession';
import { InvalidLoginError } from '../sign-in/steps/credentials/state-machine/credentialsErrors';
import {
    reAuthStateMachine,
    selectAwaitingProvider,
    selectMethod,
    selectPasswordError,
    selectSubmitting,
} from './reAuthStateMachine';
import type { ReAuthState } from './reauthContainerState';

const salts: KeySalt[] = [{ ID: 'key', KeySalt: 'salt' }];

const getState = (user: Partial<User>, reAuthType: ReAuthState['reAuthType'] = 'offline'): ReAuthState => ({
    session: { data: { User: { Keys: [], Flags: {}, ...user } } } as unknown as AuthSession,
    reAuthType,
});

// A global SSO account: it has keys, so the backup password unlocks them
const ssoUser: Partial<User> = {
    Type: UserType.MANAGED,
    Flags: { sso: true } as User['Flags'],
    Keys: [{ ID: 'key' }] as User['Keys'],
};

const start = (
    state: ReAuthState,
    actors: Partial<{
        submitPassword: () => Promise<{ unlockWithSalts: KeySalt[] | undefined }>;
        unlockKeys: (input: { keyPassword: string; salts: KeySalt[] }) => Promise<void>;
        fetchSSOSalts: (cachedSalts: KeySalt[] | undefined) => Promise<KeySalt[] | undefined>;
        loginWithIdP: () => Promise<void>;
        fetchMethod: () => Promise<'idp' | 'password'>;
    }> = {}
) => {
    const onError = vi.fn();
    const never = () => new Promise<never>(() => {});
    const actor = createActor(
        reAuthStateMachine.provide({
            actors: {
                preSubmit: fromPromise(async () => {}),
                fetchMethod: fromPromise(actors.fetchMethod ?? never),
                submitPassword: fromPromise(actors.submitPassword ?? never),
                unlockKeys: fromPromise(({ input }) => (actors.unlockKeys ?? never)(input)),
                fetchSSOSalts: fromPromise(({ input }) => (actors.fetchSSOSalts ?? never)(input)),
                loginWithIdP: fromPromise(actors.loginWithIdP ?? never),
            },
        }),
        { input: state }
    );
    actor.on('error', ({ error }) => onError(error));
    actor.start();
    return { actor, onError };
};

describe('reAuthStateMachine', () => {
    it('asks for the key password when the keys have their own password', async () => {
        const unlockKeys = vi.fn(() => new Promise<void>(() => {}));
        const { actor } = start(getState({}), {
            submitPassword: async () => ({ unlockWithSalts: salts }),
            unlockKeys,
        });
        actor.send({ type: 'password.submitted', password: 'password' });
        expect(selectSubmitting(actor.getSnapshot())).toBe(true);
        await waitFor(actor, (state) => state.matches('awaitingUnlockPassword'));
        expect(selectSubmitting(actor.getSnapshot())).toBe(false);
        actor.send({ type: 'unlockPassword.submitted', keyPassword: 'key password' });
        expect(unlockKeys).toHaveBeenCalledWith(expect.objectContaining({ keyPassword: 'key password', salts }));
    });

    it('keeps the password step after a failure', async () => {
        const error = new Error('Incorrect login credentials');
        const { actor, onError } = start(getState({}), { submitPassword: () => Promise.reject(error) });
        actor.send({ type: 'password.submitted', password: 'password' });
        await waitFor(actor, (state) => state.matches('awaitingPassword'));
        expect(onError).toHaveBeenCalledWith(error);
        expect(selectPasswordError(actor.getSnapshot())).toBeUndefined();
    });

    it('shows a wrong password under its field until it is edited', async () => {
        const wrongPassword = new InvalidLoginError({
            status: 422,
            data: {
                Code: API_CUSTOM_ERROR_CODES.INVALID_LOGIN,
                Error: 'Incorrect login credentials. Please try again',
            },
        });
        const { actor, onError } = start(getState({}), { submitPassword: () => Promise.reject(wrongPassword) });
        actor.send({ type: 'password.submitted', password: 'password' });
        await waitFor(actor, (state) => state.matches('awaitingPassword'));
        expect(selectPasswordError(actor.getSnapshot())).toBe('Incorrect login credentials. Please try again');
        expect(onError).not.toHaveBeenCalled();
        actor.send({ type: 'password.edited' });
        expect(selectPasswordError(actor.getSnapshot())).toBeUndefined();
    });

    it('shows a wrong second password under its field until it is submitted again', async () => {
        const unlockKeys = vi
            .fn()
            .mockRejectedValueOnce(new SecondPasswordError())
            .mockReturnValue(new Promise(() => {}));
        const { actor, onError } = start(getState({}), {
            submitPassword: async () => ({ unlockWithSalts: salts }),
            unlockKeys,
        });
        actor.send({ type: 'password.submitted', password: 'password' });
        await waitFor(actor, (state) => state.matches('awaitingUnlockPassword'));
        actor.send({ type: 'unlockPassword.submitted', keyPassword: 'key password' });
        await waitFor(actor, (state) => selectPasswordError(state) !== undefined);
        expect(actor.getSnapshot().value).toBe('awaitingUnlockPassword');
        expect(onError).not.toHaveBeenCalled();
        actor.send({ type: 'unlockPassword.submitted', keyPassword: 'other key password' });
        expect(selectPasswordError(actor.getSnapshot())).toBeUndefined();
    });

    it('shows a wrong backup password under its field', async () => {
        const { actor, onError } = start(getState(ssoUser), {
            fetchSSOSalts: async () => salts,
            unlockKeys: () => Promise.reject(new BackupPasswordError()),
        });
        actor.send({ type: 'backupPassword.submitted', keyPassword: 'backup password' });
        await waitFor(actor, (state) => state.matches('awaitingPassword'));
        expect(selectPasswordError(actor.getSnapshot())).toBe('Incorrect backup password. Please try again.');
        expect(onError).not.toHaveBeenCalled();
    });

    it('starts with the identity provider for an SSO account, and offers it again when cancelled', async () => {
        const loginWithIdP = vi.fn(() => new Promise<void>(() => {}));
        const { actor } = start(getState(ssoUser, 'default'), { loginWithIdP });
        await waitFor(actor, selectAwaitingProvider);
        actor.send({ type: 'idp.cancelled' });
        expect(actor.getSnapshot().value).toBe('awaitingPassword');

        actor.send({ type: 'idp.started' });
        await waitFor(actor, selectAwaitingProvider);
        actor.send({ type: 'idp.authenticated' });
        expect(loginWithIdP).toHaveBeenCalled();
        expect(selectSubmitting(actor.getSnapshot())).toBe(true);
    });

    it('unlocks the session with the identity provider before reading the salts for the backup password', async () => {
        const fetchSSOSalts = vi.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce(salts);
        const unlockKeys = vi.fn(() => new Promise<void>(() => {}));
        const { actor } = start(getState(ssoUser), { fetchSSOSalts, unlockKeys });
        expect(actor.getSnapshot().value).toBe('awaitingPassword');
        actor.send({ type: 'backupPassword.submitted', keyPassword: 'backup password' });
        await waitFor(actor, (state) => state.matches({ withBackupPassword: 'authenticatingWithIdP' }));
        expect(selectAwaitingProvider(actor.getSnapshot())).toBe(true);
        actor.send({ type: 'idp.authenticated' });
        await waitFor(actor, (state) => state.matches({ withBackupPassword: 'unlocking' }));
        expect(unlockKeys).toHaveBeenCalledWith(expect.objectContaining({ keyPassword: 'backup password', salts }));
    });

    it('forgets the backup password once it unlocked the keys', async () => {
        const { actor } = start(getState(ssoUser), { fetchSSOSalts: async () => salts, unlockKeys: async () => {} });
        actor.send({ type: 'backupPassword.submitted', keyPassword: 'backup password' });
        expect(actor.getSnapshot().context.backupPassword).toBe('backup password');
        await waitFor(actor, (state) => state.context.backupPassword === '');
        // Still loading while the login leaves the page or shows its next step
        expect(actor.getSnapshot().matches({ withBackupPassword: 'unlocking' })).toBe(true);
    });

    it('forgets the backup password when it fails', async () => {
        const { actor, onError } = start(getState(ssoUser), {
            fetchSSOSalts: async () => salts,
            unlockKeys: () => Promise.reject(new Error('Incorrect backup password')),
        });
        actor.send({ type: 'backupPassword.submitted', keyPassword: 'backup password' });
        await waitFor(actor, (state) => state.matches('awaitingPassword'));
        expect(actor.getSnapshot().context.backupPassword).toBe('');
        expect(onError).toHaveBeenCalled();
    });

    it('starts with the identity provider for a VPN-only SSO account, which has no keys', async () => {
        const { actor } = start(getState({ ...ssoUser, Keys: [] }));
        await waitFor(actor, selectAwaitingProvider);
        actor.send({ type: 'idp.cancelled' });
        expect(actor.getSnapshot().value).toBe('awaitingPassword');
        expect(selectMethod(actor.getSnapshot())).toBe('idp');
    });

    // An admin signed in as a member: the admin authenticates with their own account
    const adminSession: Partial<User> = {
        OrganizationPrivateKey: 'organization key',
        Keys: [{ ID: 'key' }] as User['Keys'],
    };

    it('starts with the identity provider when the admin uses SSO', async () => {
        const { actor } = start(getState(adminSession), { fetchMethod: async () => 'idp' });
        expect(selectMethod(actor.getSnapshot())).toBeUndefined();
        await waitFor(actor, selectAwaitingProvider);
    });

    it('asks for the password when the admin does not use SSO, even on an SSO member', async () => {
        const { actor } = start(getState({ ...adminSession, ...ssoUser }), { fetchMethod: async () => 'password' });
        await waitFor(actor, (state) => state.matches('awaitingPassword'));
        expect(selectMethod(actor.getSnapshot())).toBe('password');
    });

    it('falls back to the password, even on an SSO member, when the method fails to load', async () => {
        const error = new Error('Network error');
        const { actor, onError } = start(getState({ ...adminSession, ...ssoUser }), {
            fetchMethod: () => Promise.reject(error),
        });
        await waitFor(actor, (state) => state.matches('awaitingPassword'));
        expect(selectMethod(actor.getSnapshot())).toBe('password');
        expect(onError).toHaveBeenCalledWith(error);
    });

    it.each([
        ['an account with keys', getState({ Keys: [{ ID: 'key' }] as User['Keys'] }), true],
        ['a default re-authentication', getState({ Keys: [{ ID: 'key' }] as User['Keys'] }, 'default'), false],
        [
            'a session with an offline key',
            {
                ...getState({ Keys: [{ ID: 'key' }] as User['Keys'] }),
                session: { data: { offlineKey: {}, User: { Keys: [{ ID: 'key' }], Flags: {} } } } as AuthSession,
            },
            false,
        ],
        ['an account without keys', getState({}), false],
        ['an admin signed in as a member', getState(adminSession), false],
    ])('decides whether the password unlocks the keys for %s', (_, state, needsKeys) => {
        const { actor } = start(state);
        expect(actor.getSnapshot().context.needsKeys).toBe(needsKeys);
    });
});
