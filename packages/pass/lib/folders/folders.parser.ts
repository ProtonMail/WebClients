import type { FolderData, FolderDataResponse } from '../../types';
import { PassCrypto } from '../crypto';
import { decodeFolder } from './folder-proto.transformer';

export const parseFolderResponse = async (
    shareId: string,
    encryptedFolder: FolderDataResponse
): Promise<FolderData> => {
    const content = await PassCrypto.openFolder({ shareId, encryptedFolder });
    const folder = decodeFolder(content);

    return {
        folderId: encryptedFolder.FolderID,
        shareId,
        vaultId: encryptedFolder.VaultID,
        parentFolderId: encryptedFolder.ParentFolderID ?? null,
        name: folder.name,
        keyRotation: encryptedFolder.KeyRotation,
    };
};
