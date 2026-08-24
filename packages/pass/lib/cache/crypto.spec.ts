import { ARGON2_PARAMS, CryptoProxy } from '@protontech/crypto';

import { binaryStringToUint8Array, uint8ArrayToBinaryString } from '@proton/shared/lib/helpers/encoding';

import { PassEncryptionTag } from '../../types';
import { decryptData, generateKey, importSymmetricKey } from '../crypto/utils/crypto-helpers';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../crypto/utils/testing';
import { generateOfflineComponents } from './crypto';

describe('cache crypto operations', () => {
    beforeAll(() => setupCryptoProxyForTesting());
    afterAll(() => releaseCryptoProxy());

    describe('generateOfflineComponents', () => {
        test('Should compute offline components correctly for a given password', async () => {
            /** mock argon2 to avoid jest keeping a dangling worker alive */
            const argon2 = jest.spyOn(CryptoProxy, 'computeArgon2').mockImplementation(async () => generateKey());

            const randomPassword = uint8ArrayToBinaryString(generateKey());
            const components = await generateOfflineComponents(randomPassword);

            expect(components.offlineConfig.salt).toBeDefined();
            expect(components.offlineConfig.params).toStrictEqual(ARGON2_PARAMS.RECOMMENDED);
            expect(components.offlineKD).toBeDefined();
            expect(components.offlineVerifier).toBeDefined();

            const offlineKey = await importSymmetricKey(binaryStringToUint8Array(components.offlineKD));
            const verifier = binaryStringToUint8Array(components.offlineVerifier);
            await expect((() => decryptData(offlineKey, verifier, PassEncryptionTag.Offline))()).resolves.toBeDefined();

            argon2.mockRestore();
        });
    });
});
