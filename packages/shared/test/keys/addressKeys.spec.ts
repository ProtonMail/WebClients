import type { Address } from '@proton/shared/lib/interfaces';

import {
    decryptAddressKeyToken,
    generateAddressKey,
    generateAddressKeyTokens,
    generateUserKey,
    getNewAddressKeyToken,
} from '../../lib/keys';

describe('address keys', () => {
    it('should throw if generated key cannot decrypt', async () => {
        await expectAsync(
            generateAddressKey({
                passphrase: '123',
                keyGenConfig: {
                    // @ts-expect-error option not declared, only needed for this test
                    subkeys: [],
                },
            })
        ).toBeRejectedWithError(/Unexpected key generation issue/);
    });

    it('should generate address key tokens', async () => {
        const { privateKey } = await generateUserKey({
            passphrase: '123',
        });
        const result = await generateAddressKeyTokens(privateKey);
        expect(result).toEqual({
            token: jasmine.any(String),
            encryptedToken: jasmine.stringMatching(/-----BEGIN PGP MESSAGE-----.*/),
            signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/),
        });
        const decryptedResult = await decryptAddressKeyToken({
            Token: result.encryptedToken,
            Signature: result.signature,
            privateKeys: privateKey,
            publicKeys: privateKey,
        });
        expect(decryptedResult).toEqual(result.token);
    });

    it('should generate address key tokens with organization', async () => {
        const { privateKey } = await generateUserKey({
            passphrase: '123',
        });
        const { privateKey: organizationKey } = await generateUserKey({
            passphrase: 'asd',
        });
        const result = await generateAddressKeyTokens(privateKey, organizationKey);
        expect(result).toEqual({
            token: jasmine.any(String),
            encryptedToken: jasmine.stringMatching(/-----BEGIN PGP MESSAGE-----.*/),
            signature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/),
            organizationSignature: jasmine.stringMatching(/-----BEGIN PGP SIGNATURE-----.*/),
        });
        const decryptedResult = await decryptAddressKeyToken({
            Token: result.encryptedToken,
            Signature: result.signature,
            privateKeys: privateKey,
            publicKeys: privateKey,
        });
        expect(decryptedResult).toEqual(result.token);
        const decryptedResult2 = await decryptAddressKeyToken({
            Token: result.encryptedToken,
            Signature: result.organizationSignature,
            privateKeys: organizationKey,
            publicKeys: organizationKey,
        });
        expect(decryptedResult2).toEqual(result.token);
    });

    it('should generate a new address key token without any existing tokens', async () => {
        const { privateKey } = await generateUserKey({
            passphrase: '123',
        });
        const address = {
            Keys: [],
        } as unknown as Address;
        const userKeys = [{ privateKey, publicKey: privateKey }];

        const result = await getNewAddressKeyToken({ userKeys, address });

        const decryptedResult = await decryptAddressKeyToken({
            Token: result.encryptedToken,
            Signature: result.signature,
            privateKeys: privateKey,
            publicKeys: privateKey,
        });
        expect(decryptedResult).toEqual(result.token);
    });

    it('should re-use an existing address key token when generating a new token', async () => {
        const { privateKey } = await generateUserKey({
            passphrase: '123',
        });
        const existingToken = await generateAddressKeyTokens(privateKey);

        const address = {
            Keys: [{ Token: existingToken.encryptedToken, Signature: existingToken.signature }],
        } as unknown as Address;
        const userKeys = [{ privateKey, publicKey: privateKey }];

        const result = await getNewAddressKeyToken({ userKeys, address });

        const decryptedResult = await decryptAddressKeyToken({
            Token: result.encryptedToken,
            Signature: result.signature,
            privateKeys: privateKey,
            publicKeys: privateKey,
        });
        expect(decryptedResult).toEqual(existingToken.token);
        expect(result.signature).toEqual(existingToken.signature);
    });
});
