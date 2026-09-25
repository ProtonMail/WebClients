import type { User } from '@proton/shared/lib/interfaces';

import type { AuthSession } from '../../content/authSession';
import { finalizeSignIn } from './finalizeSignIn';
import { SSOLoginCapabilites, type SSOUnlockData } from './interface';
import type { LoginFlowContext } from './loginFlowContext';
import { unlockSSO } from './sso';

// The crypto and the session are out of scope: these tests only look at what the unlock does after unlocking
jest.mock('@proton/shared/lib/helpers/promise', () => ({
    ...jest.requireActual('@proton/shared/lib/helpers/promise'),
    wait: () => Promise.resolve(),
}));
jest.mock('@proton/shared/lib/authentication/unlockKey', () => ({
    ...jest.requireActual('@proton/shared/lib/authentication/unlockKey'),
    handleUnlockKey: () => Promise.resolve({ keyPassword: 'key password' }),
}));
jest.mock('@proton/shared/lib/keys/device', () => ({
    ...jest.requireActual('@proton/shared/lib/keys/device'),
    encryptAuthDeviceSecret: () => Promise.resolve('encrypted secret'),
}));
jest.mock('./finalizeSignIn', () => ({ finalizeSignIn: jest.fn() }));

const session = { data: {} } as unknown as AuthSession;
const deviceSecretData = { secret: 'device secret' };
const organizationData = { name: 'Organization' };
const ssoData = {
    type: 'unlock',
    deviceData: { deviceOutput: { ID: 'device' }, deviceSecretData },
    organizationData,
} as unknown as SSOUnlockData;

const unlock = (user: User) => {
    const api = jest.fn(() => Promise.resolve({}));
    const context = { api, authResponse: {} } as unknown as LoginFlowContext;
    const result = unlockSSO(context, { user, salts: [], addresses: undefined, ssoData, clearKeyPassword: 'backup' });
    return { api, result };
};

describe('unlockSSO', () => {
    beforeEach(() => {
        jest.mocked(finalizeSignIn).mockReset().mockResolvedValue(session);
    });

    it('activates the device and signs in', async () => {
        const { api, result } = unlock({ Flags: {} } as unknown as User);
        await expect(result).resolves.toEqual({ type: 'session', session });
        expect(api).toHaveBeenCalledWith(expect.objectContaining({ url: 'auth/v4/devices/device' }));
        expect(finalizeSignIn).toHaveBeenCalledTimes(1);
    });

    it('creates no session for a member who still has a temporary password', async () => {
        const user = { Flags: { 'has-temporary-password': true } } as unknown as User;
        const { api, result } = unlock(user);
        // Reloading before the new backup password is set must not sign them in: nothing is persisted yet
        await expect(result).resolves.toEqual({
            type: 'set-password',
            user,
            ssoData: expect.objectContaining({
                type: 'set-password',
                keyPassword: 'key password',
                deviceSecretData,
                organizationData,
                intent: { step: SSOLoginCapabilites.NEW_BACKUP_PASSWORD, capabilities: expect.any(Set) },
            }),
        });
        expect(finalizeSignIn).not.toHaveBeenCalled();
        // The device is still activated, so a reload goes straight to the new backup password
        expect(api).toHaveBeenCalledWith(expect.objectContaining({ url: 'auth/v4/devices/device' }));
    });
});
