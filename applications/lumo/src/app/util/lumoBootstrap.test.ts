import { jest } from '@jest/globals';
import type { PrivateKeyReference } from '@protontech/crypto';
import { CryptoProxy, VERIFICATION_STATUS } from '@protontech/crypto';

import type { DecryptedAddressKey, DecryptedKey } from '@proton/shared/lib/interfaces';

import { decryptMasterKeyEnvelope } from './lumoBootstrap';

describe('decryptMasterKeyEnvelope', () => {
    afterEach(() => jest.restoreAllMocks());

    it('accepts a legacy envelope encrypted and signed with an address key', async () => {
        const userKey = {
            privateKey: { id: 'user-private' },
            publicKey: { id: 'user-public' },
        } as unknown as DecryptedKey<PrivateKeyReference>;
        const addressKey = {
            privateKey: { id: 'address-private' },
            publicKey: { id: 'address-public' },
        } as unknown as DecryptedAddressKey<PrivateKeyReference>;
        const decryptSpy = jest
            .spyOn(CryptoProxy, 'decryptMessage')
            .mockRejectedValueOnce(new Error('Not encrypted to the user key'))
            .mockResolvedValueOnce({
                data: { toBase64: () => 'RECOVERED_MASTER_KEY' },
                verificationStatus: VERIFICATION_STATUS.SIGNED_AND_VALID,
            } as never);

        await expect(decryptMasterKeyEnvelope('AA==', [userKey], [addressKey])).resolves.toEqual({
            key: 'RECOVERED_MASTER_KEY',
            usedUserKeys: false,
        });

        expect(decryptSpy).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
                decryptionKeys: [addressKey.privateKey],
                verificationKeys: [userKey.publicKey, addressKey.publicKey],
            })
        );
    });
});
