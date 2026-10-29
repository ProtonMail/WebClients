import type { FolderMoveInputDto } from '../../../../types/api/pass';
import type { FolderKey, VaultShareKey } from '../../../../types/crypto/pass-types';
import { PassEncryptionTag } from '../../../../types/crypto/pass-types';
import type { MaybeNull } from '../../../../types/utils';
import { encryptData } from '../../utils/crypto-helpers';

type MoveFolderParams = {
    folderKey: FolderKey;
    targetKey: VaultShareKey | FolderKey;
    targetParentFolderId: MaybeNull<string>;
};

/** Only the moved folder key is re-encrypted: sub-folders and items are
 * encrypted with this folder key, which does not change. */
export const moveFolder = async ({
    folderKey,
    targetKey,
    targetParentFolderId,
}: MoveFolderParams): Promise<FolderMoveInputDto> => {
    const encryptedFolderKey = await encryptData(targetKey.key, folderKey.raw, PassEncryptionTag.FolderKey);

    return {
        ParentFolderID: targetParentFolderId,
        FolderKeys: [{ FolderKey: encryptedFolderKey.toBase64(), KeyRotation: folderKey.rotation }],
    };
};
