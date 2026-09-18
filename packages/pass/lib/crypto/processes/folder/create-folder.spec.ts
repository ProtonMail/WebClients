import type { FolderKey, VaultShareKey } from '../../../../types';
import { ContentFormatVersion, PassEncryptionTag } from '../../../../types';
import { decryptData, generateKey, importSymmetricKey } from '../../utils/crypto-helpers';
import { TEST_USER_KEY_ID, randomContents } from '../../utils/testing';
import { createFolder } from './create-folder';

describe('createFolder crypto process', () => {
    const key = generateKey();
    const content = randomContents();

    test('should encrypt folder content with folder key and encrypt folder key with vault key', async () => {
        const vaultKey: VaultShareKey = {
            raw: key,
            key: await importSymmetricKey(key),
            rotation: 3,
            userKeyId: TEST_USER_KEY_ID,
        };

        const folder = await createFolder({ content, parentKey: vaultKey });

        const decryptedFolderKeyRaw = await decryptData(
            vaultKey.key,
            Uint8Array.fromBase64(folder.FolderKey),
            PassEncryptionTag.FolderKey
        );

        const folderKey = await importSymmetricKey(decryptedFolderKeyRaw);

        const decryptedContent = await decryptData(
            folderKey,
            Uint8Array.fromBase64(folder.Content),
            PassEncryptionTag.FolderContent
        );

        expect(folder.ContentFormatVersion).toEqual(ContentFormatVersion.Folder);
        expect(folder.KeyRotation).toEqual(vaultKey.rotation);
        expect(decryptedContent).toStrictEqual(content);
    });

    test('should encrypt folder content with folder key and encrypt folder key with parent folder key', async () => {
        const parentFolderKey: FolderKey = {
            raw: key,
            key: await importSymmetricKey(key),
            rotation: 2,
            parentFolderId: '123',
        };

        const folder = await createFolder({ content, parentKey: parentFolderKey });

        const decryptedFolderKeyRaw = await decryptData(
            parentFolderKey.key,
            Uint8Array.fromBase64(folder.FolderKey),
            PassEncryptionTag.FolderKey
        );

        const folderKey = await importSymmetricKey(decryptedFolderKeyRaw);

        const decryptedContent = await decryptData(
            folderKey,
            Uint8Array.fromBase64(folder.Content),
            PassEncryptionTag.FolderContent
        );

        expect(folder.ContentFormatVersion).toEqual(ContentFormatVersion.Folder);
        expect(folder.KeyRotation).toEqual(parentFolderKey.rotation);
        expect(decryptedContent).toStrictEqual(content);
    });

    test('should use correct encryption tags', async () => {
        const vaultKey: VaultShareKey = {
            raw: key,
            key: await importSymmetricKey(key),
            rotation: 1,
            userKeyId: TEST_USER_KEY_ID,
        };

        const folder = await createFolder({ content, parentKey: vaultKey });

        await expect(
            decryptData(vaultKey.key, Uint8Array.fromBase64(folder.FolderKey), PassEncryptionTag.ItemKey)
        ).rejects.toThrow();

        const decryptedFolderKeyRaw = await decryptData(
            vaultKey.key,
            Uint8Array.fromBase64(folder.FolderKey),
            PassEncryptionTag.FolderKey
        );

        const folderKey = await importSymmetricKey(decryptedFolderKeyRaw);

        await expect(
            decryptData(folderKey, Uint8Array.fromBase64(folder.Content), PassEncryptionTag.ItemContent)
        ).rejects.toThrow();
    });

    test('should generate unique folder keys for each invocation', async () => {
        const vaultKey: VaultShareKey = {
            raw: key,
            key: await importSymmetricKey(key),
            rotation: 1,
            userKeyId: TEST_USER_KEY_ID,
        };

        const folder1 = await createFolder({ content, parentKey: vaultKey });
        const folder2 = await createFolder({ content, parentKey: vaultKey });

        expect(folder1.FolderKey).not.toEqual(folder2.FolderKey);
        expect(folder1.Content).not.toEqual(folder2.Content);
    });
});
