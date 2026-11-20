import { CryptoProxy } from '@protontech/crypto';
import type { MockInstance } from 'vitest';

import { getEncryptedDelegatedAccessToken } from '@proton/account/delegatedAccess/crypto';
import { getAndVerifyApiKeys } from '@proton/key-transparency/keys/getAndVerifyApiKeys';
import { getAllMemberAddresses } from '@proton/shared/lib/api/members';
import { getDecryptedAddressKeys } from '@proton/shared/lib/keys/getDecryptedAddressKeys';
import { getDecryptedUserKeys } from '@proton/shared/lib/keys/getDecryptedUserKeys';
import { createMemberAddressKeysV2, setupMemberKeys } from '@proton/shared/lib/keys/memberKeys';

import {
    clearServiceAccountKeys,
    getServiceAccountAccessPayload,
    getServiceAccountKeys,
    setupServiceAccountKeys,
} from './keys';

vi.mock('@proton/key-transparency/keys/getAndVerifyApiKeys', () => ({ getAndVerifyApiKeys: vi.fn() }));
vi.mock('@proton/key-transparency/helpers/createKTVerifier', () => ({
    createKTVerifier: () => ({ keyTransparencyVerify: vi.fn(), keyTransparencyCommit: vi.fn() }),
}));
vi.mock('@proton/shared/lib/api/members', async () => ({
    ...(await vi.importActual('@proton/shared/lib/api/members')),
    getAllMemberAddresses: vi.fn(),
}));
vi.mock('@proton/shared/lib/keys/memberKeys', () => ({
    setupMemberKeys: vi.fn(async () => ({ userPrivateKey: 'generated-user-private' })),
    createMemberAddressKeysV2: vi.fn(),
}));
vi.mock('@proton/shared/lib/keys/getDecryptedUserKeys', () => ({ getDecryptedUserKeys: vi.fn() }));
vi.mock('@proton/shared/lib/keys/getDecryptedAddressKeys', () => ({ getDecryptedAddressKeys: vi.fn() }));
vi.mock('@proton/account/delegatedAccess/crypto', () => ({
    generateDelegatedAccessToken: () => 'random-secret',
    getEncryptedDelegatedAccessToken: vi.fn(async () => 'sealed-token'),
}));

const api = vi.fn();
const context = {
    api,
    organizationKey: { Key: {}, privateKey: 'organization-private', publicKey: 'organization-public' },
    serviceAccount: { MemberID: 'service-member', AddressID: 'service-address' },
    ktUserContext: { ktActivation: 0, getUser: async () => ({}), getUserKeys: async () => [] },
    config: { APP_NAME: 'proton-account' },
} as unknown as Parameters<typeof setupServiceAccountKeys>[0];
const userKey = { ID: 'user-key', privateKey: 'service-user-private', publicKey: 'service-user-public' };
const addressKey = { ID: 'address-key', privateKey: 'service-address-private', publicKey: 'service-address-public' };
let clearKey: MockInstance<typeof CryptoProxy.clearKey>;
const clearedKeys = () => clearKey.mock.calls.map(([{ key }]) => key);

beforeEach(() => {
    vi.clearAllMocks();
    clearKey = vi.spyOn(CryptoProxy, 'clearKey').mockResolvedValue(undefined);
    api.mockResolvedValue({ Member: { ID: 'service-member', Keys: [] } });
    vi.mocked(getAllMemberAddresses).mockResolvedValue([
        { ID: 'other-address', Keys: [{ ID: 'other-key' }] },
        { ID: 'service-address', Keys: [{ ID: 'address-key' }] },
    ] as any);
    vi.mocked(getDecryptedUserKeys).mockResolvedValue([userKey] as any);
    vi.mocked(getDecryptedAddressKeys).mockResolvedValue([addressKey] as any);
});

afterEach(() => {
    clearKey.mockRestore();
});

describe('setupServiceAccountKeys', () => {
    it('sets up keys without password authentication and clears the generated user key', async () => {
        await setupServiceAccountKeys(context);
        expect(setupMemberKeys).toHaveBeenCalledWith(
            expect.objectContaining({
                skipSrp: true,
                password: 'random-secret',
                organizationKey: 'organization-private',
            })
        );
        expect(clearedKeys()).toEqual(['generated-user-private']);
    });

    it('preserves already initialized keys on retry', async () => {
        api.mockResolvedValue({ Member: { ID: 'service-member', Keys: [{ ID: 'user-key', Active: 1 }] } });
        await setupServiceAccountKeys(context);
        expect(setupMemberKeys).not.toHaveBeenCalled();
        expect(createMemberAddressKeysV2).not.toHaveBeenCalled();
        expect(getDecryptedUserKeys).not.toHaveBeenCalled();
    });

    it('adds a missing address key to an account that already has a user key', async () => {
        api.mockResolvedValue({ Member: { ID: 'service-member', Keys: [{ ID: 'user-key', Active: 1 }] } });
        vi.mocked(getAllMemberAddresses).mockResolvedValue([{ ID: 'service-address', Keys: [] }] as any);
        await setupServiceAccountKeys(context);
        expect(setupMemberKeys).not.toHaveBeenCalled();
        expect(createMemberAddressKeysV2).toHaveBeenCalledWith(
            expect.objectContaining({
                memberAddress: { ID: 'service-address', Keys: [] },
                memberAddressKeys: [],
                memberUserKey: 'service-user-private',
                organizationKey: 'organization-private',
            })
        );
        expect(clearedKeys()).toEqual(['service-user-private', 'service-user-public']);
    });

    it('rejects when the service account address is missing', async () => {
        vi.mocked(getAllMemberAddresses).mockResolvedValue([] as any);
        await expect(setupServiceAccountKeys(context)).rejects.toThrow('address is unavailable');
        expect(setupMemberKeys).not.toHaveBeenCalled();
    });
});

describe('getServiceAccountKeys', () => {
    beforeEach(() => {
        api.mockResolvedValue({ Member: { ID: 'service-member', Keys: [{ ID: 'user-key', Active: 1 }] } });
    });

    it('decrypts only the service account address and returns it with its primary key for signing', async () => {
        await expect(getServiceAccountKeys(context)).resolves.toEqual({
            memberUserKeys: [userKey],
            sourceAddressID: 'service-address',
            sourceKey: 'service-address-private',
        });
        expect(getDecryptedAddressKeys).toHaveBeenCalledTimes(1);
        expect(getDecryptedAddressKeys).toHaveBeenCalledWith(
            [{ ID: 'address-key' }],
            [userKey],
            '',
            expect.objectContaining({ privateKey: 'organization-private' })
        );
        expect(clearedKeys()).toEqual(['service-address-public']);
    });

    it('clears secondary address keys that are not used for signing', async () => {
        const secondary = { ID: 'old-key', privateKey: 'old-private', publicKey: 'old-public' };
        vi.mocked(getDecryptedAddressKeys).mockResolvedValue([addressKey, secondary] as any);
        await getServiceAccountKeys(context);
        expect(clearedKeys()).toEqual(['old-private', 'old-public', 'service-address-public']);
    });

    it('refuses a partially decrypted set of active user keys and clears what was decrypted', async () => {
        api.mockResolvedValue({
            Member: {
                ID: 'service-member',
                Keys: [
                    { ID: 'user-key', Active: 1 },
                    { ID: 'second-key', Active: 1 },
                ],
            },
        });
        await expect(getServiceAccountKeys(context)).rejects.toThrow('could not be decrypted');
        expect(getDecryptedAddressKeys).not.toHaveBeenCalled();
        expect(clearedKeys()).toEqual(['service-user-private', 'service-user-public']);
    });

    it('ignores inactive user keys that cannot be decrypted', async () => {
        api.mockResolvedValue({
            Member: {
                ID: 'service-member',
                Keys: [
                    { ID: 'user-key', Active: 1 },
                    { ID: 'inactive-key', Active: 0 },
                ],
            },
        });
        await expect(getServiceAccountKeys(context)).resolves.toEqual(
            expect.objectContaining({ memberUserKeys: [userKey] })
        );
    });

    it('rejects and clears the user keys when the service address key is unavailable', async () => {
        vi.mocked(getDecryptedAddressKeys).mockResolvedValue([]);
        await expect(getServiceAccountKeys(context)).rejects.toThrow('keys are unavailable');
        expect(clearedKeys()).toEqual(['service-user-private', 'service-user-public']);
    });

    it('clears the user keys when address key decryption fails', async () => {
        vi.mocked(getDecryptedAddressKeys).mockRejectedValue(new Error('bad token'));
        await expect(getServiceAccountKeys(context)).rejects.toThrow('bad token');
        expect(clearedKeys()).toEqual(['service-user-private', 'service-user-public']);
    });

    it('clears all returned keys on request', async () => {
        await clearServiceAccountKeys({ memberUserKeys: [userKey], sourceKey: 'service-address-private' } as any);
        expect(clearedKeys()).toEqual(['service-user-private', 'service-user-public', 'service-address-private']);
    });
});

describe('getServiceAccountAccessPayload', () => {
    const keys = {
        memberUserKeys: [userKey],
        sourceAddressID: 'service-address',
        sourceKey: 'service-address-private',
    } as any;

    it('encrypts the service account user keys for the manager and signs with the service address key', async () => {
        vi.mocked(getAndVerifyApiKeys).mockResolvedValue({ addressKeys: [{ publicKey: 'manager-public' }] } as any);
        const exportKey = vi.spyOn(CryptoProxy, 'exportPrivateKey').mockResolvedValue('sealed-private-key');
        const payload = await getServiceAccountAccessPayload({ ...context, keys, targetEmail: 'manager@example.test' });
        expect(getAndVerifyApiKeys).toHaveBeenCalledWith(
            expect.objectContaining({ email: 'manager@example.test', internalKeysOnly: true, noCache: true })
        );
        expect(api).not.toHaveBeenCalled();
        expect(getEncryptedDelegatedAccessToken).toHaveBeenCalledWith({
            token: 'random-secret',
            encryptionKeys: ['manager-public'],
            signingKeys: ['service-address-private'],
        });
        expect(exportKey).toHaveBeenCalledWith({ privateKey: 'service-user-private', passphrase: 'random-secret' });
        expect(payload).toEqual({
            TargetEmail: 'manager@example.test',
            SourceAddressID: 'service-address',
            UserKeyToken: 'sealed-token',
            UserKeys: [{ UserKeyID: 'user-key', PrivateKey: 'sealed-private-key' }],
        });
        exportKey.mockRestore();
    });

    it('rejects a manager without a verified encryption key', async () => {
        vi.mocked(getAndVerifyApiKeys).mockResolvedValue({ addressKeys: [] } as any);
        await expect(
            getServiceAccountAccessPayload({ ...context, keys, targetEmail: 'manager@example.test' })
        ).rejects.toThrow('no encryption keys');
        expect(getEncryptedDelegatedAccessToken).not.toHaveBeenCalled();
    });
});
