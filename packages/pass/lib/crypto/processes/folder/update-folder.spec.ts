import type { FolderKey } from '../../../../types';
import { ContentFormatVersion, PassEncryptionTag } from '../../../../types';
import { decryptData, generateKey, importSymmetricKey } from '../../utils/crypto-helpers';
import { randomContents } from '../../utils/testing';
import { updateFolder } from './update-folder';

describe('updateFolder crypto process', () => {
    const key = generateKey();

    const getFolderKey = async (): Promise<FolderKey> => ({
        raw: key,
        key: await importSymmetricKey(key),
        rotation: 1,
        parentFolderId: null,
    });

    test('should re-encrypt the content with the provided folder key', async () => {
        const folderKey = await getFolderKey();
        const content = randomContents();

        const update = await updateFolder({ content, folderKey });

        const decryptedContent = await decryptData(
            folderKey.key,
            Uint8Array.fromBase64(update.Content),
            PassEncryptionTag.FolderContent
        );

        expect(update.ContentFormatVersion).toEqual(ContentFormatVersion.Folder);
        expect(update.KeyRotation).toEqual(folderKey.rotation);
        expect(decryptedContent).toStrictEqual(content);
    });
});
