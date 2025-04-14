import { exposePassCrypto } from '@proton/pass/lib/crypto';
import type { FileDescriptor, ItemFileOutput, ItemKey } from '@proton/pass/types';

import {
    filesFormInitializer,
    getExportFileName,
    getFileParts,
    intoFileDescriptors,
    intoFileParam,
    intoFileRef,
    intoPublicFileDescriptors,
    isFileForRevision,
    mimetypeForDownload,
    sanitizeFileName,
    validateFileName,
} from './helpers';

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

describe('isFileForRevision', () => {
    test('should return true if revision is within the range', () => {
        const file = { revisionAdded: 10, revisionRemoved: 20 } as FileDescriptor;
        expect(isFileForRevision(10)(file)).toBe(true);
        expect(isFileForRevision(15)(file)).toBe(true);
        expect(isFileForRevision(19)(file)).toBe(true);
    });

    test('should return false if revision is outside the range', () => {
        const file = { revisionAdded: 10, revisionRemoved: 20 } as FileDescriptor;
        expect(isFileForRevision(9)(file)).toBe(false);
        expect(isFileForRevision(20)(file)).toBe(false);
    });

    test('should return true if file has not been removed and revision is after addition', () => {
        const file = { revisionAdded: 10, revisionRemoved: null } as FileDescriptor;
        expect(isFileForRevision(10)(file)).toBe(true);
        expect(isFileForRevision(999)(file)).toBe(true);
    });
});

describe('intoPublicFileDescriptors', () => {
    let openSecureLinkFileDescriptor: jest.Mock;

    beforeEach(() => {
        openSecureLinkFileDescriptor = jest.fn();
        exposePassCrypto({ openSecureLinkFileDescriptor } as any);
        jest.clearAllMocks();
    });

    test('should transform ItemFileOutput into FileDescriptor for secure links', async () => {
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
        ];

        openSecureLinkFileDescriptor.mockImplementation(async () => new Uint8Array([1]));

        const result = await intoPublicFileDescriptors(files, 'encryptedItemKey', 'linkKey');

        expect(openSecureLinkFileDescriptor).toHaveBeenCalledTimes(1);
        expect(openSecureLinkFileDescriptor).toHaveBeenCalledWith({
            encryptedFileKey: '::file-key-file1::',
            encryptedItemKey: 'encryptedItemKey',
            encryptedMetadata: '::metadata::',
            encryptionVersion: 1,
            fileID: '1',
            linkKey: 'linkKey',
        });

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
        ]);
    });
});

describe('getFileParts', () => {
    test.each<[string, ReturnType<typeof getFileParts>, string]>([
        ['document.pdf', { base: 'document', ext: '.pdf' }, 'should extract name and extension'],
        ['archive.tar.gz', { base: 'archive.tar', ext: '.gz' }, 'should handle multiple dots'],
        ['noextension', { base: 'noextension', ext: '' }, 'should handle files without extension'],
        ['.htaccess', { base: '', ext: '.htaccess' }, 'should return null for dotfiles'],
        ['file.', { base: 'file.', ext: '' }, 'should handle files with empty extension'],
        ['file..ext', { base: 'file.', ext: '.ext' }, 'should handle consecutive dots'],
    ])('%s → %o (%s)', (filename, expected) => {
        const result = getFileParts(filename);
        expect(result).toEqual(expected);
    });
});

describe('getExportFileName', () => {
    test.each<[string, string, string]>([
        ['document.pdf', 'document.1c40ad017a1e32ce.pdf', 'should add uniqueId before extension'],
        ['document', 'document.1c40ad017a1e32ce', 'should append uniqueId for files without extension'],
        ['ar.tar.gz', 'ar.tar.1c40ad017a1e32ce.gz', 'should interpolate uniqueId for 2 part extensions'],
        ['.dot', '.1c40ad017a1e32ce.dot', 'should prepend uniqueId for dotfiles'],
    ])('%s → %s (%s)', (name, expected) => {
        const result = getExportFileName('test-shareID')({ name, fileID: 'test-fileID' } as FileDescriptor);
        expect(result).toEqual(expected);
    });
});

describe('mimetypeForDownload', () => {
    const self = global as any;
    const originalBuildTarget = self.BUILD_TARGET;

    afterEach(() => {
        self.BUILD_TARGET = originalBuildTarget;
    });

    test('should return application/octet-stream for Safari', () => {
        self.BUILD_TARGET = 'safari';
        expect(mimetypeForDownload('image/png')).toBe('application/octet-stream');
    });

    test('should return original mimetype for non-safari extension builds', () => {
        self.BUILD_TARGET = 'chrome';
        expect(mimetypeForDownload('image/png')).toBe('image/png');
    });
});

describe('intoFileParam and intoFileRef', () => {
    test('should correctly perform round-trip conversion', () => {
        const fileRef = { filename: 'test.pdf', mimeType: 'application/pdf', ref: 'abc123' };
        const param = intoFileParam(fileRef);
        const result = intoFileRef(param);
        expect(result).toEqual(fileRef);
    });
});

describe('sanitizeFileName', () => {
    test.each<[string, string, string]>([
        ['file/name.txt', 'file_name.txt', 'should replace forward slashes with underscores'],
        ['file\\name.txt', 'file_name.txt', 'should replace backslashes with underscores'],
        ['file/with\\both/slashes.txt', 'file_with_both_slashes.txt', 'should replace both slash types'],
        ['normal-filename.txt', 'normal-filename.txt', 'should not modify filenames without slashes'],
    ])('%s → %s (%s)', (input, expected) => {
        expect(sanitizeFileName(input)).toBe(expected);
    });
});

describe('validateFileName', () => {
    test.each<[string, boolean, string]>([
        ['', false, 'should reject empty filenames'],
        ['.', false, 'should reject single dot'],
        ['..', false, 'should reject double dots'],
        ['...', false, 'should reject triple dots'],
        ['valid.txt', true, 'should validate valid filenames'],
        ['.gitignore', true, 'should validate dot files'],
    ])('%s → %s (%s)', (input, expected) => {
        expect(validateFileName(input)).toBe(expected);
    });
});
