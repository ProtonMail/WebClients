import { decryptAddressKeyToken, generateAddressKeyTokens, generateUserKey } from '../../lib/keys';

describe('address keys', () => {
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
            publicKeys: privateKey.toPublic(),
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
            publicKeys: privateKey.toPublic(),
        });
        expect(decryptedResult).toEqual(result.token);
        const decryptedResult2 = await decryptAddressKeyToken({
            Token: result.encryptedToken,
            Signature: result.organizationSignature,
            privateKeys: organizationKey,
            publicKeys: organizationKey.toPublic(),
        });
        expect(decryptedResult2).toEqual(result.token);
    });
});
