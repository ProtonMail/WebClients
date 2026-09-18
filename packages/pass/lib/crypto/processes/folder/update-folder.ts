import type { FolderKey } from '../../../../types';
import { ContentFormatVersion, PassEncryptionTag } from '../../../../types';
import type { FolderUpdateContentInputDto } from '../../../../types/api';
import { encryptData } from '../../utils/crypto-helpers';
import { PassCryptoFolderError } from '../../utils/errors';

type UpdateFolderParams = {
    content: Uint8Array<ArrayBuffer>;
    folderKey: FolderKey;
};

export const updateFolder = async ({
    content,
    folderKey,
}: UpdateFolderParams): Promise<FolderUpdateContentInputDto> => {
    if (content.length === 0) {
        throw new PassCryptoFolderError('Folder content cannot be empty');
    }

    const encryptedContent = await encryptData(folderKey.key, content, PassEncryptionTag.FolderContent);

    return {
        Content: encryptedContent.toBase64(),
        ContentFormatVersion: ContentFormatVersion.Folder,
        KeyRotation: folderKey.rotation,
    };
};
