import { act, renderHook } from '@testing-library/react-hooks';

import { TransferState } from '../../../components/TransferManager/transfer';
import { mockGlobalFile, testFile } from '../../../utils/test/file';
import { UploadFileList } from '../interface';
import { FileUpload, FolderUpload } from './interface';
import useUploadQueue from './useUploadQueue';

describe("useUploadQueue' attributes", () => {
    const mockLogCallback = jest.fn();

    let hook: {
        current: {
            hasUploads: boolean;
            fileUploads: FileUpload[];
            folderUploads: FolderUpload[];
            allUploads: (FileUpload | FolderUpload)[];
            add: (shareId: string, parentId: string, fileList: UploadFileList) => void;
        };
    };

    beforeEach(() => {
        mockGlobalFile();
        const { result } = renderHook(() => useUploadQueue(mockLogCallback));
        hook = result;
    });

    it('returns empty queue', () => {
        expect(hook.current.hasUploads).toBe(false);
        expect(hook.current.fileUploads).toMatchObject([]);
        expect(hook.current.folderUploads).toMatchObject([]);
        expect(hook.current.allUploads).toMatchObject([]);
    });

    it('returns folder only', () => {
        act(() => {
            hook.current.add('shareId', 'parentId', [{ path: [], folder: 'folder' }]);
        });

        const expectedFolder = {
            // We don't check ID and startDate.
            shareId: 'shareId',
            parentId: 'parentId',
            state: TransferState.Pending,
            name: 'folder',
            files: [],
            folders: [],
            meta: {
                filename: 'folder',
                size: 0,
                mimeType: 'Folder',
            },
        };

        expect(hook.current.hasUploads).toBe(true);
        expect(hook.current.fileUploads).toMatchObject([]);
        expect(hook.current.folderUploads).toMatchObject([expectedFolder]);
        expect(hook.current.allUploads).toMatchObject([expectedFolder]);
    });

    it('returns file only', () => {
        const file = testFile('file.txt');
        const dsStore = testFile('.DS_Store');
        act(() => {
            hook.current.add('shareId', 'parentId', [
                { path: [], file },
                { path: [], file: dsStore }, // .DS_Store files are ignored.
            ]);
        });

        const expectedFile = {
            // We don't check ID and startDate.
            shareId: 'shareId',
            parentId: 'parentId',
            state: TransferState.Pending,
            file,
            meta: {
                filename: file.name,
                mimeType: file.type,
                size: file.size,
            },
        };

        expect(hook.current.hasUploads).toBe(true);
        expect(hook.current.fileUploads).toMatchObject([expectedFile]);
        expect(hook.current.folderUploads).toMatchObject([]);
        expect(hook.current.allUploads).toMatchObject([expectedFile]);
    });

    it('returns both files and folders', () => {
        const file = testFile('file.txt');
        act(() => {
            hook.current.add('shareId', 'parentId', [
                { path: [], folder: 'folder' },
                { path: ['folder'], file },
            ]);
        });

        expect(hook.current.hasUploads).toBe(true);
        expect(hook.current.fileUploads).toMatchObject([
            {
                state: TransferState.Initializing,
                parentId: undefined,
            },
        ]);
        expect(hook.current.folderUploads).toMatchObject([
            {
                state: TransferState.Pending,
                parentId: 'parentId',
                files: [{ meta: { filename: 'file.txt' } }],
            },
        ]);
        expect(hook.current.allUploads.length).toBe(2);
    });
});
