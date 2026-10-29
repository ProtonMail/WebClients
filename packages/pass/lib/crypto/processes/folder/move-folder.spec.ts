import type { FolderKey } from '../../../../types/crypto/pass-types';
import { PassEncryptionTag } from '../../../../types/crypto/pass-types';
import { decryptData, generateKey, importSymmetricKey } from '../../utils/crypto-helpers';
import { moveFolder } from './move-folder';

describe('moveFolder crypto process', () => {
    const createKey = async (rotation: number): Promise<FolderKey> => {
        const raw = generateKey();
        return { raw, key: await importSymmetricKey(raw), rotation, parentFolderId: null };
    };

    test('should re-encrypt the folder key with the target key and keep the folder key rotation', async () => {
        const folderKey = await createKey(1);
        const targetKey = await createKey(3);

        const move = await moveFolder({ folderKey, targetKey, targetParentFolderId: 'target-folder' });

        expect(move.ParentFolderID).toEqual('target-folder');
        expect(move.FolderKeys).toHaveLength(1);
        expect(move.FolderKeys[0].KeyRotation).toEqual(folderKey.rotation);

        const decryptedFolderKey = await decryptData(
            targetKey.key,
            Uint8Array.fromBase64(move.FolderKeys[0].FolderKey),
            PassEncryptionTag.FolderKey
        );

        expect(decryptedFolderKey).toStrictEqual(folderKey.raw);
    });

    test('should send a null parent when moving to the vault root', async () => {
        const move = await moveFolder({
            folderKey: await createKey(1),
            targetKey: await createKey(2),
            targetParentFolderId: null,
        });

        expect(move.ParentFolderID).toBeNull();
    });
});
