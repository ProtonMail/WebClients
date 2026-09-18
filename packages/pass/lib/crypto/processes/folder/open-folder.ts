import type { FolderKey, OpenedFolder, VaultShareKey } from '../../../../types';
import { PassEncryptionTag } from '../../../../types';
import type { FolderDataResponse } from '../../../../types/api';
import { decryptData, importSymmetricKey } from '../../utils/crypto-helpers';

export type OpenFolderParams = {
    encryptedFolder: FolderDataResponse;
    parentKey: VaultShareKey | FolderKey;
};

export const openFolder = async ({ encryptedFolder, parentKey }: OpenFolderParams): Promise<OpenedFolder> => {
    const folderKeyRaw = await decryptData(
        parentKey.key,
        Uint8Array.fromBase64(encryptedFolder.FolderKey),
        PassEncryptionTag.FolderKey
    );

    const folderKey = await importSymmetricKey(folderKeyRaw);

    const content = await decryptData(
        folderKey,
        Uint8Array.fromBase64(encryptedFolder.Content),
        PassEncryptionTag.FolderContent
    );

    return {
        content,
        contentFormatVersion: encryptedFolder.ContentFormatVersion,
        folderKey: {
            key: folderKey,
            raw: folderKeyRaw,
            parentFolderId: encryptedFolder.ParentFolderID ?? null,
            rotation: encryptedFolder.KeyRotation,
        },
    };
};
