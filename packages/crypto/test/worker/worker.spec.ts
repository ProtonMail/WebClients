import { use as chaiUse, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { SessionKey, generateKey, getSHA256Fingerprints, reformatKey } from 'pmcrypto';
import {
    CompressedDataPacket,
    enums,
    decryptKey as openpgp_decryptKey,
    encryptKey as openpgp_encryptKey,
    readKey as openpgp_readKey,
    readMessage as openpgp_readMessage,
    readPrivateKey as openpgp_readPrivateKey,
    revokeKey as openpgp_revokeKey,
} from 'pmcrypto/lib/openpgp';

import { S2kTypeForConfig, VERIFICATION_STATUS } from '../../lib';
import {
    arrayToHexString,
    binaryStringToArray,
    hexStringToArray,
    stringToUtf8Array,
    utf8ArrayToString,
} from '../../lib/utils';
import { CryptoWorkerPool as CryptoWorker } from '../../lib/worker/workerPool';
import {
    testMessageEncryptedLegacy,
    testMessageEncryptedStandard,
    testMessageResult,
    testPrivateKeyLegacy,
} from './decryptMessageLegacy.data';
import { ecc25519Key, eddsaElGamalSubkey, keyWithThirdPartyCertifications, rsa512BitsKey } from './keys.data';
import {
    messageWithEmptySignature,
    key as mimeKey,
    multipartMessageWithAttachment,
    multipartSignedMessage,
    multipartSignedMessageBody,
} from './processMIME.data';

chaiUse(chaiAsPromised);

describe('Worker API and Worker Pool Integration', () => {
    before(async () => {
        await CryptoWorker.init({ poolSize: 1 });
    });

    afterEach(async () => {
        await CryptoWorker.clearKeyStore();
    });

    after(async () => {
        await CryptoWorker.destroy();
    });

    it('init - should throw if already initialised', async () => {
        await expect(CryptoWorker.init()).to.be.rejectedWith(/already initialised/);
    });

    it('decryptMessage - should decrypt message with correct password', async () => {
        const armoredMessage = `-----BEGIN PGP MESSAGE-----

wy4ECQMIxybp91nMWQIAa8pGeuXzR6zIs+uE6bUywPM4GKG8sve4lJoxGbVS
/xN10jwBEsZQGe7OTWqxJ9NNtv6X6qFEkvABp4PD3xvi34lo2WUAaUN2wb0g
tBiO7HKQxoGj3FnUTJnI52Y0pIg=
=HJfc
-----END PGP MESSAGE-----`;
        const decryptionResult = await CryptoWorker.decryptMessage({
            armoredMessage,
            passwords: 'password',
        });
        expect(decryptionResult.data).to.equal('hello world');
        expect(decryptionResult.signatures).to.have.length(0);
        expect(decryptionResult.verificationErrors).to.not.exist;
        expect(decryptionResult.verified).to.equal(VERIFICATION_STATUS.NOT_SIGNED);

        const decryptWithWrongPassword = CryptoWorker.decryptMessage({
            armoredMessage,
            passwords: 'wrong password',
        });
        await expect(decryptWithWrongPassword).to.be.rejectedWith(/Error decrypting message/);
    });

    it('decryptMessage - message with signature', async () => {
        const messageWithSignature = `-----BEGIN PGP MESSAGE-----

wy4ECQMIUxTg50RvG9EAMkSwKLgTqzpEMlGv1+IKf52HmId83iK4kku8nBzR
FxcD0sACAc9hM9NVeaAhGQdsTqt9zRcRmMRhyWqoAsR0+uZukqPxGZfOw0+6
ouguW3wrVd+/niaHPaDs87sATldw5KK5WI9xcR+mBid4Bq7hugXNcZDMa8qN
gqM8VJm8262cvZAtjwbH50TjBNl+q/YN7DDr+BXd6gRzrvMM+hl5UwYiiYfW
qXGo4MRQBT+B41Yjh/2rUdlCmWoRw2OGWzQTmTspNm4EEolrT6jdYQMxn9IZ
GzGRkb+Rzb42pnKcuihith40374=
=ccav
-----END PGP MESSAGE-----
`;
        const decryptionResult = await CryptoWorker.decryptMessage({
            armoredMessage: messageWithSignature,
            passwords: 'password',
        });

        expect(decryptionResult.data).to.equal('hello world');
        expect(decryptionResult.signatures).to.have.length(1);
        expect(decryptionResult.verificationErrors![0]).instanceOf(Error); // Errors should be automatically reconstructed by comlink
        expect(decryptionResult.verificationErrors![0]).to.match(/Could not find signing key/);
        expect(decryptionResult.verified).to.equal(VERIFICATION_STATUS.SIGNED_AND_INVALID);
    });

    it('decryptMessage - output binary data should be transferred', async () => {
        const decryptionResult = await CryptoWorker.decryptMessage({
            armoredMessage: `-----BEGIN PGP MESSAGE-----

wy4ECQMIxybp91nMWQIAa8pGeuXzR6zIs+uE6bUywPM4GKG8sve4lJoxGbVS
/xN10jwBEsZQGe7OTWqxJ9NNtv6X6qFEkvABp4PD3xvi34lo2WUAaUN2wb0g
tBiO7HKQxoGj3FnUTJnI52Y0pIg=
=HJfc
-----END PGP MESSAGE-----`,
            passwords: 'password',
            format: 'binary',
        });
        expect(decryptionResult.data).to.deep.equal(stringToUtf8Array('hello world'));
        expect(decryptionResult.signatures).to.have.length(0);
        expect(decryptionResult.verificationErrors).to.not.exist;
        expect(decryptionResult.verified).to.equal(VERIFICATION_STATUS.NOT_SIGNED);
    });

    it('decryptMessage - supports decrypting e2ee forwarded message', async () => {
        // final recipient key
        const fwdRecipientKeyArmored = `-----BEGIN PGP PRIVATE KEY BLOCK-----

xVgEZAdtGBYJKwYBBAHaRw8BAQdAcNgHyRGEaqGmzEqEwCobfUkyrJnY8faBvsf9
R2c5ZzYAAP9bFL4nPBdo04ei0C2IAh5RXOpmuejGC3GAIn/UmL5cYQ+XzRtjaGFy
bGVzIDxjaGFybGVzQHByb3Rvbi5tZT7CigQTFggAPAUCZAdtGAmQFXJtmBzDhdcW
IQRl2gNflypl1XjRUV8Vcm2YHMOF1wIbAwIeAQIZAQILBwIVCAIWAAIiAQAAJKYA
/2qY16Ozyo5erNz51UrKViEoWbEpwY3XaFVNzrw+b54YAQC7zXkf/t5ieylvjmA/
LJz3/qgH5GxZRYAH9NTpWyW1AsdxBGQHbRgSCisGAQQBl1UBBQEBB0CxmxoJsHTW
TiETWh47ot+kwNA1hCk1IYB9WwKxkXYyIBf/CgmKXzV1ODP/mRmtiBYVV+VQk5MF
EAAA/1NW8D8nMc2ky140sPhQrwkeR7rVLKP2fe5n4BEtAnVQEB3CeAQYFggAKgUC
ZAdtGAmQFXJtmBzDhdcWIQRl2gNflypl1XjRUV8Vcm2YHMOF1wIbUAAAl/8A/iIS
zWBsBR8VnoOVfEE+VQk6YAi7cTSjcMjfsIez9FYtAQDKo9aCMhUohYyqvhZjn8aS
3t9mIZPc+zRJtCHzQYmhDg==
=lESj
-----END PGP PRIVATE KEY BLOCK-----`;

        const fwdCiphertextArmored = `-----BEGIN PGP MESSAGE-----

wV4DB27Wn97eACkSAQdA62TlMU2QoGmf5iBLnIm4dlFRkLIg+6MbaatghwxK+Ccw
yGZuVVMAK/ypFfebDf4D/rlEw3cysv213m8aoK8nAUO8xQX3XQq3Sg+EGm0BNV8E
0kABEPyCWARoo5klT1rHPEhelnz8+RQXiOIX3G685XCWdCmaV+tzW082D0xGXSlC
7lM8r1DumNnO8srssko2qIja
=pVRa
-----END PGP MESSAGE-----`;

        const fwdRecipientKey = await CryptoWorker.importPrivateKey({
            armoredKey: fwdRecipientKeyArmored,
            passphrase: null,
        });

        const { data } = await CryptoWorker.decryptMessage({
            armoredMessage: fwdCiphertextArmored,
            decryptionKeys: fwdRecipientKey,
        });
        expect(data).to.deep.equal('Message for Bob');
    });

    it('decryptMessageLegacy - it can decrypt a legacy message', async () => {
        const privateKeyRef = await CryptoWorker.importPrivateKey({
            armoredKey: testPrivateKeyLegacy,
            passphrase: '123',
        });

        const decryptionResult = await CryptoWorker.decryptMessageLegacy({
            armoredMessage: testMessageEncryptedLegacy,
            decryptionKeys: privateKeyRef,
            messageDate: new Date('2015-01-01'),
        });
        expect(decryptionResult.data).to.equal(testMessageResult);
        expect(decryptionResult.signatures).to.have.length(0);
        expect(decryptionResult.verificationErrors).to.not.exist;
        expect(decryptionResult.verified).to.equal(VERIFICATION_STATUS.NOT_SIGNED);
    });

    it('decryptMessageLegacy - it can decrypt a non-legacy armored message', async () => {
        const privateKeyRef = await CryptoWorker.importPrivateKey({
            armoredKey: testPrivateKeyLegacy,
            passphrase: '123',
        });

        const decryptionResult = await CryptoWorker.decryptMessageLegacy({
            armoredMessage: testMessageEncryptedStandard,
            decryptionKeys: privateKeyRef,
            verificationKeys: privateKeyRef,
            messageDate: new Date('2015-01-01'),
        });
        expect(decryptionResult.data).to.equal(testMessageResult);
        expect(decryptionResult.signatures).to.have.length(1);
        expect(decryptionResult.verificationErrors).to.not.exist;
        expect(decryptionResult.verified).to.equal(VERIFICATION_STATUS.SIGNED_AND_VALID);
    });

    it('encryptMessage - output binary message should be transferred', async () => {
        const encryptionResult = await CryptoWorker.encryptMessage({
            textData: 'hello world',
            passwords: 'password',
            format: 'binary',
        });
        expect(encryptionResult.message.length > 0).to.be.true;

        const decryptionResult = await CryptoWorker.decryptMessage({
            binaryMessage: encryptionResult.message,
            passwords: 'password',
        });
        expect(decryptionResult.signatures).to.have.length(0);
        expect(decryptionResult.verificationErrors).to.not.exist;
        expect(decryptionResult.verified).to.equal(VERIFICATION_STATUS.NOT_SIGNED);
    });

    it('encryptMessage - should compress with zlib only if given `compress: true`', async () => {
        const password = 'password';
        const { message: armoredMessage } = await CryptoWorker.encryptMessage({
            textData: 'hello world',
            passwords: password,
        });

        const encryptedMessage = await openpgp_readMessage({ armoredMessage });
        const decryptedMessage = await encryptedMessage.decrypt([], [password]);
        expect(decryptedMessage.packets.findPacket(enums.packet.compressedData)).to.be.undefined;

        // request compression
        const { message: compressedArmoredMessage } = await CryptoWorker.encryptMessage({
            textData: 'hello world',
            passwords: password,
            compress: true,
        });
        const compressedEncryptedMessage = await openpgp_readMessage({ armoredMessage: compressedArmoredMessage });
        const compressedDecryptedMessage = await compressedEncryptedMessage.decrypt([], [password]);
        const compressedPacket = compressedDecryptedMessage.packets.findPacket(
            enums.packet.compressedData
        ) as CompressedDataPacket;
        expect(compressedPacket).to.not.be.undefined;
        // @ts-ignore undeclared algorithm field
        expect(compressedPacket.algorithm).to.equal(enums.compression.zlib);
    });

    it('encryptMessage/decryptMessage - should encrypt and decrypt text and binary data', async () => {
        const privateKeyRef = await CryptoWorker.generateKey({ userIDs: { name: 'name', email: 'email@test.com' } });
        const { message: encryptedArmoredMessage } = await CryptoWorker.encryptMessage({
            textData: 'hello world',
            encryptionKeys: privateKeyRef,
            signingKeys: undefined, // redundant; test that the option can still be serialized correctly
        });

        const textDecryptionResult = await CryptoWorker.decryptMessage({
            armoredMessage: encryptedArmoredMessage,
            decryptionKeys: privateKeyRef,
        });
        expect(textDecryptionResult.data).to.equal('hello world');
        expect(textDecryptionResult.signatures).to.have.length(0);
        expect(textDecryptionResult.verificationErrors).to.not.exist;
        expect(textDecryptionResult.verified).to.equal(VERIFICATION_STATUS.NOT_SIGNED);

        const { message: encryptedBinaryMessage } = await CryptoWorker.encryptMessage({
            binaryData: new Uint8Array([1, 2, 3]),
            encryptionKeys: privateKeyRef,
            format: 'binary',
        });

        const binaryDecryptionResult = await CryptoWorker.decryptMessage({
            binaryMessage: encryptedBinaryMessage,
            decryptionKeys: privateKeyRef,
            format: 'binary',
        });
        expect(binaryDecryptionResult.data).to.deep.equal(new Uint8Array([1, 2, 3]));
        expect(binaryDecryptionResult.signatures).to.have.length(0);
        expect(binaryDecryptionResult.verificationErrors).to.not.exist;
        expect(binaryDecryptionResult.verified).to.equal(VERIFICATION_STATUS.NOT_SIGNED);
    });

    it('encryptMessage/decryptMessage - with elgamal key', async () => {
        // an elgamal key is considered insecure by OpenPGP.js by default, but we need to allow existing keys to be used for now.
        const weakKeyRef = await CryptoWorker.importPrivateKey({ armoredKey: eddsaElGamalSubkey, passphrase: null });
        const { message: encryptedArmoredMessage } = await CryptoWorker.encryptMessage({
            textData: 'hello world',
            encryptionKeys: weakKeyRef,
        });

        const textDecryptionResult = await CryptoWorker.decryptMessage({
            armoredMessage: encryptedArmoredMessage,
            decryptionKeys: weakKeyRef,
        });
        expect(textDecryptionResult.data).to.equal('hello world');
        expect(textDecryptionResult.signatures).to.have.length(0);
        expect(textDecryptionResult.verificationErrors).to.not.exist;
        expect(textDecryptionResult.verified).to.equal(VERIFICATION_STATUS.NOT_SIGNED);
    });

    it('signMessage/verifyMessage - output binary signature and data should be transferred', async () => {
        const privateKeyRef = await CryptoWorker.generateKey({ userIDs: { name: 'name', email: 'email@test.com' } });
        const binarySignature = await CryptoWorker.signMessage({
            textData: 'hello world',
            format: 'binary',
            detached: true,
            signingKeys: privateKeyRef,
        });
        expect(binarySignature.length > 0).to.be.true;

        const verificationResult = await CryptoWorker.verifyMessage({
            textData: 'hello world',
            verificationKeys: privateKeyRef,
            binarySignature,
        });
        expect(verificationResult.data).to.equal('hello world');
        expect(verificationResult.signatures).to.have.length(1);
        expect(verificationResult.errors).to.not.exist;
        expect(verificationResult.verified).to.equal(VERIFICATION_STATUS.SIGNED_AND_VALID);

        const invalidVerificationResult = await CryptoWorker.verifyMessage({
            textData: 'not signed data',
            binarySignature,
            verificationKeys: privateKeyRef,
            format: 'binary',
        });
        expect(invalidVerificationResult.data).to.deep.equal(stringToUtf8Array('not signed data'));
        expect(invalidVerificationResult.signatures).to.have.length(1);
        expect(invalidVerificationResult.errors).to.have.length(1);
        expect(invalidVerificationResult.verified).to.equal(VERIFICATION_STATUS.SIGNED_AND_INVALID);
    });

    it('signMessage/verifyMessage - with context', async () => {
        const privateKeyRef = await CryptoWorker.generateKey({ userIDs: { name: 'name', email: 'email@test.com' } });
        const textData = 'message with context';

        const armoredSignature = await CryptoWorker.signMessage({
            textData,
            signingKeys: privateKeyRef,
            context: { value: 'test-context', critical: true },
            detached: true,
        });

        const verificationValidContext = await CryptoWorker.verifyMessage({
            textData,
            armoredSignature,
            verificationKeys: privateKeyRef,
            context: { value: 'test-context', required: true },
        });

        const verificationMissingContext = await CryptoWorker.verifyMessage({
            textData,
            armoredSignature,
            verificationKeys: privateKeyRef,
        });

        expect(verificationValidContext.verified).to.equal(VERIFICATION_STATUS.SIGNED_AND_VALID);
        expect(verificationMissingContext.verified).to.equal(VERIFICATION_STATUS.SIGNED_AND_INVALID);
        // check errors
        expect(verificationValidContext.errors).to.be.undefined;
        expect(verificationMissingContext.errors).to.have.length(1);
        expect(verificationMissingContext.errors![0]).to.match(/Unknown critical notation: context@proton/);
    });

    it('verifyCleartextMessage - output binary signature should be transferred', async () => {
        const armoredKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----

xjMEYj2jmxYJKwYBBAHaRw8BAQdAlG1ARz91CtsRmJ0lQo2wOqAzUXn8KnOu
oBdEwZWZhPvNDzx0ZXN0QHRlc3QuY29tPsKMBBAWCgAdBQJiPaObBAsJBwgD
FQgKBBYAAgECGQECGwMCHgEAIQkQ0k/eZvRKo8YWIQQseK5K/i3v7uzoNYHS
T95m9EqjxqiLAP9sIlmYlCVgSiPZBmsixn9CL27Hv/Bgr2nc73v9K5OszAEA
ypolW41xuLR+4D7vvxT66lwMMVagQSIisR+49QQP2w8=
=rzuc
-----END PGP PUBLIC KEY BLOCK-----`;
        const armoredCleartextMessage = `-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

hello world
-----BEGIN PGP SIGNATURE-----

wnUEARYKAAYFAmI9o6IAIQkQ0k/eZvRKo8YWIQQseK5K/i3v7uzoNYHST95m
9EqjxoO3AP9xPAlk+qZ3sr/Y1lgWBIdoGeQ1ZGzLKVVzgrhH5sOcZQEA3AeS
fLz+Lk0ZkB4L3nhM/c6sQKSsI9k2Tptm1VZ5+Qo=
=1A38
-----END PGP SIGNATURE-----`;
        const publicKeyRef = await CryptoWorker.importPublicKey({ armoredKey });
        const verificationResult = await CryptoWorker.verifyCleartextMessage({
            armoredCleartextMessage,
            verificationKeys: publicKeyRef,
        });
        expect(verificationResult.data).to.equal('hello world');
        expect(verificationResult.signatures).to.have.length(1);
        expect(verificationResult.errors).to.not.exist;
        expect(verificationResult.verified).to.equal(VERIFICATION_STATUS.SIGNED_AND_VALID);

        const invalidVerificationResult = await CryptoWorker.verifyCleartextMessage({
            armoredCleartextMessage,
            verificationKeys: [],
        });
        expect(invalidVerificationResult.signatures).to.have.length(1);
        expect(invalidVerificationResult.errors).to.have.length(1);
        expect(invalidVerificationResult.verified).to.equal(VERIFICATION_STATUS.SIGNED_AND_INVALID);
    });

    it('should encrypt/sign and decrypt/verify text and binary data', async () => {
        const aliceKeyRef = await CryptoWorker.generateKey({ userIDs: { name: 'alice', email: 'alice@test.com' } });
        const bobKeyRef = await CryptoWorker.generateKey({ userIDs: { name: 'bob', email: 'bob@test.com' } });

        const { message: encryptedArmoredMessage } = await CryptoWorker.encryptMessage({
            textData: 'hello world',
            encryptionKeys: bobKeyRef,
            signingKeys: aliceKeyRef,
        });

        const textDecryptionResult = await CryptoWorker.decryptMessage({
            armoredMessage: encryptedArmoredMessage,
            decryptionKeys: bobKeyRef,
            verificationKeys: aliceKeyRef,
        });
        expect(textDecryptionResult.data).to.equal('hello world');
        expect(textDecryptionResult.signatures).to.have.length(1);
        expect(textDecryptionResult.verificationErrors).to.not.exist;
        expect(textDecryptionResult.verified).to.equal(VERIFICATION_STATUS.SIGNED_AND_VALID);

        const { message: encryptedBinaryMessage } = await CryptoWorker.encryptMessage({
            binaryData: new Uint8Array([1, 2, 3]),
            encryptionKeys: bobKeyRef,
            signingKeys: aliceKeyRef,
            format: 'binary',
        });

        const binaryDecryptionResult = await CryptoWorker.decryptMessage({
            binaryMessage: encryptedBinaryMessage,
            decryptionKeys: bobKeyRef,
            verificationKeys: aliceKeyRef,
            format: 'binary',
        });
        expect(binaryDecryptionResult.data).to.deep.equal(new Uint8Array([1, 2, 3]));
        expect(binaryDecryptionResult.signatures).to.have.length(1);
        expect(binaryDecryptionResult.verificationErrors).to.not.exist;
        expect(binaryDecryptionResult.verified).to.equal(VERIFICATION_STATUS.SIGNED_AND_VALID);
    });

    it('should encrypt/sign and decrypt/verify binary data with detached signatures', async () => {
        const aliceKeyRef = await CryptoWorker.generateKey({ userIDs: { name: 'alice', email: 'alice@test.com' } });
        const bobKeyRef = await CryptoWorker.generateKey({ userIDs: { name: 'bob', email: 'bob@test.com' } });

        const plaintext = stringToUtf8Array('hello world');
        const {
            message: encryptedBinaryMessage,
            signature: detachedBinarySignature,
            encryptedSignature: encryptedBinarySignature,
        } = await CryptoWorker.encryptMessage({
            binaryData: plaintext,
            encryptionKeys: bobKeyRef,
            signingKeys: aliceKeyRef,
            format: 'binary',
            detached: true,
        });

        const decryptionResult = await CryptoWorker.decryptMessage({
            binaryMessage: encryptedBinaryMessage,
            binarySignature: detachedBinarySignature,
            decryptionKeys: bobKeyRef,
            verificationKeys: aliceKeyRef,
            format: 'binary',
        });
        expect(decryptionResult.data).to.deep.equal(plaintext);
        expect(decryptionResult.signatures).to.have.length(1);
        expect(decryptionResult.verificationErrors).to.not.exist;
        expect(decryptionResult.verified).to.equal(VERIFICATION_STATUS.SIGNED_AND_VALID);

        const decryptionResultWithEncryptedSignature = await CryptoWorker.decryptMessage({
            binaryMessage: encryptedBinaryMessage,
            binaryEncryptedSignature: encryptedBinarySignature,
            decryptionKeys: bobKeyRef,
            verificationKeys: aliceKeyRef,
            format: 'binary',
        });
        expect(decryptionResultWithEncryptedSignature.data).to.deep.equal(plaintext);
        expect(decryptionResultWithEncryptedSignature.signatures).to.have.length(1);
        expect(decryptionResultWithEncryptedSignature.verificationErrors).to.not.exist;
        expect(decryptionResultWithEncryptedSignature.verified).to.equal(VERIFICATION_STATUS.SIGNED_AND_VALID);
    });

    it('should support encrypting/decrypting using argon2', async () => {
        const passwords = 'password';
        const sessionKey = {
            algorithm: enums.read(enums.symmetric, enums.symmetric.aes128),
            data: hexStringToArray('01FE16BBACFD1E7B78EF3B865187374F'),
        };
        const encrypted = await CryptoWorker.encryptSessionKey({
            ...sessionKey,
            passwords,
            format: 'binary',
            config: { s2kType: S2kTypeForConfig.argon2 },
        });
        // ensure encryption used argon2
        const skeskStartIndex = 2;
        expect(encrypted[skeskStartIndex]).to.equal(4); // SKESK version (v6 format is different, test needs updating)
        expect(encrypted[skeskStartIndex + 2]).to.equal(S2kTypeForConfig.argon2);

        const decryptedSessionKey = await CryptoWorker.decryptSessionKey({ binaryMessage: encrypted, passwords });
        expect(decryptedSessionKey).to.deep.equal(sessionKey);
    });

    it('generateSessionKey - should return session key of expected size', async () => {
        const sessionKey128 = await CryptoWorker.generateSessionKeyForAlgorithm('aes128');
        expect(sessionKey128.length).to.equal(16);
        const sessionKey192 = await CryptoWorker.generateSessionKeyForAlgorithm('aes192');
        expect(sessionKey192.length).to.equal(24);
        const sessionKey256 = await CryptoWorker.generateSessionKeyForAlgorithm('aes256');
        expect(sessionKey256.length).to.equal(32);
    });

    it('generateSessionKeyFromKeyPreferences - should return shared algo preference', async () => {
        const aliceKeyRef = await CryptoWorker.generateKey({ userIDs: { name: 'alice', email: 'alice@test.com' } });
        const bobKeyRef = await CryptoWorker.generateKey({ userIDs: { name: 'bob', email: 'bob@test.com' } });

        const sessionKey = await CryptoWorker.generateSessionKey({
            recipientKeys: [aliceKeyRef, bobKeyRef],
        });
        expect(sessionKey.algorithm).to.equal('aes256');
    });

    it('generate/encrypt/decryptSessionKey - should encrypt and decrypt with key and password', async () => {
        const privateKeyRef = await CryptoWorker.generateKey({ userIDs: { name: 'test', email: 'test@test.com' } });
        const password = 'password';

        const sessionKey: SessionKey = {
            data: new Uint8Array(16).fill(123),
            algorithm: 'aes128',
        };

        // armored result
        await CryptoWorker.encryptSessionKey({
            ...sessionKey,
            encryptionKeys: privateKeyRef,
            passwords: password,
        }).then(async (armoredEncryptedSessionKey) => {
            const decryptedSessionKeyWithPassword = await CryptoWorker.decryptSessionKey({
                armoredMessage: armoredEncryptedSessionKey,
                passwords: password,
            });
            expect(decryptedSessionKeyWithPassword).to.deep.equal(sessionKey);
            const decryptedSessionKeyWithKey = await CryptoWorker.decryptSessionKey({
                armoredMessage: armoredEncryptedSessionKey,
                decryptionKeys: privateKeyRef,
            });
            expect(decryptedSessionKeyWithKey).to.deep.equal(sessionKey);
        });

        // binary result
        await CryptoWorker.encryptSessionKey({
            ...sessionKey,
            encryptionKeys: privateKeyRef,
            passwords: password,
            format: 'binary',
        }).then(async (binaryEncryptedSessionKey) => {
            const decryptedSessionKeyWithPassword = await CryptoWorker.decryptSessionKey({
                binaryMessage: binaryEncryptedSessionKey,
                passwords: password,
            });
            expect(decryptedSessionKeyWithPassword).to.deep.equal(sessionKey);
            const decryptedSessionKeyWithKey = await CryptoWorker.decryptSessionKey({
                binaryMessage: binaryEncryptedSessionKey,
                decryptionKeys: privateKeyRef,
            });
            expect(decryptedSessionKeyWithKey).to.deep.equal(sessionKey);
        });
    });

    it('processMIME - it can process multipart/signed mime messages and verify the signature', async () => {
        const mimeKeyRef = await CryptoWorker.importPublicKey({ armoredKey: mimeKey });
        const { body, verified, signatures } = await CryptoWorker.processMIME({
            data: multipartSignedMessage,
            verificationKeys: mimeKeyRef,
        });
        expect(verified).to.equal(VERIFICATION_STATUS.SIGNED_AND_VALID);
        expect(signatures.length).to.equal(1);
        expect(signatures[0].length > 0).to.be.true; // check that serialized signature is transferred
        expect(body).to.equal(multipartSignedMessageBody);
    });

    it('processMIME - it can parse message with text attachment', async () => {
        const { verified, body, signatures, attachments } = await CryptoWorker.processMIME({
            data: multipartMessageWithAttachment,
        });
        expect(verified).to.equal(VERIFICATION_STATUS.NOT_SIGNED);
        expect(signatures.length).to.equal(0);
        expect(body).to.equal('this is the body text\n');
        expect(attachments.length).to.equal(1);
        const [attachment] = attachments;
        expect(attachment.fileName).to.equal('test.txt');
        expect(attachment.contentId.endsWith('@pmcrypto>')).to.be.true;
        expect(attachment.content.length > 0).to.be.true;
        expect(attachment.content.length).to.equal(attachment.size);
        expect(utf8ArrayToString(attachment.content)).to.equal('this is the attachment text\n');
    });

    it('processMIME - it can parse message with empty signature', async () => {
        const { body, signatures, verified, attachments } = await CryptoWorker.processMIME({
            data: messageWithEmptySignature,
        });
        expect(verified).to.equal(VERIFICATION_STATUS.NOT_SIGNED);
        expect(signatures).to.have.length(0);
        expect(body).to.equal('<div>Hello</div>\n');
        expect(attachments).to.have.length(1); // signature part that failed to parse
        expect(attachments[0].content).to.have.length(0);
    });

    it('getMessageInfo - it returns correct keyIDs', async () => {
        const signedMessage = `-----BEGIN PGP MESSAGE-----

xA0DAQoWaZjmpnshsL8Bywt1AGIyFfFoZWxsb8J1BAEWCgAGBQJiMhXxACEJ
EGmY5qZ7IbC/FiEE3C2Gg07gzeD8liPcaZjmpnshsL9atgD+PiNipUtpGyv7
Jky/kRH9ikiCFdnNCPmXpGM/HXBQsnAA/jZVt+uBEVIgTeTJ9c7AqEgV3x9K
2Dj4M71DOHZr/lAL
=gTiI
-----END PGP MESSAGE-----`;
        const encryptedMessage = `-----BEGIN PGP MESSAGE-----

wV4DmdSzzm35uOMSAQdAfIPK4Iteh+VVFIddVCaR60ETJ8mhx6ytbR7ppS4h
qiAwqc/J464YnVgZ8BbGLt0k2ipAsR5y0M+I+GivWhCXMSKtRwvBmwiCgiE7
PzIOge9V0jYBuRj2e07jffFN7LDy9Q6kaLdkj+R/pAJi1StBntsW0sBBSkcN
xMT1c31ROTrAe4C6g21wLAY=
=2VmX
-----END PGP MESSAGE-----`;

        const signedMessageInfo = await CryptoWorker.getMessageInfo({ armoredMessage: signedMessage });
        expect(signedMessageInfo.encryptionKeyIDs).to.deep.equal([]);
        expect(signedMessageInfo.signingKeyIDs).to.deep.equal(['6998e6a67b21b0bf']);

        const encryptedMessageInfo = await CryptoWorker.getMessageInfo({ armoredMessage: encryptedMessage });
        expect(encryptedMessageInfo.encryptionKeyIDs).to.deep.equal(['99d4b3ce6df9b8e3']);
        expect(encryptedMessageInfo.signingKeyIDs).to.deep.equal([]);
    });

    it('getSignatureInfo - it returns correct keyIDs', async () => {
        const armoredSignature = `-----BEGIN PGP SIGNATURE-----

wnUEARYKAAYFAmIyIZcAIQkQaZjmpnshsL8WIQTcLYaDTuDN4PyWI9xpmOam
eyGwv58uAQDBVzpXdSjXtEleTrlCDV0Ai7edrGelnbYl5M5QWHsO6AEA7ylY
M8uical4EQWijKwbwpfCViRXlPLbWED7HjRFJAQ=
=jrvP
-----END PGP SIGNATURE-----`;

        const signatureInfo = await CryptoWorker.getSignatureInfo({ armoredSignature });
        expect(signatureInfo.signingKeyIDs).to.deep.equal(['6998e6a67b21b0bf']);
    });

    it('getKeyInfo - it returns correct key type and encryption status', async () => {
        const armoredPublicKey = ecc25519Key;
        const armoredDecryptedPrivateKey = `-----BEGIN PGP PRIVATE KEY BLOCK-----

xVgEYjn/DRYJKwYBBAHaRw8BAQdACQUzjf/48LfAqt/iJoCLvNh82ezGNLad
uLoCyyqP+kMAAQDlR+FqVc7sOXkWw9Ce21H9U75JbXkQZdopNT6rmUP5eRDN
zRE8dGVzdEB3b3JrZXIuY29tPsKMBBAWCgAdBQJiOf8NBAsJBwgDFQgKBBYA
AgECGQECGwMCHgEAIQkQgXhWyqdTIuIWIQSLE8CDw3U8LVFQRY6BeFbKp1Mi
4kBPAQCHH7+sA6/Rvn/cABOPdGuDz6LtBB2pai5ahUuYTyBP1QEAgG/KR/AX
fWuidzPVytVcHmE7PH0ZUe/J8qAxszespALHXQRiOf8NEgorBgEEAZdVAQUB
AQdAi+mqfJuhbYqNNrCRb0w8dDMImkdk9ygaZZXgzh6REWwDAQgHAAD/eBLr
qR+dnBSXPk7n+0+/6bWjBWrYc6vDElTpPSA3stARasJ4BBgWCAAJBQJiOf8N
AhsMACEJEIF4VsqnUyLiFiEEixPAg8N1PC1RUEWOgXhWyqdTIuLV3QD/e6jQ
Y9qpG8A3sC7ZB29GClPXVJy6uL2Ai5R37cGozfUA/REr1bi6Ac4FauZsge1+
Z3SSOseslp6+4nnQ3zOqnisO
=pEmk
-----END PGP PRIVATE KEY BLOCK-----`;
        const encryptedPrivateKey = await openpgp_encryptKey({
            privateKey: await openpgp_readPrivateKey({ armoredKey: armoredDecryptedPrivateKey }),
            passphrase: 'passphrase',
        });

        const publicKeyInfo = await CryptoWorker.getKeyInfo({ armoredKey: armoredPublicKey });
        expect(publicKeyInfo.keyIsPrivate).to.be.false;
        expect(publicKeyInfo.keyIsDecrypted).to.be.null;
        const decryptedKeyInfo = await CryptoWorker.getKeyInfo({ armoredKey: armoredDecryptedPrivateKey });
        expect(decryptedKeyInfo.keyIsPrivate).to.be.true;
        expect(decryptedKeyInfo.keyIsDecrypted).to.be.true;

        const encryptedKeyInfo = await CryptoWorker.getKeyInfo({ armoredKey: encryptedPrivateKey.armor() });
        expect(encryptedKeyInfo.keyIsPrivate).to.be.true;
        expect(encryptedKeyInfo.keyIsDecrypted).to.be.false;
        expect(encryptedKeyInfo.fingerprint).to.equal(encryptedPrivateKey.getFingerprint());
        expect(encryptedKeyInfo.keyIDs).to.deep.equal(encryptedPrivateKey.getKeyIDs().map((keyID) => keyID.toHex()));
    });

    it('getArmoredKeys - it returns a valid armored key', async () => {
        const hexBinaryPublicKey = `c63304623b4fac16092b06010401da470f010107405787b1d537d9974a40fea2f239578b81c355991ac4fe619a1595c3f21ecfb3abcd113c7465737440776f726b65722e636f6d3ec28c0410160a001d0502623b4fac040b0907080315080a0416000201021901021b03021e0100210910db8c8a5d901c2766162104d26cda9d40b4fea61b6cb65adb8c8a5d901c2766f80e00fd1eb4b4c4917d18436081ff9f463b9cc595af7805c789ba3b57a6b66511ff95d600fe36072060165618fed927051527d585ff26c3293b42671f2a169f47a4df6ba50cce3804623b4fac120a2b06010401975501050101074057571d1c77fbcb8f9fd0abd3d4f0e95ea725f569a49ec4faf0d2d0df8df3cd4103010807c2780418160800090502623b4fac021b0c00210910db8c8a5d901c2766162104d26cda9d40b4fea61b6cb65adb8c8a5d901c27665f760100e650904af11ea8933e9b91028df04375867f15b2542e8f8f86c2069081f66ed000fb06ddfa8ce3370eb9b92e93c40f7a624c1bf3b190f26beba3a9a93107b9ad310e`;

        const armoredKeys = await CryptoWorker.getArmoredKeys({
            binaryKeys: hexStringToArray(hexBinaryPublicKey),
        });
        expect(armoredKeys).to.have.length(1);
        const key = await openpgp_readKey({ armoredKey: armoredKeys[0] });
        expect(key.isPrivate()).to.be.false;
    });

    it('getArmoredSignature - it returns a valid armored signature', async () => {
        const hexBinarySignature = `c2750401160a0006050262351cc9002109101a5092c9a2df33531621041f75b4729655e143dc146f941a5092c9a2df33532cba0100ab31401b4aca8b449dc490d16927e37c9510c076745795b3e73bba0209b826770100dc6a6fcc1aaa6fcbce51a5b20682ea201414ec923d387a4eb88932df87f6e60c`;

        const armoredSignature = await CryptoWorker.getArmoredSignature({
            binarySignature: hexStringToArray(hexBinarySignature),
        });
        const signatureInfo = await CryptoWorker.getSignatureInfo({ armoredSignature });
        expect(signatureInfo.signingKeyIDs).to.not.be.empty;
    });

    it('getArmoredMessage - it returns a valid armored message', async () => {
        const hexBinaryMessage = `c15e03f95c1ce325f4cb90120107409ebcb5a71c378c1f0936a5264aa69cd97d11abc03ff7e82077641e1e2000fd2e3000316865a8f7516e3048376a949ea31e84f1d5588fef7d485ece4e8a96358697c1c25a2019c8d6b527cea6c234265354d23c013b5dc3c8ab1a6bd1afda98ea4c5476dc93e4319c9f3734148ed7eec41adef1d80a86b02eb256e185bce5958f43dd0cbbf6eb654970d65234595e72`;

        const armoredMessage = await CryptoWorker.getArmoredMessage({
            binaryMessage: hexStringToArray(hexBinaryMessage),
        });

        const message = await openpgp_readMessage({ armoredMessage });
        expect(message.getEncryptionKeyIDs()).to.not.be.empty;
    });

    it('isExpiredKey/canKeyEncrypt - it can correctly detect an expired key', async () => {
        const now = new Date();
        const future = new Date(+now + 1000);
        const past = new Date(+now - 1000);
        // key expires in one second
        const expiringKeyRef = await CryptoWorker.generateKey({
            userIDs: [{ name: 'name', email: 'email@test.com' }],
            date: now,
            keyExpirationTime: 1,
        });
        expect(await CryptoWorker.isExpiredKey({ key: expiringKeyRef, date: now })).to.be.false;
        expect(await CryptoWorker.isExpiredKey({ key: expiringKeyRef, date: future })).to.be.true;
        expect(await CryptoWorker.isExpiredKey({ key: expiringKeyRef, date: past })).to.be.true;
        // canKeyEncrypt should return false for expired keys
        expect(await CryptoWorker.canKeyEncrypt({ key: expiringKeyRef, date: now })).to.be.true;
        expect(await CryptoWorker.canKeyEncrypt({ key: expiringKeyRef, date: past })).to.be.false;

        const keyReference = await CryptoWorker.generateKey({
            userIDs: [{ name: 'name', email: 'email@test.com' }],
            date: now,
        });
        expect(await CryptoWorker.isExpiredKey({ key: keyReference })).to.be.false;
        expect(await CryptoWorker.isExpiredKey({ key: keyReference, date: past })).to.be.true;
    });

    it('isRevokedKey/canKeyEncrypt - it can correctly detect a revoked key', async () => {
        const past = new Date(0);
        const now = new Date();

        const { privateKey: key, revocationCertificate } = await generateKey({
            userIDs: [{ name: 'name', email: 'email@test.com' }],
            date: past,
            format: 'object',
        });
        const { publicKey: armoredRevokedKey } = await openpgp_revokeKey({
            key,
            revocationCertificate,
        });

        const keyRef = await CryptoWorker.importPublicKey({ armoredKey: key.armor() });
        const revokedKeyRef = await CryptoWorker.importPublicKey({ armoredKey: armoredRevokedKey });
        expect(await CryptoWorker.isRevokedKey({ key: revokedKeyRef, date: past })).to.be.true;
        expect(await CryptoWorker.isRevokedKey({ key: revokedKeyRef, date: now })).to.be.true;
        expect(await CryptoWorker.isRevokedKey({ key: keyRef, date: now })).to.be.false;
        // canKeyEncrypt should return false for revoked key
        expect(await CryptoWorker.canKeyEncrypt({ key: revokedKeyRef, date: now })).to.be.false;
        expect(await CryptoWorker.canKeyEncrypt({ key: keyRef, date: now })).to.be.true;
    });

    it('getSHA256Fingerprints - it returns the expected fingerprints', async () => {
        const key = await openpgp_readKey({ armoredKey: ecc25519Key });
        const keyReference = await CryptoWorker.importPublicKey({ armoredKey: ecc25519Key });
        const sha256Fingerprings = await CryptoWorker.getSHA256Fingerprints({ key: keyReference });
        expect(sha256Fingerprings).to.deep.equal(await getSHA256Fingerprints(key));
    });

    it('computeHash', async () => {
        const testHashMD5 = await CryptoWorker.computeHash({
            algorithm: 'unsafeMD5',
            data: binaryStringToArray('The quick brown fox jumps over the lazy dog'),
        }).then(arrayToHexString);
        expect(testHashMD5).to.equal('9e107d9d372bb6826bd81d3542a419d6');

        const testHashSHA1 = await CryptoWorker.computeHash({ algorithm: 'unsafeSHA1', data: new Uint8Array() }).then(
            arrayToHexString
        );
        expect(testHashSHA1).to.equal('da39a3ee5e6b4b0d3255bfef95601890afd80709');

        const testHashSHA256 = await CryptoWorker.computeHash({ algorithm: 'SHA256', data: new Uint8Array() }).then(
            arrayToHexString
        );
        expect(testHashSHA256).to.equal('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

        const testHashSHA512 = await CryptoWorker.computeHash({ algorithm: 'SHA512', data: new Uint8Array() }).then(
            arrayToHexString
        );
        expect(testHashSHA512).to.equal(
            'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e'
        );
    });

    it('computeHashStream', async () => {
        const emptyDataStream = new ReadableStream<Uint8Array>({
            start: (controller) => {
                for (let i = 0; i < 100; i++) {
                    controller.enqueue(new Uint8Array());
                }
                controller.close();
            },
        });
        const testHashSHA1Empty = await CryptoWorker.computeHashStream({
            algorithm: 'unsafeSHA1',
            dataStream: emptyDataStream,
        }).then(arrayToHexString);
        expect(testHashSHA1Empty).to.equal('da39a3ee5e6b4b0d3255bfef95601890afd80709');

        // `data` and `dataStream` share the underlying buffer: this is to test that no byte transferring is taking place
        const data = new Uint8Array(100).fill(1);
        const dataStream = new ReadableStream<Uint8Array>({
            pull: (controller) => {
                for (let i = 0; i < 10; i++) {
                    controller.enqueue(data.subarray(i, i + 10));
                }
                controller.close();
            },
        });
        const testHashSHA1Streamed = await CryptoWorker.computeHashStream({ algorithm: 'unsafeSHA1', dataStream }).then(
            arrayToHexString
        );
        const testHashSHA1 = await CryptoWorker.computeHash({ algorithm: 'unsafeSHA1', data }).then(arrayToHexString);
        expect(testHashSHA1).to.equal('3f3feea4f73d400fe98b7518a4b21ad4fc80476d');
        expect(testHashSHA1Streamed).to.equal(testHashSHA1);
    });

    it('replaceUserIDs - the target key user IDs match the source key ones', async () => {
        const sourceKey = await openpgp_readKey({
            armoredKey: `-----BEGIN PGP PRIVATE KEY BLOCK-----

xVgEYkMx+RYJKwYBBAHaRw8BAQdA2wiwC/FbumCQYlJAEHeRCm2GZD0S1aPt
BG6ZcpuehWUAAQDpWPNfvUtTnn6AiJ/xEQ09so7ZWF+2GHlaOglSQUADwQ5J
zQ88Y0B3b3JrZXIudGVzdD7CiQQQFgoAGgUCYkMx+QQLCQcIAxUICgQWAAIB
AhsDAh4BACEJECO0b8qLQMw0FiEEYiHKmAo/cFLglZrtI7RvyotAzDRu6QEA
mbhLi00tsTr7hmJxIPw4JLHGw8UVvztUfeyFE6ZqAIsBAJtF8P9pcZxHKb58
nNamH0U5+cC+9hN9uw2pn51NIY8KzQ88YkB3b3JrZXIudGVzdD7CiQQQFgoA
GgUCYkMx+QQLCQcIAxUICgQWAAIBAhsDAh4BACEJECO0b8qLQMw0FiEEYiHK
mAo/cFLglZrtI7RvyotAzDSSNwD+JDTJNbf8/0u9QUS3liusBKk5qKUPXG+j
ezH+Sgw1wagA/36wOxNMHxVUJXBjYiOIrZjcUKwXPR2pjke6zgntRuQOx10E
YkMx+RIKKwYBBAGXVQEFAQEHQJDjVd81zZuOdxAkjMe6Y+8Bj8gF9PKBkMJ+
I8Yc2OQKAwEIBwAA/2Ikos/IDw3uCSa6DGRoMDzQzZSwyzIO0XhoP9cgKSb4
Dw/CeAQYFggACQUCYkMx+QIbDAAhCRAjtG/Ki0DMNBYhBGIhypgKP3BS4JWa
7SO0b8qLQMw02YoBAOwG3hB8S5NBjdam/kRWvRjS8LMZDsVICPpOrwhQXkRl
AQDFe4bzH3MY16IqrIq70QSCxqLJ0Ao+NYb1whc/mXYOAA==
=p5Q+
-----END PGP PRIVATE KEY BLOCK-----`,
        });
        const targetKey = await openpgp_readPrivateKey({
            armoredKey: `-----BEGIN PGP PRIVATE KEY BLOCK-----

xVgEYkMx+RYJKwYBBAHaRw8BAQdA2wiwC/FbumCQYlJAEHeRCm2GZD0S1aPt
BG6ZcpuehWUAAQDpWPNfvUtTnn6AiJ/xEQ09so7ZWF+2GHlaOglSQUADwQ5J
zQ88Y0B3b3JrZXIudGVzdD7CiQQQFgoAGgUCYkMx+QQLCQcIAxUICgQWAAIB
AhsDAh4BACEJECO0b8qLQMw0FiEEYiHKmAo/cFLglZrtI7RvyotAzDRu6QEA
mbhLi00tsTr7hmJxIPw4JLHGw8UVvztUfeyFE6ZqAIsBAJtF8P9pcZxHKb58
nNamH0U5+cC+9hN9uw2pn51NIY8Kx10EYkMx+RIKKwYBBAGXVQEFAQEHQJDj
Vd81zZuOdxAkjMe6Y+8Bj8gF9PKBkMJ+I8Yc2OQKAwEIBwAA/2Ikos/IDw3u
CSa6DGRoMDzQzZSwyzIO0XhoP9cgKSb4Dw/CeAQYFggACQUCYkMx+QIbDAAh
CRAjtG/Ki0DMNBYhBGIhypgKP3BS4JWa7SO0b8qLQMw02YoBAOwG3hB8S5NB
jdam/kRWvRjS8LMZDsVICPpOrwhQXkRlAQDFe4bzH3MY16IqrIq70QSCxqLJ
0Ao+NYb1whc/mXYOAA==
=AjeC
-----END PGP PRIVATE KEY BLOCK-----`,
        });
        const sourceKeyRef = await CryptoWorker.importPublicKey({ armoredKey: sourceKey.armor() });
        const targetKeyRef = await CryptoWorker.importPrivateKey({
            armoredKey: targetKey.armor(),
            passphrase: null,
        });

        await CryptoWorker.replaceUserIDs({ sourceKey: sourceKeyRef, targetKey: targetKeyRef });

        const exportedSourceKey = await openpgp_readKey({
            armoredKey: await CryptoWorker.exportPublicKey({ key: sourceKeyRef }),
        });
        const exportedTargetKey = await openpgp_readKey({
            armoredKey: await CryptoWorker.exportPublicKey({ key: targetKeyRef }),
        });
        // source key users should be unchanged
        expect(sourceKey.getUserIDs()).to.deep.equal(exportedSourceKey.getUserIDs());
        expect((await sourceKey.getPrimaryUser()).user.userID).to.deep.equal(
            (await exportedSourceKey.getPrimaryUser()).user.userID
        );
        // target key users should have changed
        expect(targetKey.getUserIDs()).to.not.deep.equal(exportedTargetKey.getUserIDs());
        expect(sourceKey.getUserIDs()).to.deep.equal(exportedTargetKey.getUserIDs());
        expect((await sourceKey.getPrimaryUser()).user.userID).to.deep.equal(
            (await exportedTargetKey.getPrimaryUser()).user.userID
        );
    });

    it('generateE2EEForwardingMaterial - the generated key is encrypted', async () => {
        const bobKey = await CryptoWorker.importPrivateKey({
            armoredKey: `-----BEGIN PGP PRIVATE KEY BLOCK-----

xVgEYkMx+RYJKwYBBAHaRw8BAQdA2wiwC/FbumCQYlJAEHeRCm2GZD0S1aPt
BG6ZcpuehWUAAQDpWPNfvUtTnn6AiJ/xEQ09so7ZWF+2GHlaOglSQUADwQ5J
zQ88Y0B3b3JrZXIudGVzdD7CiQQQFgoAGgUCYkMx+QQLCQcIAxUICgQWAAIB
AhsDAh4BACEJECO0b8qLQMw0FiEEYiHKmAo/cFLglZrtI7RvyotAzDRu6QEA
mbhLi00tsTr7hmJxIPw4JLHGw8UVvztUfeyFE6ZqAIsBAJtF8P9pcZxHKb58
nNamH0U5+cC+9hN9uw2pn51NIY8KzQ88YkB3b3JrZXIudGVzdD7CiQQQFgoA
GgUCYkMx+QQLCQcIAxUICgQWAAIBAhsDAh4BACEJECO0b8qLQMw0FiEEYiHK
mAo/cFLglZrtI7RvyotAzDSSNwD+JDTJNbf8/0u9QUS3liusBKk5qKUPXG+j
ezH+Sgw1wagA/36wOxNMHxVUJXBjYiOIrZjcUKwXPR2pjke6zgntRuQOx10E
YkMx+RIKKwYBBAGXVQEFAQEHQJDjVd81zZuOdxAkjMe6Y+8Bj8gF9PKBkMJ+
I8Yc2OQKAwEIBwAA/2Ikos/IDw3uCSa6DGRoMDzQzZSwyzIO0XhoP9cgKSb4
Dw/CeAQYFggACQUCYkMx+QIbDAAhCRAjtG/Ki0DMNBYhBGIhypgKP3BS4JWa
7SO0b8qLQMw02YoBAOwG3hB8S5NBjdam/kRWvRjS8LMZDsVICPpOrwhQXkRl
AQDFe4bzH3MY16IqrIq70QSCxqLJ0Ao+NYb1whc/mXYOAA==
=p5Q+
-----END PGP PRIVATE KEY BLOCK-----`,
            passphrase: null,
        });

        const { proxyParameter, forwardeeKey } = await CryptoWorker.generateE2EEForwardingMaterial({
            forwarderKey: bobKey,
            userIDsForForwardeeKey: { email: 'bob@test.com', comment: 'Forwarding from Bob' },
            passphrase: 'passphrase',
        });
        expect(proxyParameter).to.have.length(32);
        const charlieKey = await CryptoWorker.importPrivateKey({
            armoredKey: forwardeeKey,
            passphrase: 'passphrase',
        });
        expect(charlieKey.equals(bobKey)).to.be.false; // sanity check
    });

    describe('Key management API', () => {
        it('can export a generated key', async () => {
            const privateKeyRef = await CryptoWorker.generateKey({
                userIDs: { name: 'name', email: 'email@test.com' },
            });

            const passphrase = 'passphrase';
            const armoredKey = await CryptoWorker.exportPrivateKey({ privateKey: privateKeyRef, passphrase });
            const binaryKey = await CryptoWorker.exportPrivateKey({
                privateKey: privateKeyRef,
                passphrase,
                format: 'binary',
            });

            const decryptedKeyFromArmored = await openpgp_decryptKey({
                privateKey: await openpgp_readPrivateKey({ armoredKey }),
                passphrase,
            });
            expect(decryptedKeyFromArmored.isDecrypted()).to.be.true;
            // @ts-ignore missing `s2k` field definition
            expect(decryptedKeyFromArmored.keyPacket.s2k.c).to.equal(96); // setting should be lowered since passphrases are already salted

            const decryptedKeyFromBinary = await openpgp_decryptKey({
                privateKey: await openpgp_readPrivateKey({ binaryKey }),
                passphrase,
            });
            expect(decryptedKeyFromBinary.isDecrypted()).to.be.true;
        });

        it('can export an imported key', async () => {
            const passphrase = 'passphrase';
            const { privateKey: keyToImport } = await generateKey({
                userIDs: { name: 'name', email: 'email@test.com' },
                format: 'object',
                passphrase,
            });

            const importedKeyRef = await CryptoWorker.importPrivateKey({ armoredKey: keyToImport.armor(), passphrase });
            expect(importedKeyRef.getCreationTime()).to.deep.equal(keyToImport.getCreationTime());
            expect(importedKeyRef.subkeys.map((subkey) => subkey.getAlgorithmInfo())).to.deep.equal(
                keyToImport.subkeys.map((subkey) => subkey.getAlgorithmInfo())
            );
            expect(importedKeyRef.getUserIDs()).to.deep.equal(['name <email@test.com>']);
            const armoredPublicKey = await CryptoWorker.exportPublicKey({ key: importedKeyRef });
            const exportedPublicKey = await openpgp_readKey({ armoredKey: armoredPublicKey });
            expect(exportedPublicKey.isPrivate()).to.be.false;
            expect(exportedPublicKey.getKeyID().toHex()).equals(importedKeyRef.getKeyID());
            expect(exportedPublicKey.getKeyID().equals(keyToImport.getKeyID()));

            const exportPassphrase = 'another passphrase';
            const armoredPrivateKey = await CryptoWorker.exportPrivateKey({
                privateKey: importedKeyRef,
                passphrase: exportPassphrase,
            });
            const exportedPrivateKey = await openpgp_readPrivateKey({ armoredKey: armoredPrivateKey });
            expect(exportedPrivateKey.getKeyID().equals(keyToImport.getKeyID()));
            // make sure the exported key is encrypted with the new passphrase
            const decryptedExportedKey = await openpgp_decryptKey({
                privateKey: exportedPrivateKey,
                passphrase: exportPassphrase,
            });
            expect(decryptedExportedKey.isDecrypted()).to.be.true;
        });

        it('exports an unencrypted key only when given a null passphrase', async () => {
            const keyReference = await CryptoWorker.generateKey({ userIDs: { name: 'name', email: 'email@test.com' } });

            // empty passphrase not allowed
            await expect(
                CryptoWorker.exportPrivateKey({ privateKey: keyReference, passphrase: '' })
            ).to.be.rejectedWith(/passphrase is required for key encryption/);
            const armoredEncryptedKey = await CryptoWorker.exportPrivateKey({
                privateKey: keyReference,
                passphrase: 'passphrase',
            });
            const encryptedKey = await openpgp_readPrivateKey({ armoredKey: armoredEncryptedKey });
            expect(encryptedKey.isDecrypted()).to.be.false;
            const armoredUnencryptedKey = await CryptoWorker.exportPrivateKey({
                privateKey: keyReference,
                passphrase: null,
            });
            const unencryptedKey = await openpgp_readPrivateKey({ armoredKey: armoredUnencryptedKey });
            expect(unencryptedKey.isDecrypted()).to.be.true;
        });

        it('cannot import or export a public key as a private key', async () => {
            const passphrase = 'passphrase';
            const { publicKey: publicKeyToImport } = await generateKey({
                userIDs: { name: 'name', email: 'email@test.com' },
                format: 'object',
                passphrase,
            });

            // this give no typescript error since serialised keys are indistinguishable for TS
            await expect(
                CryptoWorker.importPrivateKey({ armoredKey: publicKeyToImport.armor(), passphrase })
            ).to.be.rejectedWith(/not of type private key/);
            const importedKeyRef = await CryptoWorker.importPublicKey({ armoredKey: publicKeyToImport.armor() });
            expect(importedKeyRef.isPrivate()).to.be.false;
            expect(importedKeyRef.getCreationTime()).to.deep.equal(publicKeyToImport.getCreationTime());
            // @ts-expect-error for non-private key reference
            await expect(CryptoWorker.exportPrivateKey({ privateKey: importedKeyRef })).to.be.rejectedWith(
                /Private key expected/
            );
            const armoredPublicKey = await CryptoWorker.exportPublicKey({ key: importedKeyRef });
            const exportedPublicKey = await openpgp_readKey({ armoredKey: armoredPublicKey });
            expect(exportedPublicKey.isPrivate()).to.be.false;
            expect(exportedPublicKey.getKeyID().equals(publicKeyToImport.getKeyID()));
        });

        it('rejects importing a private key encrypted using argon2', async () => {
            const passphrase = 'passphrase';
            const argon2Key = `-----BEGIN PGP PRIVATE KEY BLOCK-----

xY8EZBsDeBYJKwYBBAHaRw8BAQdA+q1zyp3azB9V6zZSf+GejE5fiY4TUXKB
3ZhHyIfGRpj+CQSSisPQuR0D6KLh+VMUC3ajAwQQJiOXsJlZd5bzJyAckMnm
EcP1IJ9cbqfUiVVyftKU5XaSs75Z4VEUMg0lkufCqvhEXq6qX+K+uENG6IIc
t9ziGOMPCIEQgM0YbmFtZSA8ZW1haWxAYXJnb24yLnRlc3Q+wowEEBYKAD4F
gmQbA3gECwkHCAmQqdOOOdbaF0kDFQgKBBYAAgECGQECmwMCHgEWIQTJB5NG
/MI1Uadr6pWp04451toXSQAAzp0BALdGS+QDK75+4nVmsfbO49XlGm8BTcoj
ul76mQ0eBXwvAPwIVBkUpVZ4mZQdigm4pUubIsw745TjlvrWQCEYFElNCceU
BGQbA3gSCisGAQQBl1UBBQEBB0Dc0WBjkzK/rnUPIJuFpXLfV6Tn9D3L8tHc
nwx9SURjLQMBCAf+CQRMjXT++0oAAQI7CEdQ18zOAwQQWxKyMceDiPXcySM6
TR6BoEVjr5mAoy2t4cEw1WqT/mhvwx0UET7q0bJJyOpAxwTPWSSotbEoYbzT
kB98NBNP3D+QNiNCtsJ4BBgWCAAqBYJkGwN4CZCp04451toXSQKbDBYhBMkH
k0b8wjVRp2vqlanTjjnW2hdJAAAEcQD7B5iqgIxMvSaT5NWQJvydNABhm2rl
pD1DtUiJfTUyCKgA/jQvs7QVxXk4ixfK1f3EvD02I1whktPixZy1B0iGmrAG
=jg+l
-----END PGP PRIVATE KEY BLOCK-----`;
            await expect(CryptoWorker.importPrivateKey({ armoredKey: argon2Key, passphrase })).to.be.rejectedWith(
                /Keys encrypted using Argon2 are not supported yet/
            );
        });

        it('allows importing a private key as long as it can be decrypted', async () => {
            const passphrase = 'passphrase';
            const { privateKey } = await generateKey({
                userIDs: { name: 'name', email: 'email@test.com' },
                passphrase,
                format: 'object',
            });

            const importedKeyRef = await CryptoWorker.importPrivateKey({ armoredKey: privateKey.armor(), passphrase });
            expect(importedKeyRef.isPrivate()).to.be.true;

            await expect(
                CryptoWorker.importPrivateKey({ armoredKey: privateKey.armor(), passphrase: 'wrong passphrase' })
            ).to.be.rejectedWith(/Error decrypting private key: Incorrect key passphrase/);
        });

        it('allows importing a decrypted key only when given a null passphrase', async () => {
            const decryptedArmoredKey = `-----BEGIN PGP PRIVATE KEY BLOCK-----

xVgEYgQEWRYJKwYBBAHaRw8BAQdAhR6qir63dgL1bSt19bLFQfCIhvYnrk6f
OmvFwcYNf4wAAQCV4uj6Pg+08r+ztuloyzTDAV7eC/jenjm7AdYikQ0MZxFC
zQDCjAQQFgoAHQUCYgQEWQQLCQcIAxUICgQWAAIBAhkBAhsDAh4BACEJENDb
nirC49EHFiEEDgVXCWrFg3oEwWgN0NueKsLj0QdayAD+O1Qq4UrAn1Tz67d7
O3uWdpRWmbgfUr7XygeyWr57crYA/0/37SvtPoI6MHyrVYijXspJlVo0ZABb
dueO4TQCpPkAx10EYgQEWRIKKwYBBAGXVQEFAQEHQCVlPjHtTH0KaiZmgAeQ
f1tglgIeoZuT1fYWQMR5s0QkAwEIBwAA/1T9jghk9P2FAzix+Fst0go8OQ6l
clnLKMx9jFlqLmqAD57CeAQYFggACQUCYgQEWQIbDAAhCRDQ254qwuPRBxYh
BA4FVwlqxYN6BMFoDdDbnirC49EHobgA/R/1yGmo8/xrdipXIWTbL38sApGf
XU0oD7GPQhGsaxZjAQCmjVBDdt+CgmU9NFYwtTIWNHxxJtyf7TX7DY9RH1t2
DQ==
=2Lb6
-----END PGP PRIVATE KEY BLOCK-----`;
            const importedKeyRef = await CryptoWorker.importPrivateKey({
                armoredKey: decryptedArmoredKey,
                passphrase: null,
            });
            expect(importedKeyRef.isPrivate()).to.be.true;

            await expect(
                CryptoWorker.importPrivateKey({ armoredKey: decryptedArmoredKey, passphrase: 'passphrase' })
            ).to.be.rejectedWith(/Key packet is already decrypted/);
        });

        it('reformatted key has a separate key reference', async () => {
            const passphrase = 'passphrase';
            const originalKeyRef = await CryptoWorker.importPrivateKey({
                armoredKey: `-----BEGIN PGP PRIVATE KEY BLOCK-----

xYYEYjh/NRYJKwYBBAHaRw8BAQdAAJW2i9biFMIXiH15J6vGU1GCAqcp5utw
C+y+CeZ+h4L+CQMI/K3Ebi8BpsUAzexw43SwgpD0mDGd/d4ORX77AiUoq/rp
DKjS+0lpIszAa6SVWcA6xQZsz1ztdNBktEg4t/gybivH88kGTIprO/HWetM+
j80RPHRlc3RAd29ya2VyLmNvbT7CjAQQFgoAHQUCYjh/NQQLCQcIAxUICgQW
AAIBAhkBAhsDAh4BACEJEFx55sPEaXlKFiEE+PdMNIqw4jCyqqnuXHnmw8Rp
eUoC8QD+NdQzOAWdIJEp1eMeEa3xx9rkCpD2TXUeV7goHtixyQIBANcgmRTg
gN0O2hdiL9kjN4MPhbkz3dNTpkiO/K6O8UIDx4sEYjh/NRIKKwYBBAGXVQEF
AQEHQF3XUaFXbb6O9Qcas72x5nhNupZ3iIrIx8wKeUdgdkBNAwEIB/4JAwjK
CPlfkyHxBABYJC70HwO36TjRBxROY480CvL40r1bJ3NSLlV4aIZXLP2723PH
tsnD3fhK5ZbGqC7FCmmDKEh1ibl3Lw6rEoE0Z6Fq72x6wngEGBYIAAkFAmI4
fzUCGwwAIQkQXHnmw8RpeUoWIQT490w0irDiMLKqqe5ceebDxGl5Sl9wAQC+
9Jb0r5pG7sMbNclmp3s1OIfWG9tJ9RoXSHU/bCFHlgEA/ggjJKzRuja0MWZ6
8IDTErKCgaYSPES5+mwT27LYvw0=
=D7EW
-----END PGP PRIVATE KEY BLOCK-----`,
                passphrase,
            });

            const reformattedKeyRef = await CryptoWorker.reformatKey({
                privateKey: originalKeyRef,
                userIDs: { email: 'reformatted@worker.com' },
            });
            expect(reformattedKeyRef.getUserIDs()).to.have.length(1);
            expect(reformattedKeyRef.getUserIDs().includes('<reformatted@worker.com>'));
            expect(originalKeyRef.getUserIDs()).to.have.length(1);
            expect(originalKeyRef.getUserIDs()).includes('<test@worker.com>');

            await CryptoWorker.clearKey({ key: originalKeyRef }); // this clears the private params as well

            const armoredKey = await CryptoWorker.exportPrivateKey({ privateKey: reformattedKeyRef, passphrase });
            const decryptedKeyFromArmored = await openpgp_decryptKey({
                privateKey: await openpgp_readPrivateKey({ armoredKey }),
                passphrase,
            });
            expect(decryptedKeyFromArmored.isDecrypted()).to.be.true;
        });

        it('isWeak() - it correctly marks a weak key', async () => {
            const weakKeyReference = await CryptoWorker.importPublicKey({ armoredKey: rsa512BitsKey });
            expect(weakKeyReference.isWeak()).to.be.true;

            const keyReference = await CryptoWorker.importPublicKey({ armoredKey: ecc25519Key });
            expect(keyReference.isWeak()).to.be.false;
        });

        it('equals - returns true for equal public keys', async () => {
            const userIDs = { name: 'name', email: 'email@test.com' };
            const { privateKey, publicKey } = await generateKey({ userIDs, format: 'object' });

            const privateKeyRef = await CryptoWorker.importPrivateKey({
                armoredKey: privateKey.armor(),
                passphrase: null,
            });
            const publicKeyRef = await CryptoWorker.importPublicKey({ armoredKey: publicKey.armor() });
            expect(privateKeyRef.equals(publicKeyRef)).to.be.true;

            // change expiration time
            const { privateKey: armoredReformattedKey } = await reformatKey({
                privateKey,
                userIDs,
                keyExpirationTime: 3600,
            });
            const reformattedKeyRef = await CryptoWorker.importPrivateKey({
                armoredKey: armoredReformattedKey,
                passphrase: null,
            });
            expect(privateKeyRef.equals(reformattedKeyRef)).to.be.false;
        });

        it('equals - can ignore third-party certifications', async () => {
            const publicKey = await openpgp_readKey({ armoredKey: keyWithThirdPartyCertifications });
            expect(publicKey.users[0].otherCertifications).to.have.length(1);
            publicKey.users[0].otherCertifications = [];
            const publicKeyRef = await CryptoWorker.importPublicKey({
                armoredKey: publicKey.armor(),
            });

            const certifiedPublicKeyRef = await CryptoWorker.importPublicKey({
                armoredKey: keyWithThirdPartyCertifications,
            });

            expect(certifiedPublicKeyRef.equals(publicKeyRef)).to.be.false;
            expect(certifiedPublicKeyRef.equals(publicKeyRef, true)).to.be.true;
        });

        it('clearKey - cannot reference a cleared key', async () => {
            const privateKeyRef = await CryptoWorker.generateKey({
                userIDs: { name: 'name', email: 'email@test.com' },
            });
            // confirm key is in the store
            expect(await CryptoWorker.exportPublicKey({ key: privateKeyRef })).length.above(0);
            await CryptoWorker.clearKey({ key: privateKeyRef });

            await expect(CryptoWorker.exportPublicKey({ key: privateKeyRef })).to.be.rejectedWith(/Key not found/);
        });

        it('clearKeyStore - cannot reference any key after clearing the store', async () => {
            const privateKeyRef1 = await CryptoWorker.generateKey({
                userIDs: { name: 'name', email: 'email@test.com' },
            });
            const privateKeyRef2 = await CryptoWorker.generateKey({
                userIDs: { name: 'name', email: 'email@test.com' },
            });
            // (lazily) confirm that keys are in the store
            expect(await CryptoWorker.exportPublicKey({ key: privateKeyRef1 })).length.above(0);
            expect(await CryptoWorker.exportPublicKey({ key: privateKeyRef2 })).length.above(0);
            await CryptoWorker.clearKeyStore();

            await expect(CryptoWorker.exportPublicKey({ key: privateKeyRef1 })).to.be.rejectedWith(/Key not found/);
            await expect(CryptoWorker.exportPublicKey({ key: privateKeyRef2 })).to.be.rejectedWith(/Key not found/);
        });
    });
});
