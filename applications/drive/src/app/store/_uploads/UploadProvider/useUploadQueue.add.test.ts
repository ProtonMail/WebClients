import { act, renderHook } from '@testing-library/react-hooks';

import { TransferState } from '../../../components/TransferManager/transfer';
import { mockGlobalFile, testFile } from '../../../utils/test/file';
import { UploadFileList } from '../interface';
import { FileUpload, FolderUpload, UploadQueue } from './interface';
import useUploadQueue, { addItemToQueue } from './useUploadQueue';

function createEmptyQueue(): UploadQueue {
    return {
        shareId: 'shareId',
        linkId: 'parentId',
        files: [],
        folders: [],
    };
}

describe('useUploadQueue::add', () => {
    const mockLogCallback = jest.fn();

    let hook: {
        current: {
            fileUploads: FileUpload[];
            folderUploads: FolderUpload[];
            add: (shareId: string, parentId: string, fileList: UploadFileList) => void;
        };
    };

    beforeEach(() => {
        mockGlobalFile();
        const { result } = renderHook(() => useUploadQueue(mockLogCallback));
        hook = result;
    });

    it('creates new upload queue', () => {
        act(() => {
            hook.current.add('shareId', 'parentId', [{ path: [], folder: 'folder' }]);
            hook.current.add('shareId2', 'parentId2', [{ path: [], folder: 'folder' }]);
        });
        expect(hook.current.folderUploads).toMatchObject([
            {
                name: 'folder',
                shareId: 'shareId',
                parentId: 'parentId',
            },
            {
                name: 'folder',
                shareId: 'shareId2',
                parentId: 'parentId2',
            },
        ]);
    });

    it('merges upload queue', () => {
        act(() => {
            hook.current.add('shareId', 'parentId', [{ path: [], folder: 'folder' }]);
            hook.current.add('shareId', 'parentId', [{ path: [], folder: 'folder2' }]);
        });
        expect(hook.current.folderUploads).toMatchObject([
            {
                name: 'folder',
                shareId: 'shareId',
                parentId: 'parentId',
            },
            {
                name: 'folder2',
                shareId: 'shareId',
                parentId: 'parentId',
            },
        ]);
    });

    it('throws error when adding file with empty name', () => {
        expect(() => {
            addItemToQueue(mockLogCallback, 'shareId', createEmptyQueue(), { path: [], file: testFile('') });
        }).toThrow('File or folder is missing a name');
    });

    it('throws error when adding folder with empty name', () => {
        expect(() => {
            addItemToQueue(mockLogCallback, 'shareId', createEmptyQueue(), { path: [], folder: '' });
        }).toThrow('File or folder is missing a name');
    });

    it('throws error when adding file to non-existing folder', () => {
        expect(() => {
            addItemToQueue(mockLogCallback, 'shareId', createEmptyQueue(), {
                path: ['folder'],
                file: testFile('a.txt'),
            });
        }).toThrow('Wrong file or folder structure');
    });

    it('throws error when adding the same file again', () => {
        const queue = createEmptyQueue();
        addItemToQueue(mockLogCallback, 'shareId', queue, { path: [], file: testFile('a.txt') });
        expect(() => {
            addItemToQueue(mockLogCallback, 'shareId', queue, { path: [], file: testFile('a.txt') });
        }).toThrow('File or folder "a.txt" is already uploading');
        addItemToQueue(mockLogCallback, 'shareId', queue, { path: [], folder: 'folder' });
        addItemToQueue(mockLogCallback, 'shareId', queue, { path: ['folder'], file: testFile('a.txt') });
        expect(() => {
            addItemToQueue(mockLogCallback, 'shareId', queue, { path: ['folder'], file: testFile('a.txt') });
        }).toThrow('File or folder "a.txt" is already uploading');
    });

    it('throws error when adding the same folder again', () => {
        const queue = createEmptyQueue();
        addItemToQueue(mockLogCallback, 'shareId', queue, { path: [], folder: 'folder' });
        expect(() => {
            addItemToQueue(mockLogCallback, 'shareId', queue, { path: [], folder: 'folder' });
        }).toThrow('File or folder "folder" is already uploading');
        addItemToQueue(mockLogCallback, 'shareId', queue, { path: ['folder'], folder: 'subfolder' });
        expect(() => {
            addItemToQueue(mockLogCallback, 'shareId', queue, { path: ['folder'], folder: 'subfolder' });
        }).toThrow('File or folder "subfolder" is already uploading');
    });

    it('throws error when adding the same folder again with unfinished childs', () => {
        const queue = createEmptyQueue();
        addItemToQueue(mockLogCallback, 'shareId', queue, { path: [], folder: 'folder' });
        addItemToQueue(mockLogCallback, 'shareId', queue, { path: ['folder'], file: testFile('a.txt') });

        queue.folders[0].state = TransferState.Done;
        expect(() => {
            addItemToQueue(mockLogCallback, 'shareId', queue, { path: [], folder: 'folder' });
        }).toThrow('File or folder "folder" is already uploading');

        queue.folders[0].files[0].state = TransferState.Done;
        addItemToQueue(mockLogCallback, 'shareId', queue, { path: [], folder: 'folder' });
    });

    it('adds files to the latest folder', () => {
        const queue = createEmptyQueue();
        addItemToQueue(mockLogCallback, 'shareId', queue, { path: [], folder: 'folder' });
        queue.folders[0].state = TransferState.Done;

        addItemToQueue(mockLogCallback, 'shareId', queue, { path: [], folder: 'folder' });
        addItemToQueue(mockLogCallback, 'shareId', queue, { path: ['folder'], file: testFile('b.txt') });
        expect(queue.folders[0].files.length).toBe(0);
        expect(queue.folders[1].files.length).toBe(1);
        expect(queue.folders[1].files[0].meta.filename).toBe('b.txt');
    });

    it('adds files to already prepared filter with pending state', () => {
        const queue = createEmptyQueue();
        addItemToQueue(mockLogCallback, 'shareId', queue, { path: [], folder: 'folder' });

        // The first file, before folder is done, is set to init state.
        addItemToQueue(mockLogCallback, 'shareId', queue, { path: ['folder'], file: testFile('a.txt') });
        expect(queue.folders[0].files[0]).toMatchObject({
            meta: { filename: 'a.txt' },
            state: TransferState.Initializing,
        });

        // The second file, after folder is done, is set to pending state.
        queue.folders[0].state = TransferState.Done;
        queue.folders[0].linkId = 'folderId';
        addItemToQueue(mockLogCallback, 'shareId', queue, { path: ['folder'], file: testFile('b.txt') });
        expect(queue.folders[0].files[1]).toMatchObject({
            meta: { filename: 'b.txt' },
            state: TransferState.Pending,
        });
    });
});
