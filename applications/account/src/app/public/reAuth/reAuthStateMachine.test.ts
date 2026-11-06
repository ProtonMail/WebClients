import { createActor, fromPromise, waitFor } from 'xstate';

import type { KeySalt } from '@proton/shared/lib/interfaces/KeySalt';
import type { User } from '@proton/shared/lib/interfaces/User';
import { UserType } from '@proton/shared/lib/interfaces/User';

import type { AuthSession } from '../../content/authSession';
import { reAuthStateMachine, selectAwaitingProvider, selectSubmitting } from './reAuthStateMachine';
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
    }> = {}
) => {
    const onError = jest.fn();
    const never = () => new Promise<never>(() => {});
    const actor = createActor(
        reAuthStateMachine.provide({
            actors: {
                preSubmit: fromPromise(async () => {}),
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
        const unlockKeys = jest.fn(() => new Promise<void>(() => {}));
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
    });

    it('starts with the identity provider for an SSO account, and offers it again when cancelled', async () => {
        const loginWithIdP = jest.fn(() => new Promise<void>(() => {}));
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
        const fetchSSOSalts = jest.fn().mockResolvedValueOnce(undefined).mockResolvedValueOnce(salts);
        const unlockKeys = jest.fn(() => new Promise<void>(() => {}));
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
});
