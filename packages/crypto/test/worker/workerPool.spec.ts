import { use as chaiUse, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { generateKey } from 'pmcrypto';
import {
    decryptKey as openpgp_decryptKey,
    readKey as openpgp_readKey,
    readPrivateKey as openpgp_readPrivateKey,
} from 'pmcrypto/lib/openpgp';

import { VERIFICATION_STATUS } from '../../lib';
import { arrayToHexString } from '../../lib/utils';
import { CryptoWorkerPool } from '../../lib/worker/workerPool';

chaiUse(chaiAsPromised);

describe('Worker Pool', () => {
    const poolSize = 2;
    beforeAll(async () => {
        await CryptoWorkerPool.init({ poolSize });
    });

    afterEach(async () => {
        await CryptoWorkerPool.clearKeyStore();
    });

    afterAll(async () => {
        await CryptoWorkerPool.destroy();
    });

    it('should encrypt/sign and decrypt/verify text and binary data', async () => {
        const aliceKeyRef = await CryptoWorkerPool.generateKey({
            userIDs: { name: 'alice', email: 'alice@test.com' },
        });
        const bobKeyRef = await CryptoWorkerPool.generateKey({ userIDs: { name: 'bob', email: 'bob@test.com' } });

        const { message: encryptedArmoredMessage } = await CryptoWorkerPool.encryptMessage({
            textData: 'hello world',
            encryptionKeys: bobKeyRef,
            signingKeys: aliceKeyRef,
        });

        const textDecryptionResult = await CryptoWorkerPool.decryptMessage({
            armoredMessage: encryptedArmoredMessage,
            decryptionKeys: bobKeyRef,
            verificationKeys: aliceKeyRef,
        });
        expect(textDecryptionResult.data).to.equal('hello world');
        expect(textDecryptionResult.signatures).to.have.length(1);
        expect(textDecryptionResult.verificationErrors).to.not.exist;
        expect(textDecryptionResult.verificationStatus).to.equal(VERIFICATION_STATUS.SIGNED_AND_VALID);

        const { message: encryptedBinaryMessage } = await CryptoWorkerPool.encryptMessage({
            binaryData: new Uint8Array([1, 2, 3]),
            encryptionKeys: bobKeyRef,
            signingKeys: aliceKeyRef,
            format: 'binary',
        });

        const binaryDecryptionResult = await CryptoWorkerPool.decryptMessage({
            binaryMessage: encryptedBinaryMessage,
            decryptionKeys: bobKeyRef,
            verificationKeys: aliceKeyRef,
            format: 'binary',
        });
        expect(binaryDecryptionResult.data).to.deep.equal(new Uint8Array([1, 2, 3]));
        expect(binaryDecryptionResult.signatures).to.have.length(1);
        expect(binaryDecryptionResult.verificationErrors).to.not.exist;
        expect(binaryDecryptionResult.verificationStatus).to.equal(VERIFICATION_STATUS.SIGNED_AND_VALID);
    });

    it('computeHashStream - the hash instance should not be disrupted with multiple workers', async () => {
        const data = new Uint8Array(100).fill(1);
        const dataStream = new ReadableStream<Uint8Array<ArrayBuffer>>({
            pull: (controller) => {
                for (let i = 0; i < 10; i++) {
                    controller.enqueue(data.subarray(i, i + 10));
                }
                controller.close();
            },
        });

        const testHashSHA1Streamed = await CryptoWorkerPool.computeHashStream({
            algorithm: 'unsafeSHA1',
            dataStream,
        }).then(arrayToHexString);

        const testHashSHA1 = await CryptoWorkerPool.computeHash({ algorithm: 'unsafeSHA1', data }).then(
            arrayToHexString
        );

        expect(testHashSHA1Streamed).to.equal(testHashSHA1);
    });

    it('replaceUserIDs - the target key should be updated in all workers', async () => {
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
        const sourceKeyRef = await CryptoWorkerPool.importPublicKey({ armoredKey: sourceKey.armor() });
        const targetKeyRef = await CryptoWorkerPool.importPrivateKey({
            armoredKey: targetKey.armor(),
            passphrase: null,
        });

        await CryptoWorkerPool.replaceUserIDs({ sourceKey: sourceKeyRef, targetKey: targetKeyRef });

        const exportedTargetKeys = await Promise.all(
            new Array(poolSize).fill(null).map(async () =>
                openpgp_readKey({
                    armoredKey: await CryptoWorkerPool.exportPublicKey({ key: targetKeyRef }),
                })
            )
        );
        exportedTargetKeys.forEach((exportedTargetKey) => {
            expect(sourceKey.getUserIDs()).to.deep.equal(exportedTargetKey.getUserIDs());
        });
    });

    it('cloneKeyAndChangeUserIDs - the target key should be updated in all workers', async () => {
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

        const sourceKeyRef = await CryptoWorkerPool.importPrivateKey({
            armoredKey: sourceKey.armor(),
            passphrase: null,
        });

        const updateKeyRef = await CryptoWorkerPool.cloneKeyAndChangeUserIDs({
            privateKey: sourceKeyRef,
            userIDs: { email: 'updated@worker.com' },
        });

        const exportedTargetKeys = await Promise.all(
            new Array(poolSize).fill(null).map(async () =>
                openpgp_readKey({
                    armoredKey: await CryptoWorkerPool.exportPublicKey({ key: updateKeyRef }),
                })
            )
        );
        exportedTargetKeys.forEach((exportedTargetKey) => {
            expect(exportedTargetKey.getUserIDs()).to.deep.equal(['<updated@worker.com>']);
        });
    });

    describe('Key management API', () => {
        it('can export a generated key', async () => {
            const privateKeyRef = await CryptoWorkerPool.generateKey({
                userIDs: { name: 'name', email: 'email@test.com' },
            });

            const passphrase = 'passphrase';
            const armoredKey = await CryptoWorkerPool.exportPrivateKey({ privateKey: privateKeyRef, passphrase });
            const binaryKey = await CryptoWorkerPool.exportPrivateKey({
                privateKey: privateKeyRef,
                passphrase,
                format: 'binary',
            });

            const decryptedKeyFromArmored = await openpgp_decryptKey({
                privateKey: await openpgp_readPrivateKey({ armoredKey }),
                passphrase,
            });
            expect(decryptedKeyFromArmored.isDecrypted()).to.be.true;

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

            const importedKeyRef = await CryptoWorkerPool.importPrivateKey({
                armoredKey: keyToImport.armor(),
                passphrase,
            });
            expect(importedKeyRef.getCreationTime()).to.deep.equal(keyToImport.getCreationTime());
            expect(importedKeyRef.subkeys.map((subkey) => subkey.getAlgorithmInfo())).to.deep.equal(
                keyToImport.subkeys.map((subkey) => subkey.getAlgorithmInfo())
            );
            expect(importedKeyRef.getUserIDs()).to.deep.equal(['name <email@test.com>']);
            const armoredPublicKey = await CryptoWorkerPool.exportPublicKey({ key: importedKeyRef });
            const exportedPublicKey = await openpgp_readKey({ armoredKey: armoredPublicKey });
            expect(exportedPublicKey.isPrivate()).to.be.false;
            expect(exportedPublicKey.getKeyID().toHex()).equals(importedKeyRef.getKeyID());
            expect(exportedPublicKey.getKeyID().equals(keyToImport.getKeyID()));

            const exportPassphrase = 'another passphrase';
            const armoredPrivateKey = await CryptoWorkerPool.exportPrivateKey({
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

        it('reformatted key has a separate key reference', async () => {
            const passphrase = 'passphrase';
            const originalKeyRef = await CryptoWorkerPool.importPrivateKey({
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

            const reformattedKeyRef = await CryptoWorkerPool.reformatKey({
                privateKey: originalKeyRef,
                userIDs: { email: 'reformatted@worker.com' },
            });
            expect(reformattedKeyRef.getUserIDs()).to.have.length(1);
            expect(reformattedKeyRef.getUserIDs().includes('<reformatted@worker.com>'));
            expect(originalKeyRef.getUserIDs()).to.have.length(1);
            expect(originalKeyRef.getUserIDs()).includes('<test@worker.com>');

            await CryptoWorkerPool.clearKey({ key: originalKeyRef }); // this clears the private params as well

            const armoredKey = await CryptoWorkerPool.exportPrivateKey({
                privateKey: reformattedKeyRef,
                passphrase,
            });
            const decryptedKeyFromArmored = await openpgp_decryptKey({
                privateKey: await openpgp_readPrivateKey({ armoredKey }),
                passphrase,
            });
            expect(decryptedKeyFromArmored.isDecrypted()).to.be.true;
        });

        it('clearKey - cannot reference a cleared key', async () => {
            const privateKeyRef = await CryptoWorkerPool.generateKey({
                userIDs: { name: 'name', email: 'email@test.com' },
            });
            // confirm key is in the store
            expect(await CryptoWorkerPool.exportPublicKey({ key: privateKeyRef })).length.above(0);
            await CryptoWorkerPool.clearKey({ key: privateKeyRef });

            await expect(CryptoWorkerPool.exportPublicKey({ key: privateKeyRef })).to.be.rejectedWith(
                /Key not found/
            );
        });

        it('clearKeyStore - cannot reference any key after clearing the store', async () => {
            const privateKeyRef1 = await CryptoWorkerPool.generateKey({
                userIDs: { name: 'name', email: 'email@test.com' },
            });
            const privateKeyRef2 = await CryptoWorkerPool.generateKey({
                userIDs: { name: 'name', email: 'email@test.com' },
            });
            // (lazily) confirm that keys are in the store
            expect(await CryptoWorkerPool.exportPublicKey({ key: privateKeyRef1 })).length.above(0);
            expect(await CryptoWorkerPool.exportPublicKey({ key: privateKeyRef2 })).length.above(0);
            await CryptoWorkerPool.clearKeyStore();

            await expect(CryptoWorkerPool.exportPublicKey({ key: privateKeyRef1 })).to.be.rejectedWith(
                /Key not found/
            );
            await expect(CryptoWorkerPool.exportPublicKey({ key: privateKeyRef2 })).to.be.rejectedWith(
                /Key not found/
            );
        });
    });
});