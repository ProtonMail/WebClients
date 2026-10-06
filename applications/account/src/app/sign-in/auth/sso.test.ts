import type { Address, User } from '@proton/shared/lib/interfaces';
import {
    AuthDeviceInactiveError,
    AuthDeviceInvalidError,
    AuthDeviceNonExistingError,
    type AuthDeviceOutput,
    AuthDeviceState,
    type DeviceData,
    type DeviceDataSerialized,
    createAuthDeviceToActivate,
    deleteAuthDevice,
    getAuthDeviceDataByUser,
    setPersistedAuthDeviceDataByUser,
} from '@proton/shared/lib/keys/device';
import { type OrganizationData, getOrganizationData } from '@proton/shared/lib/keys/unprivatization/helper';

import type { AuthSession } from '../../content/authSession';
import { finalizeSignIn } from './finalizeSignIn';
import { SSOLoginCapabilites, type SSOUnlockData } from './interface';
import type { LoginFlowContext } from './loginFlowContext';
import { prepareSSOSignIn, unlockSSO } from './sso';

// The crypto, the session and the device requests are out of scope: these tests only look at what the sign-in does
// with their results
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
    getAuthDeviceDataByUser: jest.fn(),
    deleteAuthDevice: jest.fn(),
    createAuthDeviceToActivate: jest.fn(),
    setPersistedAuthDeviceDataByUser: jest.fn(),
}));
jest.mock('@proton/shared/lib/keys/unprivatization/helper', () => ({
    ...jest.requireActual('@proton/shared/lib/keys/unprivatization/helper'),
    getOrganizationData: jest.fn(),
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

describe('prepareSSOSignIn', () => {
    const user = { ID: 'user', Keys: [{ ID: 'user key' }], Flags: { sso: true } } as unknown as User;
    const address = { ID: 'address', Email: 'member@proton.me', Keys: [{ ID: 'address key' }] } as unknown as Address;
    /** The device persisted in this browser, which isn't active (yet). */
    const persistedDevice = {
        serializedDeviceData: { id: 'device' },
        deviceSecretData,
    } as unknown as DeviceDataSerialized;
    /** Waits for another device or an administrator to approve it, with the secret encrypted to the address. */
    const pendingDevice = {
        ID: 'device',
        State: AuthDeviceState.PendingActivation,
        ActivationAddressID: 'address',
    } as AuthDeviceOutput;
    /**
     * Created while the member had no keys yet: it has neither an activation token nor an activation address (the API
     * sends null), and never gets them, so no other device or administrator can approve it.
     */
    const unapprovableDevice = {
        ID: 'device',
        State: AuthDeviceState.Inactive,
        ActivationAddressID: null,
    } as unknown as AuthDeviceOutput;
    const otherDevice = { ID: 'other device', State: AuthDeviceState.Active } as AuthDeviceOutput;
    const newDevice = { deviceOutput: { ID: 'new device' }, deviceSecretData } as unknown as DeviceData;

    /** The member's devices, as the API lists them to `getAllAuthDevices`. */
    const listDevices = jest.fn((): Promise<AuthDeviceOutput[]> => Promise.resolve([]));

    const prepare = () => {
        const api = async ({ url }: { url: string }) => {
            if (url !== 'auth/v4/devices') {
                throw new Error(`Unexpected request to ${url}`);
            }
            return { AuthDevices: await listDevices() };
        };
        const context = { api, authResponse: {} } as unknown as LoginFlowContext;
        return prepareSSOSignIn(context, { user, addresses: [address] });
    };

    /** The persisted device is gone, here and in the API, and the member continues with a new one to approve. */
    const expectReplacedDevice = async (result: ReturnType<typeof prepare>) => {
        await expect(result).resolves.toEqual({
            type: 'sso',
            ssoData: expect.objectContaining({ type: 'unlock', deviceData: newDevice }),
        });
        // With the user, so it's removed from this browser too: the next sign-in would otherwise find it again
        expect(deleteAuthDevice).toHaveBeenCalledWith(expect.objectContaining({ user, deviceID: 'device' }));
    };

    beforeEach(() => {
        jest.mocked(getAuthDeviceDataByUser)
            .mockReset()
            .mockRejectedValue(new AuthDeviceInactiveError(persistedDevice));
        listDevices.mockReset().mockResolvedValue([]);
        jest.mocked(deleteAuthDevice).mockReset().mockResolvedValue(undefined);
        jest.mocked(createAuthDeviceToActivate).mockReset().mockResolvedValue(newDevice);
        jest.mocked(setPersistedAuthDeviceDataByUser).mockReset().mockResolvedValue(undefined);
        jest.mocked(getOrganizationData)
            .mockReset()
            .mockResolvedValue(organizationData as unknown as OrganizationData);
    });

    it('continues with the approval of a pending device', async () => {
        listDevices.mockResolvedValue([pendingDevice, otherDevice]);
        await expect(prepare()).resolves.toEqual({
            type: 'sso',
            ssoData: expect.objectContaining({
                type: 'inactive',
                deviceData: { deviceOutput: pendingDevice, deviceSecretData },
                authDevices: [otherDevice],
                address,
            }),
        });
        expect(deleteAuthDevice).not.toHaveBeenCalled();
        expect(createAuthDeviceToActivate).not.toHaveBeenCalled();
    });

    it.each([
        { reason: 'has no activation address', authDevices: [unapprovableDevice, otherDevice] },
        { reason: 'is no longer listed', authDevices: [otherDevice] },
    ])('replaces an inactive device that $reason', async ({ authDevices }) => {
        listDevices.mockResolvedValue(authDevices);
        await expectReplacedDevice(prepare());
    });

    // A failed request says nothing about the device: it keeps waiting for its approval, and the error is reported
    it('keeps an inactive device when the devices fail to load', async () => {
        const error = { status: 503 };
        listDevices.mockRejectedValue(error);
        await expect(prepare()).rejects.toBe(error);
        expect(deleteAuthDevice).not.toHaveBeenCalled();
        expect(createAuthDeviceToActivate).not.toHaveBeenCalled();
    });

    it('replaces a device that can no longer be used', async () => {
        jest.mocked(getAuthDeviceDataByUser).mockRejectedValue(new AuthDeviceInvalidError('device', 'API invalid'));
        await expectReplacedDevice(prepare());
    });

    it('creates a device when none is persisted', async () => {
        jest.mocked(getAuthDeviceDataByUser).mockRejectedValue(new AuthDeviceNonExistingError());
        await expect(prepare()).resolves.toEqual({
            type: 'sso',
            ssoData: expect.objectContaining({ type: 'unlock', deviceData: newDevice }),
        });
        expect(deleteAuthDevice).not.toHaveBeenCalled();
    });

    // Listing none would hide the approval from another device; signing in again continues with the persisted one
    it('keeps a new device when the devices fail to load', async () => {
        jest.mocked(getAuthDeviceDataByUser).mockRejectedValue(new AuthDeviceNonExistingError());
        const error = { status: 503 };
        listDevices.mockRejectedValue(error);
        await expect(prepare()).rejects.toBe(error);
        expect(setPersistedAuthDeviceDataByUser).toHaveBeenCalledWith({ user, deviceData: newDevice });
        expect(deleteAuthDevice).not.toHaveBeenCalled();
    });
});
