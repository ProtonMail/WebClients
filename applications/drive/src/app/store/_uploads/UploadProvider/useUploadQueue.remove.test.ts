import { act, renderHook } from '@testing-library/react-hooks';

import { mockGlobalFile, testFile } from '../../../utils/test/file';
import { UploadFileList } from '../interface';
import { FileUpload, FolderUpload, UpdateCallback, UpdateFilter } from './interface';
import useUploadQueue from './useUploadQueue';

describe('useUploadQueue::remove', () => {
    const mockCallback = jest.fn();
    const mockLogCallback = jest.fn();

    let hook: {
        current: {
            fileUploads: FileUpload[];
            folderUploads: FolderUpload[];
            add: (shareId: string, parentId: string, fileList: UploadFileList) => void;
            remove: (idOrFilter: UpdateFilter, callback?: UpdateCallback) => void;
        };
    };

    let firstFileId: string;
    let firstFolderId: string;
    let secondIds: string[];

    beforeEach(() => {
        mockCallback.mockClear();

        mockGlobalFile();

        const { result } = renderHook(() => useUploadQueue(mockLogCallback));
        hook = result;

        act(() => {
            hook.current.add('shareId', 'parentId', [
                { path: [], folder: 'folder1' },
                { path: [], folder: 'folder2' },
                { path: [], folder: 'folder3' },
                { path: [], file: testFile('file1.txt') },
                { path: ['folder1'], file: testFile('file2.txt') },
                { path: ['folder1'], file: testFile('file3.txt') },
                { path: ['folder2'], file: testFile('file4.txt') },
            ]);
        });

        firstFileId = hook.current.fileUploads[0].id;
        firstFolderId = hook.current.folderUploads[0].id;
        secondIds = [hook.current.fileUploads[1].id, hook.current.folderUploads[1].id];
    });

    it('removes file from the queue using id', () => {
        act(() => {
            hook.current.remove(firstFileId, mockCallback);
        });
        expect(mockCallback.mock.calls).toMatchObject([[{ meta: { filename: 'file1.txt' } }]]);
        expect(hook.current.folderUploads).toMatchObject([
            { meta: { filename: 'folder1' } },
            { meta: { filename: 'folder2' } },
            { meta: { filename: 'folder3' } },
        ]);
        expect(hook.current.fileUploads).toMatchObject([
            { meta: { filename: 'file2.txt' } },
            { meta: { filename: 'file3.txt' } },
            { meta: { filename: 'file4.txt' } },
        ]);
    });

    it('removes folder from the queue using id', () => {
        act(() => {
            hook.current.remove(firstFolderId, mockCallback);
        });
        expect(mockCallback.mock.calls).toMatchObject([
            [{ meta: { filename: 'folder1' } }],
            [{ meta: { filename: 'file2.txt' } }],
            [{ meta: { filename: 'file3.txt' } }],
        ]);
        expect(hook.current.folderUploads).toMatchObject([
            { meta: { filename: 'folder2' } },
            { meta: { filename: 'folder3' } },
        ]);
        expect(hook.current.fileUploads).toMatchObject([
            { meta: { filename: 'file1.txt' } },
            { meta: { filename: 'file4.txt' } },
        ]);
    });

    it('removes file and folder from the queue using filter', () => {
        act(() => {
            hook.current.remove(({ id }) => secondIds.includes(id), mockCallback);
        });
        expect(mockCallback.mock.calls).toMatchObject([
            [{ meta: { filename: 'folder2' } }],
            [{ meta: { filename: 'file4.txt' } }],
            [{ meta: { filename: 'file2.txt' } }],
        ]);
        expect(hook.current.folderUploads).toMatchObject([
            { meta: { filename: 'folder1' } },
            { meta: { filename: 'folder3' } },
        ]);
        expect(hook.current.fileUploads).toMatchObject([
            { meta: { filename: 'file1.txt' } },
            { meta: { filename: 'file3.txt' } },
        ]);
    });
});
