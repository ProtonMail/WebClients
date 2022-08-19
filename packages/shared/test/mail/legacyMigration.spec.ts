import { CryptoProxy } from '@proton/crypto';
import { Api } from '@proton/shared/lib/interfaces';
import { migrateSingle } from '@proton/shared/lib/mail/legacyMessagesMigration/helpers';

import { testMessageContentLegacy, testMessageEncryptedLegacy, testPrivateKeyLegacy } from './legacyMigration.data';

describe('legacy message migration helpers', () => {
    it('should re-encrypt a legacy message', async () => {
        const messageID = 'testID';
        const decryptionKey = await CryptoProxy.importPrivateKey({
            armoredKey: testPrivateKeyLegacy,
            passphrase: '123',
        });
        const primaryKey = await CryptoProxy.generateKey({ userIDs: { email: 'test@test.it' } });

        let wasMigrated = false;
        let validReEncryption = false;
        let wasMarkedBroken = false;
        const mockApi = async ({ url, data }: { url: string; data: any }) => {
            if (url.endsWith(`messages/${messageID}`)) {
                const Message = {
                    Body: testMessageEncryptedLegacy,
                    Time: 1420070400000,
                    ID: messageID,
                    AddressID: 'keyID',
                };

                return { Message };
            }

            if (url.endsWith(`messages/${messageID}/body`)) {
                wasMigrated = true;

                const { Body: reEncryptedBody } = data;
                // we should be able to decrypt the migrated message
                const { data: decryptedData, signatures } = await CryptoProxy.decryptMessage({
                    armoredMessage: reEncryptedBody,
                    decryptionKeys: primaryKey,
                });

                validReEncryption = decryptedData === testMessageContentLegacy && !signatures.length;
            }

            if (url.endsWith(`messages/${messageID}/mark/broken`)) {
                wasMarkedBroken = true;
            }
        };

        await migrateSingle({
            id: messageID,
            statusMap: {},
            api: mockApi as Api,
            getAddressKeys: async () => [
                {
                    ID: 'keyID',
                    privateKey: decryptionKey,
                    publicKey: primaryKey,
                },
            ],
        });

        expect(wasMigrated).toBe(true);
        expect(validReEncryption).toBe(true);
        expect(wasMarkedBroken).toBe(false);
    });

    it('should mark an undecryptable message as broken', async () => {
        const messageID = 'testID';
        const decryptionKey = await CryptoProxy.importPrivateKey({
            armoredKey: testPrivateKeyLegacy,
            passphrase: '123',
        });

        let wasMigrated = false;
        let wasMarkedBroken = false;
        const mockApi = async ({ url }: { url: string; data: any }) => {
            if (url.endsWith(`messages/${messageID}`)) {
                const Message = {
                    Body: '---BEGIN INVALID MESSAGE---',
                    Time: 1420070400000,
                    ID: messageID,
                    AddressID: 'keyID',
                };

                return { Message };
            }

            if (url.endsWith(`messages/${messageID}/body`)) {
                wasMigrated = true;
            }

            if (url.endsWith(`messages/${messageID}/mark/broken`)) {
                wasMarkedBroken = true;
            }
        };

        await migrateSingle({
            id: messageID,
            statusMap: {},
            api: mockApi as Api,
            getAddressKeys: async () => [
                {
                    ID: 'keyID',
                    privateKey: decryptionKey,
                    publicKey: decryptionKey,
                },
            ],
        });

        expect(wasMigrated).toBe(false);
        expect(wasMarkedBroken).toBe(true);
    });
});
