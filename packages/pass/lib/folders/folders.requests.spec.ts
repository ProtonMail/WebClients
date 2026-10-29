import { ApiError } from '@proton/shared/lib/fetch/ApiError';
import noop from '@proton/utils/noop';

import type { FolderDataResponse } from '../../types/api/pass';
import { logger } from '../../utils/logger';
import { createShareRemovedError } from '../../utils/tests/fixtures/shares';
import { exposeApi } from '../api/api';
import { PassErrorCode } from '../api/errors';
import { fetchFolder, requestFoldersForShareId } from './folders.requests';

const api = jest.fn();
exposeApi(api as any);
const warn = jest.spyOn(logger, 'warn').mockImplementation(noop);

const mockDecrypt = { order: [] as string[], failures: new Set<string>() };

jest.mock('./folders.parser', () => ({
    parseFolderResponse: jest.fn(async (shareId: string, folder: FolderDataResponse) => {
        mockDecrypt.order.push(folder.FolderID);
        if (mockDecrypt.failures.has(folder.FolderID)) throw new Error('Could not resolve folder key');

        return {
            folderId: folder.FolderID,
            shareId,
            vaultId: folder.VaultID,
            parentFolderId: folder.ParentFolderID ?? null,
            name: folder.FolderID,
            keyRotation: folder.KeyRotation,
        };
    }),
}));

const mockFolder = (FolderID: string, ParentFolderID: string | null): FolderDataResponse =>
    ({ FolderID, ParentFolderID, VaultID: 'vault1', KeyRotation: 1 }) as FolderDataResponse;

const mockFolders = (folders: FolderDataResponse[]) =>
    api.mockResolvedValue({ Folders: { Folders: folders, LastToken: null } });

describe('requestFoldersForShareId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockDecrypt.order = [];
        mockDecrypt.failures = new Set();
    });

    test('decrypts parents before their children', async () => {
        /** a -> b -> c, listed children first */
        mockFolders([mockFolder('c', 'b'), mockFolder('b', 'a'), mockFolder('a', null)]);

        const folders = await requestFoldersForShareId('share1');

        expect(mockDecrypt.order).toEqual(['a', 'b', 'c']);
        expect(folders.map(({ folderId }) => folderId)).toEqual(['a', 'b', 'c']);
    });

    test('skips a folder that fails to decrypt and keeps the others', async () => {
        mockFolders([mockFolder('a', null), mockFolder('b', null), mockFolder('c', null)]);
        mockDecrypt.failures = new Set(['b']);

        const folders = await requestFoldersForShareId('share1');

        expect(folders.map(({ folderId }) => folderId)).toEqual(['a', 'c']);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('[b]'), expect.any(Error));
    });

    test('resolves an empty list when the share has no folders', async () => {
        mockFolders([]);
        await expect(requestFoldersForShareId('share1')).resolves.toEqual([]);
    });
});

describe('fetchFolder', () => {
    afterEach(() => jest.clearAllMocks());

    test('resolves `undefined` when the share has been removed', async () => {
        api.mockRejectedValue(createShareRemovedError(PassErrorCode.NOT_EXIST_SHARE));
        await expect(fetchFolder('share1', 'folder1')).resolves.toBeUndefined();
    });

    test('throws on any other error', async () => {
        const err = new ApiError('', 500, 'TestError');
        api.mockRejectedValue(err);
        await expect(fetchFolder('share1', 'folder1')).rejects.toBe(err);
    });
});
