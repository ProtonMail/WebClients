import type { FolderKey, FolderKeysByShareId, MaybeNull } from '../../../types';
import { PassEncryptionTag } from '../../../types';
import { decryptData, encryptData, generateKey, importSymmetricKey } from './crypto-helpers';
import { hydrateFolderKeys, serializeFolderKeys } from './seralize';
import { randomContents } from './testing';

describe('folder keys serialization', () => {
    const createFolderKey = async (rotation: number, parentFolderId: MaybeNull<string>): Promise<FolderKey> => {
        const raw = generateKey();
        return { raw, key: await importSymmetricKey(raw), rotation, parentFolderId };
    };

    const createFolderKeys = async (): Promise<FolderKeysByShareId> => {
        const root = await createFolderKey(1, null);
        const nested = await createFolderKey(2, 'folder1');
        const otherShare = await createFolderKey(3, null);

        return new Map([
            [
                'share1',
                new Map([
                    ['folder1', root],
                    ['folder2', nested],
                ]),
            ],
            ['share2', new Map([['folder3', otherShare]])],
        ]);
    };

    test('should restore every folder key of every share', async () => {
        const folderKeys = await createFolderKeys();
        const hydrated = await hydrateFolderKeys(serializeFolderKeys(folderKeys));

        expect([...hydrated.keys()]).toEqual(['share1', 'share2']);
        expect([...hydrated.get('share1')!.keys()]).toEqual(['folder1', 'folder2']);
        expect([...hydrated.get('share2')!.keys()]).toEqual(['folder3']);

        folderKeys.forEach((shareFolderKeys, shareId) => {
            shareFolderKeys.forEach((folderKey, folderId) => {
                const restored = hydrated.get(shareId)!.get(folderId)!;
                expect(restored.raw).toEqual(folderKey.raw);
                expect(restored.rotation).toEqual(folderKey.rotation);
                expect(restored.parentFolderId).toEqual(folderKey.parentFolderId);
            });
        });
    });

    test('should restore a usable `CryptoKey`', async () => {
        const folderKeys = await createFolderKeys();
        const hydrated = await hydrateFolderKeys(serializeFolderKeys(folderKeys));

        const content = randomContents();
        const encrypted = await encryptData(
            folderKeys.get('share1')!.get('folder1')!.key,
            content,
            PassEncryptionTag.FolderContent
        );

        const decrypted = await decryptData(
            hydrated.get('share1')!.get('folder1')!.key,
            encrypted,
            PassEncryptionTag.FolderContent
        );

        expect(decrypted).toStrictEqual(content);
    });

    test('should handle an empty context', async () => {
        expect(serializeFolderKeys(new Map())).toEqual([]);
        expect(await hydrateFolderKeys([])).toEqual(new Map());
    });

    test('should handle a share holding no folder keys', async () => {
        const folderKeys: FolderKeysByShareId = new Map([['share1', new Map()]]);
        const hydrated = await hydrateFolderKeys(serializeFolderKeys(folderKeys));

        expect(hydrated.get('share1')).toEqual(new Map());
    });
});
