import { CryptoProxy } from '@proton/crypto';

import { generateSessionKey, releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../utils/test/crypto';
import { createVerifier } from './verifier';

jest.setTimeout(20000);

describe('verifier implementation', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    it('should throw if the block cannot be decrypted', async () => {
        const sessionKey = await generateSessionKey();
        const verify = createVerifier({ verificationCode: new Uint8Array(Array(32)), verifierSessionKey: sessionKey });

        const result = verify(new Uint8Array(Array(32)));

        await expect(result).rejects.toThrow();
    });

    describe('verification token', () => {
        [
            {
                name: 'should construct the verification token correctly',
                encryptedData: new Uint8Array([
                    6, 28, 236, 157, 20, 85, 195, 133, 7, 99, 11, 145, 123, 207, 27, 252, 80, 191, 107, 114, 195, 229,
                    120, 115, 8, 200, 34, 214, 178, 149, 78, 147,
                ]),
                verificationCode: new Uint8Array([
                    140, 211, 158, 220, 71, 191, 71, 163, 245, 33, 192, 146, 154, 221, 196, 250, 94, 23, 56, 28, 235,
                    121, 28, 103, 229, 119, 95, 39, 157, 119, 4, 231,
                ]),
                verificationToken: new Uint8Array([
                    138, 207, 114, 65, 83, 234, 132, 38, 242, 66, 203, 3, 225, 18, 223, 6, 14, 168, 83, 110, 40, 156,
                    100, 20, 237, 191, 125, 241, 47, 226, 74, 116,
                ]),
            },
            {
                name: 'should ignore extra bytes in the encrypted block when constructing the token',
                encryptedData: new Uint8Array([
                    6, 28, 236, 157, 20, 85, 195, 133, 7, 99, 11, 145, 123, 207, 27, 252, 80, 191, 107, 114, 195, 229,
                    120, 115, 8, 200, 34, 214, 178, 149, 78, 147, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
                ]),
                verificationCode: new Uint8Array([
                    140, 211, 158, 220, 71, 191, 71, 163, 245, 33, 192, 146, 154, 221, 196, 250, 94, 23, 56, 28, 235,
                    121, 28, 103, 229, 119, 95, 39, 157, 119, 4, 231,
                ]),
                verificationToken: new Uint8Array([
                    138, 207, 114, 65, 83, 234, 132, 38, 242, 66, 203, 3, 225, 18, 223, 6, 14, 168, 83, 110, 40, 156,
                    100, 20, 237, 191, 125, 241, 47, 226, 74, 116,
                ]),
            },
            {
                name: 'should pad the data with 0 if the encrypted block is shorter than the verification code',
                encryptedData: new Uint8Array([6, 28, 236, 157]),
                verificationCode: new Uint8Array([
                    140, 211, 158, 220, 71, 191, 71, 163, 245, 33, 192, 146, 154, 221, 196, 250, 94, 23, 56, 28, 235,
                    121, 28, 103, 229, 119, 95, 39, 157, 119, 4, 231,
                ]),
                verificationToken: new Uint8Array([
                    138, 207, 114, 65, 71, 191, 71, 163, 245, 33, 192, 146, 154, 221, 196, 250, 94, 23, 56, 28, 235,
                    121, 28, 103, 229, 119, 95, 39, 157, 119, 4, 231,
                ]),
            },
        ].forEach(({ name, encryptedData, verificationCode, verificationToken }) => {
            it(name, async () => {
                const sessionKey = await generateSessionKey();
                const verify = createVerifier({
                    verificationCode,
                    verifierSessionKey: sessionKey,
                });

                const decryptSpy = jest
                    .spyOn(CryptoProxy, 'decryptMessage')
                    .mockImplementation((async () => Promise.resolve()) as any);

                const result = verify(encryptedData);

                await expect(result).resolves.toStrictEqual(verificationToken);
                expect(decryptSpy).toHaveBeenCalled();
            });
        });
    });
});
