import { exposePassCrypto } from '@proton/pass/lib/crypto';
import type { ItemFileOutput, ItemKey } from '@proton/pass/types';

import { filesFormInitializer, intoFileDescriptors, reconcileFilename } from './helpers';

jest.mock('./file-proto.transformer', () => ({
    ...jest.requireActual('./file-proto.transformer'),
    decodeFileMetadata: jest.fn().mockImplementation((data) => ({
        name: `File ${data[0]}`,
        mimeType: 'text/plain',
    })),
}));

describe('intoFileDescriptors', () => {
    let openFileDescriptor: jest.Mock;

    beforeEach(() => {
        openFileDescriptor = jest.fn();
        exposePassCrypto({ openFileDescriptor } as any);
        jest.clearAllMocks();
    });

    test('should transform ItemFileOutput into FileDescriptor', async () => {
        const files: ItemFileOutput[] = [
            {
                FileID: '1',
                Size: 1024,
                Chunks: [{ ChunkID: '::chunk-id-0::', Index: 0, Size: 1024 }],
                RevisionAdded: 1741348049,
                RevisionRemoved: null,
                PersistentFileUID: 'uid1',
                Metadata: '::metadata::',
                FileKey: '::file-key-file1::',
                CreateTime: 1741348049,
                ModifyTime: 1741348049,
                ItemKeyRotation: 1,
                EncryptionVersion: 1,
            },
            {
                FileID: '2',
                Size: 2048,
                Chunks: [{ ChunkID: '::chunk-id-0::', Index: 0, Size: 2048 }],
                RevisionAdded: 1741348049,
                RevisionRemoved: null,
                PersistentFileUID: 'uid2',
                Metadata: '::metadata::',
                FileKey: '::file-key-file2::',
                CreateTime: 1741348049,
                ModifyTime: 1741348049,
                ItemKeyRotation: 1,
                EncryptionVersion: 2,
            },
        ];

        openFileDescriptor.mockImplementation(async ({ file }) => new Uint8Array([parseInt(file.FileID, 10)]));

        const result = await intoFileDescriptors('shareId', files, {} as ItemKey);

        expect(openFileDescriptor).toHaveBeenCalledTimes(2);

        expect(result).toEqual([
            {
                name: 'File 1',
                mimeType: 'text/plain',
                fileID: '1',
                size: 1024,
                chunks: [{ ChunkID: '::chunk-id-0::', Index: 0, Size: 1024 }],
                revisionAdded: 1741348049,
                revisionRemoved: null,
                fileUID: 'uid1',
                encryptionVersion: 1,
            },
            {
                name: 'File 2',
                mimeType: 'text/plain',
                fileID: '2',
                size: 2048,
                chunks: [{ ChunkID: '::chunk-id-0::', Index: 0, Size: 2048 }],
                revisionAdded: 1741348049,
                revisionRemoved: null,
                fileUID: 'uid2',
                encryptionVersion: 2,
            },
        ]);
    });
});

describe('filesFormInitializer', () => {
    test('should initialize with empty arrays by default', () => {
        const result = filesFormInitializer();

        expect(result).toEqual({
            toAdd: [],
            toRemove: [],
            toRestore: [],
        });
    });

    test('should use provided values when specified', () => {
        const toAdd = ['1'];
        const toRemove = ['2'];
        const toRestore = ['3'];

        const result = filesFormInitializer({ toAdd, toRemove, toRestore });

        expect(result).toEqual({
            toAdd,
            toRemove,
            toRestore,
        });
    });

    test('should handle partial values', () => {
        const result = filesFormInitializer({ toAdd: ['1'] });

        expect(result).toEqual({
            toAdd: ['1'],
            toRemove: [],
            toRestore: [],
        });
    });
});

describe('reconcileFilename NEW', () => {
    test.each([
        ['newfile.txt', 'oldfile.pdf', 'newfile.txt', 'should keep the filename if it already has an extension'],
        ['newfile', 'oldfile.pdf', 'newfile.pdf', 'should add the extension from the old filename if new one has none'],
        ['newfile', 'oldfile', 'newfile', 'should leave the new filename as is if old file has no extension'],
        ['document.v2', 'document.v1.docx', 'document.v2', 'should handle complex filenames with dots in the middle'],
        ['archive', 'data.tar.gz', 'archive.gz', 'should handle filenames with multiple extensions'],
    ])('%s + %s → %s (%s)', (newFileName, oldFileName, expected) => {
        const result = reconcileFilename(newFileName, oldFileName);
        expect(result).toBe(expected);
    });
});
