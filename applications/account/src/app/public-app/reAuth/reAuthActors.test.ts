import { createActor, toPromise } from 'xstate';

import { getSettings } from '@proton/shared/lib/api/settings';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { KeySalt } from '@proton/shared/lib/interfaces/KeySalt';
import { SETTINGS_PASSWORD_MODE } from '@proton/shared/lib/interfaces/UserSettings';

import type { AuthSession } from '../authSession';
import { createReAuthActors } from './reAuthActors';
import type { ReAuthState } from './reauthContainerState';

const mockSrpAuth = vi.fn();
vi.mock('@proton/shared/lib/srp', () => ({
    srpAuth: (...args: unknown[]) => mockSrpAuth(...args),
}));

const mockHandleReAuthKeyPassword = vi.fn();
vi.mock('./reAuthKeyPassword', () => ({
    handleReAuthKeyPassword: (...args: unknown[]) => mockHandleReAuthKeyPassword(...args),
}));

const salts: KeySalt[] = [{ ID: 'key', KeySalt: 'salt' }];

const state: ReAuthState = {
    session: { data: { User: { Keys: [{ ID: 'key' }] } } } as unknown as AuthSession,
    reAuthType: 'offline',
};

/** Runs the password step against an API whose settings say whether the keys share the password. */
const submitPassword = ({
    needsKeys = true,
    passwordMode = SETTINGS_PASSWORD_MODE.ONE_PASSWORD_MODE,
}: { needsKeys?: boolean; passwordMode?: SETTINGS_PASSWORD_MODE } = {}) => {
    const login = vi.fn(async () => {});
    const api = vi.fn(async ({ url }: { url: string }) =>
        url === getSettings().url ? { UserSettings: { Password: { Mode: passwordMode } } } : { KeySalts: salts }
    );
    const actors = createReAuthActors({ api: api as unknown as Api, preSubmit: async () => {}, login });
    const output = toPromise(
        createActor(actors.submitPassword, { input: { state, password: 'password', needsKeys } }).start()
    );
    return { output, login, api };
};

describe('submitPassword', () => {
    beforeEach(() => {
        mockSrpAuth.mockReset().mockResolvedValue(undefined);
        mockHandleReAuthKeyPassword.mockReset();
    });

    it('signs in without unlocking the keys when it does not need them', async () => {
        const { output, login, api } = submitPassword({ needsKeys: false });
        await expect(output).resolves.toEqual({ unlockWithSalts: undefined });
        expect(mockSrpAuth).toHaveBeenCalledWith(expect.objectContaining({ credentials: { password: 'password' } }));
        expect(login).toHaveBeenCalledWith({ ...state.session, interruptions: ['reauth'] });
        expect(api).not.toHaveBeenCalled();
        expect(mockHandleReAuthKeyPassword).not.toHaveBeenCalled();
    });

    it('unlocks the keys with the password in one-password mode, then signs in', async () => {
        const unlocked = { data: { keyPassword: 'key password' } } as unknown as AuthSession;
        mockHandleReAuthKeyPassword.mockResolvedValue(unlocked);
        const { output, login } = submitPassword();
        await expect(output).resolves.toEqual({ unlockWithSalts: undefined });
        expect(mockHandleReAuthKeyPassword).toHaveBeenCalledWith(
            expect.objectContaining({ clearKeyPassword: 'password', salts })
        );
        expect(login).toHaveBeenCalledWith({ ...unlocked, interruptions: ['reauth'] });
    });

    it('asks for the key password in two-password mode', async () => {
        const { output, login } = submitPassword({ passwordMode: SETTINGS_PASSWORD_MODE.TWO_PASSWORD_MODE });
        await expect(output).resolves.toEqual({ unlockWithSalts: salts });
        expect(login).not.toHaveBeenCalled();
    });

    it('signs nothing in with a wrong password', async () => {
        const error = new Error('Incorrect login credentials');
        mockSrpAuth.mockRejectedValue(error);
        const { output, login } = submitPassword({ needsKeys: false });
        await expect(output).rejects.toBe(error);
        expect(login).not.toHaveBeenCalled();
    });
});

describe('fetchMethod', () => {
    const fetchMethod = (api: ReturnType<typeof vi.fn>) => {
        const actors = createReAuthActors({ api: api as unknown as Api, preSubmit: async () => {}, login: vi.fn() });
        return toPromise(createActor(actors.fetchMethod).start());
    };

    it('asks the API how the signed-in account authenticates', async () => {
        const api = vi.fn(async () => ({ SSOChallengeToken: 'token' }));
        await expect(fetchMethod(api)).resolves.toBe('idp');
        expect(api).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ Intent: 'Auto', ReauthScope: 'locked' }) })
        );
        await expect(fetchMethod(vi.fn(async () => ({ Modulus: 'modulus' })))).resolves.toBe('password');
    });

    it('treats a switch to SSO as an SSO account', async () => {
        const api = vi.fn(() =>
            Promise.reject({
                status: 422,
                data: { Code: API_CUSTOM_ERROR_CODES.AUTH_SWITCH_TO_SSO, Error: 'Switch to SSO' },
            })
        );
        await expect(fetchMethod(api)).resolves.toBe('idp');
    });
});
