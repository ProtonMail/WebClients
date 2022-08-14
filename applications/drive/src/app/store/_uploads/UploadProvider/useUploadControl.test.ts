import { act, renderHook } from '@testing-library/react-hooks';

import { FILE_CHUNK_SIZE } from '@proton/shared/lib/drive/constants';

import { TransferState } from '../../../components/TransferManager/transfer';
import { mockGlobalFile, testFile } from '../../../utils/test/file';
import { MAX_BLOCKS_PER_UPLOAD } from '../constants';
import { UploadFileControls, UploadFolderControls } from '../interface';
import { FileUpload, UpdateFilter } from './interface';
import useUploadControl from './useUploadControl';

function makeFileUpload(id: string, state: TransferState, filename: string, size = 2 * FILE_CHUNK_SIZE): FileUpload {
    const file = testFile(filename, size);
    return {
        id,
        shareId: 'shareId',
        startDate: new Date(),
        state,
        file,
        meta: {
            filename: file.name,
            mimeType: file.type,
            size: file.size,
        },
    };
}

describe('useUploadControl', () => {
    const mockUpdateWithCallback = jest.fn();
    const mockRemoveFromQueue = jest.fn();
    const mockClearQueue = jest.fn();

    let hook: {
        current: {
            add: (id: string, uploadControls: UploadFileControls | UploadFolderControls) => void;
            remove: (id: string) => void;
            updateProgress: (id: string, increment: number) => void;
            calculateRemainingUploadBytes: () => number;
            calculateFileUploadLoad: () => number;
            pauseUploads: (idOrFilter: UpdateFilter) => void;
            resumeUploads: (idOrFilter: UpdateFilter) => void;
            cancelUploads: (idOrFilter: UpdateFilter) => void;
            removeUploads: (idOrFilter: UpdateFilter) => void;
        };
    };

    beforeEach(() => {
        mockUpdateWithCallback.mockClear();
        mockRemoveFromQueue.mockClear();
        mockClearQueue.mockClear();

        mockGlobalFile();

        const fileUploads: FileUpload[] = [
            makeFileUpload('init', TransferState.Initializing, 'init.txt'),
            makeFileUpload('pending', TransferState.Pending, 'pending.txt'),
            makeFileUpload('progress', TransferState.Progress, 'progress.txt', 2 * FILE_CHUNK_SIZE + 42),
            makeFileUpload('empty', TransferState.Progress, 'empty.txt', 0),
            makeFileUpload('big', TransferState.Progress, 'big.txt', 100 * FILE_CHUNK_SIZE),
            makeFileUpload('done', TransferState.Done, 'done.txt'),
        ];

        const { result } = renderHook(() =>
            useUploadControl(fileUploads, mockUpdateWithCallback, mockRemoveFromQueue, mockClearQueue)
        );
        hook = result;
    });

    it('calculates remaining upload bytes', () => {
        const controls = { start: jest.fn(), cancel: jest.fn() };
        act(() => {
            hook.current.add('progress', controls);
            hook.current.updateProgress('progress', FILE_CHUNK_SIZE);
            hook.current.updateProgress('progress', 47);
            hook.current.updateProgress('progress', -5);
            expect(hook.current.calculateRemainingUploadBytes()).toBe(
                // 2 init + 2 pending + 1 progress (+42 extra) + 100 big
                105 * FILE_CHUNK_SIZE + 42
            );
        });
    });

    it('calculates file upload load', () => {
        const controls = { start: jest.fn(), cancel: jest.fn() };
        act(() => {
            hook.current.add('progress', controls);
            hook.current.updateProgress('progress', FILE_CHUNK_SIZE);
            expect(hook.current.calculateFileUploadLoad()).toBe(
                // progress (3 - 1 done) + empty (always at least one) + big (max MAX_BLOCKS_PER_UPLOAD)
                2 + 1 + MAX_BLOCKS_PER_UPLOAD
            );
        });
    });
});
