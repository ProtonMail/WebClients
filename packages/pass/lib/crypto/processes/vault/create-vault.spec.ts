import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import { decryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoVaultError } from '@proton/pass/lib/crypto/utils/errors';
import { ContentFormatVersion, PassEncryptionTag } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

import {
    createRandomKey,
    randomAddress,
    randomContents,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../utils/testing';
import { createVault } from './create-vault';

describe('createVault crypto process', () => {
    beforeAll(async () => setupCryptoProxyForTesting());
    afterAll(async () => releaseCryptoProxy());

    test('should encrypt & sign vaultKey with userKey and encrypt contents with vaultKey', async () => {
        const userKey = await createRandomKey();
        const address = randomAddress();
        const content = randomContents();

        const vault = await createVault({ content, addressId: address.ID, userKey });

        const { data, verified } = await CryptoProxy.decryptMessage({
            binaryMessage: base64StringToUint8Array(vault.EncryptedVaultKey),
            decryptionKeys: [userKey.privateKey],
            verificationKeys: [userKey.privateKey],
            format: 'binary',
        });

        expect(verified).toEqual(VERIFICATION_STATUS.SIGNED_AND_VALID);

        const vaultKey = await importSymmetricKey(data);
        const decryptedContent = await decryptData(
            vaultKey,
            base64StringToUint8Array(vault.Content),
            PassEncryptionTag.VaultContent
        );

        expect(decryptedContent).toStrictEqual(content);

        expect(vault.AddressID).toEqual(address.ID);
        expect(vault.ContentFormatVersion).toEqual(ContentFormatVersion.Share);
    });

    test('should throw when provided with empty content', async () => {
        const userKey = await createRandomKey();
        const address = randomAddress();

        await expect(
            createVault({
                content: new Uint8Array(0),
                addressId: address.ID,
                userKey,
            })
        ).rejects.toThrow(PassCryptoVaultError);
    });
});
