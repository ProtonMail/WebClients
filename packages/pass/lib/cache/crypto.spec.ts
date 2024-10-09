import { ARGON2_PARAMS } from 'pmcrypto-v6-canary/lib/constants';

import { CryptoProxy } from '@proton/crypto/lib';
import { decryptData, generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '@proton/pass/lib/crypto/utils/testing';
import { PassEncryptionTag } from '@proton/pass/types';
import { stringToUint8Array, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';

import { getOfflineComponents } from './crypto';

describe('cache crypto operations', () => {
    beforeAll(() => setupCryptoProxyForTesting());
    afterAll(() => releaseCryptoProxy());

    describe('getOfflineComponents', () => {
        test('Should compute offline components correctly for a given password', async () => {
            /** mock argon2 to avoid jest keeping a dangling worker alive */
            const argon2 = jest.spyOn(CryptoProxy, 'computeArgon2').mockImplementation(async () => generateKey());

            const randomPassword = uint8ArrayToString(generateKey());
            const components = await getOfflineComponents(randomPassword);

            expect(components.offlineConfig.salt).toBeDefined();
            expect(components.offlineConfig.params).toStrictEqual(ARGON2_PARAMS.RECOMMENDED);
            expect(components.offlineKD).toBeDefined();
            expect(components.offlineVerifier).toBeDefined();

            const offlineKey = await importSymmetricKey(stringToUint8Array(components.offlineKD));
            const verifier = stringToUint8Array(components.offlineVerifier);
            await expect((() => decryptData(offlineKey, verifier, PassEncryptionTag.Offline))()).resolves.toBeDefined();

            argon2.mockRestore();
        });
    });
});
