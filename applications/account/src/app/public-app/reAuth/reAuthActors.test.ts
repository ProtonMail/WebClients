import { createActor, toPromise } from 'xstate';

import { getSettings } from '@proton/shared/lib/api/settings';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { KeySalt } from '@proton/shared/lib/interfaces/KeySalt';
import { SETTINGS_PASSWORD_MODE } from '@proton/shared/lib/interfaces/UserSettings';

import type { AuthSession } from '../authSession';
import { createReAuthActors } from './reAuthActors';
import type { ReAuthState } from './reauthContainerState';

const mockSrpAuth = jest.fn();
jest.mock('@proton/shared/lib/srp', () => ({
    srpAuth: (...args: unknown[]) => mockSrpAuth(...args),
}));

const mockHandleReAuthKeyPassword = jest.fn();
jest.mock('./reAuthKeyPassword', () => ({
    handleReAuthKeyPassword: (...args: unknown[]) => mockHandleReAuthKeyPassword(...args),
}));

const salts: KeySalt[] = [{ ID: 'key', KeySalt: 'salt' }];

const getState = ({
    reAuthType = 'offline',
    offlineKey,
    keys = [{ ID: 'key' }],
}: {
    reAuthType?: ReAuthState['reAuthType'];
    offlineKey?: string;
    keys?: { ID: string }[];
}): ReAuthState => ({
    session: { data: { offlineKey, User: { Keys: keys } } } as unknown as AuthSession,
    reAuthType,
});

/** Runs the password step against an API whose settings say whether the keys share the password. */
const submitPassword = (state: ReAuthState, passwordMode = SETTINGS_PASSWORD_MODE.ONE_PASSWORD_MODE) => {
    const login = jest.fn(async () => {});
    const api = jest.fn(async ({ url }: { url: string }) =>
        url === getSettings().url ? { UserSettings: { Password: { Mode: passwordMode } } } : { KeySalts: salts }
    );
    const actors = createReAuthActors({ api: api as unknown as Api, preSubmit: async () => {}, login });
    const output = toPromise(createActor(actors.submitPassword, { input: { state, password: 'password' } }).start());
    return { output, login, api };
};

describe('submitPassword', () => {
    beforeEach(() => {
        mockSrpAuth.mockReset().mockResolvedValue(undefined);
        mockHandleReAuthKeyPassword.mockReset();
    });

    it.each([
        ['a default re-authentication', getState({ reAuthType: 'default' })],
        ['a session with an offline key', getState({ offlineKey: 'offline key' })],
        ['an account without keys', getState({ keys: [] })],
    ])('skips the key unlock for %s', async (_, state) => {
        const { output, login, api } = submitPassword(state);
        await expect(output).resolves.toEqual({ unlockWithSalts: undefined });
        expect(mockSrpAuth).toHaveBeenCalledWith(expect.objectContaining({ credentials: { password: 'password' } }));
        expect(login).toHaveBeenCalledWith({ ...state.session, interruptions: ['reauth'] });
        expect(api).not.toHaveBeenCalled();
        expect(mockHandleReAuthKeyPassword).not.toHaveBeenCalled();
    });

    it('unlocks the keys with the password in one-password mode, then signs in', async () => {
        const unlocked = { data: { keyPassword: 'key password' } } as unknown as AuthSession;
        mockHandleReAuthKeyPassword.mockResolvedValue(unlocked);
        const { output, login } = submitPassword(getState({}));
        await expect(output).resolves.toEqual({ unlockWithSalts: undefined });
        expect(mockHandleReAuthKeyPassword).toHaveBeenCalledWith(
            expect.objectContaining({ clearKeyPassword: 'password', salts })
        );
        expect(login).toHaveBeenCalledWith({ ...unlocked, interruptions: ['reauth'] });
    });

    it('asks for the key password in two-password mode', async () => {
        const { output, login } = submitPassword(getState({}), SETTINGS_PASSWORD_MODE.TWO_PASSWORD_MODE);
        await expect(output).resolves.toEqual({ unlockWithSalts: salts });
        expect(login).not.toHaveBeenCalled();
    });

    it('signs nothing in with a wrong password', async () => {
        const error = new Error('Incorrect login credentials');
        mockSrpAuth.mockRejectedValue(error);
        const { output, login } = submitPassword(getState({ reAuthType: 'default' }));
        await expect(output).rejects.toBe(error);
        expect(login).not.toHaveBeenCalled();
    });
});
