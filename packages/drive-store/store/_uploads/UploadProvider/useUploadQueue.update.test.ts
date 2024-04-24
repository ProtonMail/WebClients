import { act, renderHook } from '@testing-library/react-hooks';

import { TransferState } from '../../../components/TransferManager/transfer';
import { mockGlobalFile, testFile } from '../../../utils/test/file';
import { UploadFileList } from '../interface';
import { FileUpload, FolderUpload, UpdateCallback, UpdateData, UpdateFilter, UpdateState } from './interface';
import useUploadQueue from './useUploadQueue';

describe("useUploadQueue's update functions", () => {
    const mockLogCallback = jest.fn();

    let hook: {
        current: {
            fileUploads: FileUpload[];
            folderUploads: FolderUpload[];
            add: (shareId: string, parentId: string, fileList: UploadFileList) => void;
            updateState: (idOrFilter: UpdateFilter, newStateOrCallback: UpdateState) => void;
            updateWithData: (idOrFilter: UpdateFilter, newStateOrCallback: UpdateState, data: UpdateData) => void;
            updateWithCallback: (
                idOrFilter: UpdateFilter,
                newStateOrCallback: UpdateState,
                callback: UpdateCallback
            ) => void;
        };
    };

    let firstFileId: string;
    let firstFolderId: string;
    let secondFileId: string;
    let secondIds: string[];

    beforeEach(() => {
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
        secondFileId = hook.current.fileUploads[1].id;
        secondIds = [secondFileId, hook.current.folderUploads[1].id];
    });

    it('updates file state using id', () => {
        act(() => {
            hook.current.updateState(firstFileId, TransferState.Canceled);
        });
        expect(hook.current.fileUploads.map(({ state }) => state)).toMatchObject([
            TransferState.Canceled,
            TransferState.Initializing,
            TransferState.Initializing,
            TransferState.Initializing,
        ]);
    });

    it('updates folder state using id', () => {
        act(() => {
            hook.current.updateState(firstFolderId, TransferState.Canceled);
        });
        expect(hook.current.folderUploads.map(({ state }) => state)).toMatchObject([
            TransferState.Canceled,
            TransferState.Pending,
            TransferState.Pending,
        ]);
    });

    it('updates file and folder state using filter', () => {
        act(() => {
            hook.current.updateState(({ id }) => secondIds.includes(id), TransferState.Canceled);
        });
        expect(hook.current.fileUploads.map(({ state }) => state)).toMatchObject([
            TransferState.Pending,
            TransferState.Canceled,
            TransferState.Initializing,
            TransferState.Canceled,
        ]);
        expect(hook.current.folderUploads.map(({ state }) => state)).toMatchObject([
            TransferState.Pending,
            TransferState.Canceled,
            TransferState.Pending,
        ]);
    });

    it('updates file and folder by callback', () => {
        act(() => {
            hook.current.updateState(
                () => true,
                ({ state }) => (state === TransferState.Pending ? TransferState.Error : TransferState.Canceled)
            );
        });
        expect(hook.current.fileUploads.map(({ state }) => state)).toMatchObject([
            TransferState.Error,
            TransferState.Canceled,
            TransferState.Canceled,
            TransferState.Canceled,
        ]);
        expect(hook.current.folderUploads.map(({ state }) => state)).toMatchObject([
            TransferState.Error,
            TransferState.Error,
            TransferState.Error,
        ]);
    });

    it('updates file state with data', () => {
        act(() => {
            hook.current.updateWithData(firstFileId, TransferState.Progress, {
                name: 'file1 (1).txt',
                mimeType: 'txt2',
                originalIsDraft: true,
            });
        });
        expect(hook.current.fileUploads[0]).toMatchObject({
            state: TransferState.Progress,
            meta: {
                filename: 'file1 (1).txt',
                mimeType: 'txt2',
                size: 42,
            },
            originalIsDraft: true,
        });
    });

    it('updates folder state with data', () => {
        act(() => {
            hook.current.updateWithData(firstFolderId, TransferState.Progress, {
                folderId: 'folderId',
                originalIsDraft: true,
            });
        });

        expect(hook.current.folderUploads[0]).toMatchObject({
            state: TransferState.Progress,
            linkId: 'folderId',
            originalIsDraft: true,
        });
        expect(
            hook.current.fileUploads.map(({ parentId, state, meta }) => [meta.filename, state, parentId])
        ).toMatchObject([
            ['file1.txt', TransferState.Pending, 'parentId'],
            ['file2.txt', TransferState.Pending, 'folderId'],
            ['file3.txt', TransferState.Pending, 'folderId'],
            ['file4.txt', TransferState.Initializing, undefined],
        ]);
    });

    it('updates folder but keeps sub files and folders cancelled', () => {
        act(() => {
            hook.current.updateState(() => true, TransferState.Canceled);
            hook.current.updateWithData(firstFolderId, TransferState.Progress, {
                folderId: 'folderId',
            });
        });

        expect(
            hook.current.fileUploads.map(({ parentId, state, meta }) => [meta.filename, state, parentId])
        ).toMatchObject([
            ['file1.txt', TransferState.Canceled, 'parentId'],
            ['file2.txt', TransferState.Canceled, 'folderId'],
            ['file3.txt', TransferState.Canceled, 'folderId'],
            ['file4.txt', TransferState.Canceled, undefined],
        ]);
    });

    it('updates states with error', () => {
        const error = new Error('some failuer');
        act(() => {
            hook.current.updateWithData(({ id }) => secondIds.includes(id), TransferState.Error, {
                error,
            });
        });
        expect(hook.current.fileUploads.map(({ state, error, meta }) => [meta.filename, state, error])).toMatchObject([
            ['file1.txt', TransferState.Pending, undefined],
            ['file2.txt', TransferState.Error, error],
            ['file3.txt', TransferState.Initializing, undefined],
            ['file4.txt', TransferState.Initializing, undefined],
        ]);
        expect(hook.current.folderUploads.map(({ state, error, meta }) => [meta.filename, state, error])).toMatchObject(
            [
                ['folder1', TransferState.Pending, undefined],
                ['folder2', TransferState.Error, error],
                ['folder3', TransferState.Pending, undefined],
            ]
        );
    });

    it('updates state with callback', () => {
        const mockCallback = jest.fn();
        act(() => {
            hook.current.updateWithCallback(
                ({ state }) => state === TransferState.Pending,
                TransferState.Progress,
                mockCallback
            );
        });
        expect(mockCallback.mock.calls).toMatchObject([
            [{ parentId: 'parentId', meta: { filename: 'file1.txt' } }],
            [{ parentId: 'parentId', meta: { filename: 'folder1' } }],
            [{ parentId: 'parentId', meta: { filename: 'folder2' } }],
            [{ parentId: 'parentId', meta: { filename: 'folder3' } }],
        ]);
    });

    it('updates state to cancel for folder recursively to not hang children forever', () => {
        act(() => {
            hook.current.updateState(firstFolderId, TransferState.Canceled);
        });
        expect(hook.current.folderUploads.map(({ state, meta }) => [meta.filename, state])).toMatchObject([
            ['folder1', TransferState.Canceled],
            ['folder2', TransferState.Pending],
            ['folder3', TransferState.Pending],
        ]);
        expect(hook.current.fileUploads.map(({ state, meta }) => [meta.filename, state])).toMatchObject([
            ['file1.txt', TransferState.Pending],
            ['file2.txt', TransferState.Canceled],
            ['file3.txt', TransferState.Canceled],
            ['file4.txt', TransferState.Initializing],
        ]);
    });

    it('restarts child also restarts parent folder recursively to not hang forever', () => {
        act(() => {
            hook.current.updateState(firstFolderId, TransferState.Canceled);
            hook.current.updateState(secondFileId, TransferState.Initializing);
        });
        expect(hook.current.folderUploads.map(({ state, meta }) => [meta.filename, state])).toMatchObject([
            ['folder1', TransferState.Pending],
            ['folder2', TransferState.Pending],
            ['folder3', TransferState.Pending],
        ]);
        expect(hook.current.fileUploads.map(({ state, meta }) => [meta.filename, state])).toMatchObject([
            ['file1.txt', TransferState.Pending],
            ['file2.txt', TransferState.Initializing],
            ['file3.txt', TransferState.Canceled],
            ['file4.txt', TransferState.Initializing],
        ]);
    });
});
