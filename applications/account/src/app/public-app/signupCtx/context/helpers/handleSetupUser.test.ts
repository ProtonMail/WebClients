import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { deviceRecovery } from '@proton/shared/lib/recoveryFile/deviceRecoveryHelper';
import { addApiMock, apiMock, clearApiMocks } from '@proton/test-api/vitest/api';

import { SignupType } from '../../../signup/interfaces';
import { handleSetPassword, handleSetupUser } from './handleSetupUser';

vi.mock('@proton/shared/lib/srp', () => ({
    srpAuth: vi.fn(async () => ({ json: async () => ({ UID: 'uid', AccessToken: 'token' }) })),
}));
vi.mock('@proton/shared/lib/authentication/persistedSessionHelper', () => ({
    persistSession: vi.fn(async () => ({})),
}));
vi.mock('@proton/key-transparency/shared/createPreAuthKTVerifier', () => ({
    createPreAuthKTVerifier: () => ({ preAuthKTVerify: vi.fn(), preAuthKTCommit: vi.fn(async () => {}) }),
}));
vi.mock('@proton/shared/lib/keys/setupKeys', () => ({ handleSetupKeys: vi.fn(async () => 'key-password') }));
vi.mock('@proton/shared/lib/recoveryFile/deviceRecoveryHelper', () => ({ deviceRecovery: vi.fn() }));

const accountData = {
    username: 'user',
    email: '',
    domain: 'proton.me',
    password: 'password',
    signupType: SignupType.Proton,
} as const;
const user = { ID: 'user-id', Name: 'user' };
const address = { ID: 'address-id', Email: 'user@proton.me', Keys: [] };
const recoveredUser = { ...user, RecoverySecret: 'set' };

const setup = ({ persistent, deferKeySetup = false }: { persistent: boolean; deferKeySetup?: boolean }) =>
    handleSetupUser({
        accountData: { ...accountData, payload: undefined },
        api: apiMock,
        persistent,
        subscriptionData: undefined,
        productParam: 'generic',
        keyTransparencyActivation: 0,
        traceSignupSentryError: vi.fn(),
        referralData: undefined,
        referralRegistrationPlan: undefined,
        build: 'proton-account',
        telemetryContext: 'other',
        deferKeySetup,
    });

describe('the session a signup persists', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        clearApiMocks();
        addApiMock('core/v4/addresses', () => ({ Addresses: [address], Total: 1 }));
        addApiMock('core/v4/users', () => ({ User: user }));
        vi.mocked(deviceRecovery).mockImplementation(async ({ persistent }) => ({
            user: recoveredUser as any,
            trusted: persistent,
        }));
    });

    it.each([true, false])('is trusted as sign-in decides it, for a persistent session: %s', async (persistent) => {
        const result = await setup({ persistent });

        expect(deviceRecovery).toHaveBeenCalledWith(
            // The addresses are loaded again: the key setup's are from before their keys
            expect.objectContaining({ keyPassword: 'key-password', persistent, user, addresses: undefined })
        );
        expect(persistSession).toHaveBeenCalledWith(
            expect.objectContaining({ trusted: persistent, persistent, User: recoveredUser })
        );
        // Storing device recovery sets a recovery secret: the steps after the setup see that user
        expect(result.user).toBe(recoveredUser);
    });

    it('stays untrusted when device recovery fails, without failing the signup', async () => {
        vi.mocked(deviceRecovery).mockRejectedValue(new Error('network'));

        const result = await setup({ persistent: true });

        expect(persistSession).toHaveBeenCalledWith(expect.objectContaining({ trusted: false, User: user }));
        expect(result.user).toBe(user);
    });

    it('is trusted once the user chooses a password, when the setup deferred the keys', async () => {
        const setupResult = await setup({ persistent: true, deferKeySetup: true });
        expect(deviceRecovery).toHaveBeenLastCalledWith(expect.objectContaining({ keyPassword: '' }));

        await handleSetPassword({
            api: apiMock,
            accountData: { ...accountData, payload: undefined },
            setupResult,
            newPassword: 'chosen',
            persistent: true,
            productParam: 'generic',
            keyTransparencyActivation: 0,
        });

        expect(deviceRecovery).toHaveBeenLastCalledWith(
            expect.objectContaining({ keyPassword: 'key-password', persistent: true })
        );
        expect(persistSession).toHaveBeenLastCalledWith(expect.objectContaining({ trusted: true }));
    });
});
