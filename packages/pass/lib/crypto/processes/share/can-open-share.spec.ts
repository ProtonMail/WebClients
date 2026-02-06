import { exposePassCrypto } from '@proton/pass/lib/crypto';
import { canOpenShare } from '@proton/pass/lib/crypto/processes/share/can-open-share';
import { PassCryptoShareError } from '@proton/pass/lib/crypto/utils/errors';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '@proton/pass/lib/crypto/utils/testing';
import type {
    PassCryptoManagerContext,
    PassCryptoWorker,
    ShareGetResponse,
    ShareKeyResponse,
    ShareManager,
} from '@proton/pass/types';
import type { Address, AddressKey, DecryptedKey } from '@proton/shared/lib/interfaces';

describe('canOpenShare', () => {
    const passCrypto = {} as PassCryptoWorker;

    const userKeyId = 'userKeyId';
    const addressId = 'addressId';
    const groupId = 'groupId';

    const mockKey = {} as AddressKey;
    const encryptedShare = { AddressID: addressId } as ShareGetResponse;
    const encryptedGroupShare = { AddressID: addressId, GroupID: groupId } as ShareGetResponse;
    const shareKey: ShareKeyResponse = { KeyRotation: 0, Key: 'key', UserKeyID: userKeyId, CreateTime: 0 };

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
        exposePassCrypto(passCrypto);
    });
    afterAll(async () => releaseCryptoProxy());

    const mockCryptContext = (partial: Partial<PassCryptoManagerContext>) => {
        passCrypto.getContext = () => partial as PassCryptoManagerContext;
    };

    test('no keys and no manager should throw', async () => {
        expect(() => canOpenShare(encryptedGroupShare, undefined, undefined)).toThrow(PassCryptoShareError);
    });

    test('no keys should rely on manager', async () => {
        const manager = { isActive: jest.fn(() => true) } as unknown as ShareManager;
        expect(canOpenShare(encryptedGroupShare, undefined, manager)).toBe(true);
        expect(manager.isActive).toHaveBeenCalled();
    });

    test('empty keys should throw', async () => {
        expect(() => canOpenShare(encryptedGroupShare, [], undefined)).toThrow(PassCryptoShareError);
    });

    test('group share with no address keys should be false', async () => {
        mockCryptContext({ addresses: [], groupKeys: new Map() });
        expect(canOpenShare(encryptedGroupShare, [shareKey], undefined)).toBe(false);
    });

    test('group share with no group keys should be false', async () => {
        mockCryptContext({
            addresses: [{ ID: addressId, Keys: [mockKey] } as Address],
            groupKeys: new Map(),
        });
        expect(canOpenShare(encryptedGroupShare, [shareKey], undefined)).toBe(false);
    });

    test('group share with address and group keys should be true', async () => {
        mockCryptContext({
            addresses: [{ ID: addressId, Keys: [mockKey] } as Address],
            groupKeys: new Map([['groupId', [mockKey]]]),
        });
        expect(canOpenShare(encryptedGroupShare, [shareKey], undefined)).toBe(true);
    });

    test('share with no matching user keys should be false', async () => {
        mockCryptContext({ userKeys: [] });
        expect(canOpenShare(encryptedShare, [shareKey], undefined)).toBe(false);
    });

    test('share with matching user keys should be true', async () => {
        mockCryptContext({ userKeys: [{ ID: userKeyId } as DecryptedKey] });
        expect(canOpenShare(encryptedShare, [shareKey], undefined)).toBe(true);
    });
});
