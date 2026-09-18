import type { FolderKey, VaultShareKey } from '../../../../types';
import { ContentFormatVersion } from '../../../../types';
import { generateKey, importSymmetricKey } from '../../utils/crypto-helpers';
import { TEST_USER_KEY_ID, randomContents } from '../../utils/testing';
import { createFolder } from './create-folder';
import { type OpenFolderParams, openFolder } from './open-folder';

describe('openFolder crypto process', () => {
    const key = generateKey();
    const content = randomContents();

    test('should decrypt folder encrypted with vault key', async () => {
        const vaultKey: VaultShareKey = {
            key: await importSymmetricKey(key),
            raw: key,
            rotation: 1,
            userKeyId: TEST_USER_KEY_ID,
        };

        const createFolderRequest = await createFolder({ content, parentKey: vaultKey });

        const encryptedFolder: OpenFolderParams = {
            encryptedFolder: {
                VaultID: 'vault-123',
                FolderID: 'folder-123',
                Content: createFolderRequest.Content,
                ContentFormatVersion: createFolderRequest.ContentFormatVersion,
                FolderKey: createFolderRequest.FolderKey,
                KeyRotation: createFolderRequest.KeyRotation,
            },
            parentKey: vaultKey,
        };

        const result = await openFolder(encryptedFolder);

        expect(result.content).toStrictEqual(content);
        expect(result.contentFormatVersion).toEqual(createFolderRequest.ContentFormatVersion);
        expect(result.folderKey.rotation).toEqual(createFolderRequest.KeyRotation);
        expect(result.folderKey.parentFolderId).toBeNull();
        expect(result.folderKey.raw).toBeInstanceOf(Uint8Array);
        expect(result.folderKey.key).toBeDefined();
    });

    test('should decrypt folder encrypted with parent folder key', async () => {
        const parentFolderKey: FolderKey = {
            key: await importSymmetricKey(key),
            raw: key,
            rotation: 1,
            parentFolderId: 'parent-folder-123',
        };

        const createFolderRequest = await createFolder({ content, parentKey: parentFolderKey });

        const encryptedFolder: OpenFolderParams = {
            encryptedFolder: {
                VaultID: 'vault-123',
                FolderID: 'folder-123',
                ParentFolderID: 'parent-folder-123',
                Content: createFolderRequest.Content,
                ContentFormatVersion: createFolderRequest.ContentFormatVersion,
                FolderKey: createFolderRequest.FolderKey,
                KeyRotation: createFolderRequest.KeyRotation,
            },
            parentKey: parentFolderKey,
        };

        const result = await openFolder(encryptedFolder);

        expect(result.content).toStrictEqual(content);
        expect(result.contentFormatVersion).toEqual(ContentFormatVersion.Folder);
        expect(result.folderKey.rotation).toEqual(createFolderRequest.KeyRotation);
        expect(result.folderKey.parentFolderId).toEqual('parent-folder-123');
        expect(result.folderKey.raw).toBeInstanceOf(Uint8Array);
        expect(result.folderKey.key).toBeDefined();
    });

    test('should decrypt nested folder', async () => {
        const vaultKey: VaultShareKey = {
            key: await importSymmetricKey(key),
            raw: key,
            rotation: 1,
            userKeyId: TEST_USER_KEY_ID,
        };

        // Create first level folder with vault key
        const newRootFolder = await createFolder({ content, parentKey: vaultKey });
        const encryptedRootFolder: OpenFolderParams = {
            encryptedFolder: {
                VaultID: 'vault-123',
                FolderID: 'root-folder',
                Content: newRootFolder.Content,
                ContentFormatVersion: newRootFolder.ContentFormatVersion,
                FolderKey: newRootFolder.FolderKey,
                KeyRotation: newRootFolder.KeyRotation,
            },
            parentKey: vaultKey,
        };

        const rootFolder = await openFolder(encryptedRootFolder);

        const rootFolderKey: FolderKey = {
            ...rootFolder.folderKey,
            parentFolderId: 'root-folder',
        };

        // Create second level folder with first level folder key
        const newSubFolder = await createFolder({ content, parentKey: rootFolderKey });
        const encryptedSubFolder: OpenFolderParams = {
            encryptedFolder: {
                VaultID: 'vault-123',
                FolderID: 'sub-folder',
                ParentFolderID: 'root-folder',
                Content: newSubFolder.Content,
                ContentFormatVersion: newSubFolder.ContentFormatVersion,
                FolderKey: newSubFolder.FolderKey,
                KeyRotation: newSubFolder.KeyRotation,
            },
            parentKey: rootFolderKey,
        };

        const subFolder = await openFolder(encryptedSubFolder);

        expect(subFolder.content).toStrictEqual(content);
        expect(subFolder.contentFormatVersion).toEqual(ContentFormatVersion.Folder);
        expect(subFolder.folderKey.parentFolderId).toEqual('root-folder');
    });

    test('should throw error when decrypting with incorrect key', async () => {
        const vaultKey: VaultShareKey = {
            key: await importSymmetricKey(key),
            raw: key,
            rotation: 1,
            userKeyId: TEST_USER_KEY_ID,
        };

        const createFolderRequest = await createFolder({ content, parentKey: vaultKey });

        const wrongKey = generateKey();
        const wrongVaultKey: VaultShareKey = {
            key: await importSymmetricKey(wrongKey),
            raw: wrongKey,
            rotation: 1,
            userKeyId: TEST_USER_KEY_ID,
        };

        const encryptedFolder: OpenFolderParams = {
            encryptedFolder: {
                VaultID: 'vault-123',
                FolderID: 'folder-123',
                Content: createFolderRequest.Content,
                ContentFormatVersion: createFolderRequest.ContentFormatVersion,
                FolderKey: createFolderRequest.FolderKey,
                KeyRotation: createFolderRequest.KeyRotation,
            },
            parentKey: wrongVaultKey,
        };

        await expect(openFolder(encryptedFolder)).rejects.toThrow();
    });
});
