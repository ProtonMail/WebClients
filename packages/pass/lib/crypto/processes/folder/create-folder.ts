import type { FolderCreateInputDto, FolderKey, VaultShareKey } from '../../../../types';
import { ContentFormatVersion, PassEncryptionTag } from '../../../../types';
import { encryptData, generateKey, importSymmetricKey } from '../../utils/crypto-helpers';
import { PassCryptoFolderError } from '../../utils/errors';

type CreateFolderParams = {
    content: Uint8Array<ArrayBuffer>;
    parentKey: VaultShareKey | FolderKey;
};

export const createFolder = async ({ content, parentKey }: CreateFolderParams): Promise<FolderCreateInputDto> => {
    if (content.length === 0) {
        throw new PassCryptoFolderError('Folder content cannot be empty');
    }

    const folderKeyRaw = generateKey();
    const folderKey = await importSymmetricKey(folderKeyRaw);

    // Encrypt folder content (name...) with the folder key
    const encryptedContent = await encryptData(folderKey, content, PassEncryptionTag.FolderContent);
    // Encrypt the folder key with the parent folder key or vault key if root folder
    const encryptedFolderKey = await encryptData(parentKey.key, folderKeyRaw, PassEncryptionTag.FolderKey);

    return {
        Content: encryptedContent.toBase64(),
        ContentFormatVersion: ContentFormatVersion.Folder,
        FolderKey: encryptedFolderKey.toBase64(),
        KeyRotation: parentKey.rotation,
    };
};
