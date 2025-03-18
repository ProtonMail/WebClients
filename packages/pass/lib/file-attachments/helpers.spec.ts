import type { FileDescriptor, ItemFileOutput } from '@proton/pass/types';

import { filesFormInitializer, flattenFilesByItemShare, intoFileDescriptor, reconcileFilename } from './helpers';

// Mock for decodeFileContent function
jest.mock('./file-proto.transformer', () => ({
    ...jest.requireActual('./file-proto.transformer'),
    decodeFileContent: jest.fn().mockImplementation((data) => {
        // Mocking different returns based on file
        if (data[0] === 1) {
            return { name: 'File 1', mimeType: 'text/plain' };
        }
        return null; // This will trigger the fallback
    }),
}));

describe('intoFileDescriptor', () => {
    beforeEach(jest.clearAllMocks);

    it('should transform ItemFileOutput into FileDescriptor', async () => {
        const files: ItemFileOutput[] = [
            {
                FileID: 'file1',
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
            },
            {
                FileID: 'file2',
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
            },
        ];

        const decryptDescriptor = jest
            .fn()
            .mockImplementation((file) => new Uint8Array(file.FileID === 'file1' ? [1, 2, 3] : [4, 5, 6]));

        const result = await intoFileDescriptor(files, decryptDescriptor);

        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
            name: 'File 1',
            mimeType: 'text/plain',
            fileID: 'file1',
            size: 1024,
            chunks: [{ ChunkID: '::chunk-id-0::', Index: 0, Size: 1024 }],
            revisionAdded: 1741348049,
            revisionRemoved: null,
            fileUID: 'uid1',
        });
        expect(result[1]).toEqual({
            name: 'Unknown',
            mimeType: '',
            fileID: 'file2',
            size: 2048,
            chunks: [{ ChunkID: '::chunk-id-0::', Index: 0, Size: 2048 }],
            revisionAdded: 1741348049,
            revisionRemoved: null,
            fileUID: 'uid2',
        });
        expect(decryptDescriptor).toHaveBeenCalledTimes(2);
    });
});

describe('flattenFilesByItemShare', () => {
    it('should flatten files by share and item IDs', () => {
        const filesByShare = {
            share1: {
                item1: [{ name: 'file1.txt' }, { name: 'file2.txt' }] as FileDescriptor[],
                item2: [{ name: 'file3.txt' }] as FileDescriptor[],
            },
            share2: {
                item3: [{ name: 'file4.txt' }] as FileDescriptor[],
            },
        };

        const result = flattenFilesByItemShare(filesByShare);

        expect(result).toHaveLength(3);
        expect(result).toEqual([
            { shareId: 'share1', itemId: 'item1', files: [{ name: 'file1.txt' }, { name: 'file2.txt' }] },
            { shareId: 'share1', itemId: 'item2', files: [{ name: 'file3.txt' }] },
            { shareId: 'share2', itemId: 'item3', files: [{ name: 'file4.txt' }] },
        ]);
    });

    it('should handle empty or null records', () => {
        const filesByShare = { share1: undefined, share2: {} };
        const result = flattenFilesByItemShare(filesByShare);
        expect(result).toHaveLength(0);
    });

    it('should work with custom typed objects', () => {
        type CustomFile = {
            id: string;
            content: string;
        };

        const filesByShare = {
            share1: {
                item1: [{ id: '1', content: 'hello' }] as CustomFile[],
            },
        };

        const result = flattenFilesByItemShare<CustomFile>(filesByShare);

        expect(result).toHaveLength(1);
        expect(result[0].files[0].id).toBe('1');
        expect(result[0].files[0].content).toBe('hello');
    });
});

describe('filesFormInitializer', () => {
    it('should initialize with empty arrays by default', () => {
        const result = filesFormInitializer();

        expect(result).toEqual({
            toAdd: [],
            toRemove: [],
            toRestore: [],
        });
    });

    it('should use provided values when specified', () => {
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

    it('should handle partial values', () => {
        // Act
        const result = filesFormInitializer({ toAdd: ['1'] });

        // Assert
        expect(result).toEqual({
            toAdd: ['1'],
            toRemove: [],
            toRestore: [],
        });
    });
});

describe('reconcileFilename NEW', () => {
    test.each([
        // [newFileName, oldFileName, expectedResult, description]
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
