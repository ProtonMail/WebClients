import { ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react-hooks';

import { ModalsProvider } from '@proton/components';
import { TransferState } from '@proton/shared/lib/interfaces/drive/transfer';

import { mockGlobalFile, testFile } from '../../../utils/test/file';
import { TransferConflictStrategy } from '../interface';
import { FileUpload, FolderUpload } from './interface';
import useUploadConflict from './useUploadConflict';

const mockCreateModal = jest.fn();
jest.mock('@proton/components/hooks/useModals.ts', () => {
    const useModals = () => {
        return {
            createModal: mockCreateModal,
        };
    };
    return useModals;
});

describe('useUploadConflict', () => {
    const mockConflictModal = jest.fn();
    const mockUpdateState = jest.fn();
    const mockUpdateWithData = jest.fn();
    const mockCancelUploads = jest.fn();

    let abortController: AbortController;

    const renderConflict = () => {
        const fileUploads: FileUpload[] = ['file1', 'file2'].map((id) => ({
            id,
            shareId: 'shareId',
            startDate: new Date(),
            state: TransferState.Conflict,
            file: testFile(`${id}.txt`),
            meta: {
                filename: `${id}.txt`,
                mimeType: 'txt',
            },
        }));
        const folderUploads: FolderUpload[] = [];
        const wrapper = ({ children }: { children: ReactNode }) => <ModalsProvider>{children}</ModalsProvider>;
        const { result } = renderHook(
            () =>
                useUploadConflict(
                    mockConflictModal,
                    fileUploads,
                    folderUploads,
                    mockUpdateState,
                    mockUpdateWithData,
                    mockCancelUploads
                ),
            { wrapper }
        );
        return result;
    };

    beforeEach(() => {
        mockGlobalFile();

        mockCreateModal.mockClear();
        mockUpdateState.mockClear();
        mockUpdateWithData.mockClear();
        mockCancelUploads.mockClear();

        abortController = new AbortController();
    });

    it('aborts promise returned by file conflict handler', async () => {
        const hook = renderConflict();
        await act(async () => {
            const conflictHandler = hook.current.getFileConflictHandler('file1');
            const promise = conflictHandler(abortController.signal);
            expect(mockUpdateWithData.mock.calls).toMatchObject([
                ['file1', 'conflict', { originalIsFolder: undefined }],
            ]);
            abortController.abort();
            await expect(promise).rejects.toThrowError('Upload was canceled');
        });
    });

    it('waits and resolves in conflict strategy for one', async () => {
        mockCreateModal.mockImplementation(({ props }) => {
            props.apply(TransferConflictStrategy.Rename, false);
        });
        const hook = renderConflict();
        await act(async () => {
            const conflictHandler = hook.current.getFileConflictHandler('file1');
            const promise = conflictHandler(abortController.signal);
            await expect(promise).resolves.toBe(TransferConflictStrategy.Rename);

            expect(mockUpdateState.mock.calls.length).toBe(1);
            expect(mockUpdateState.mock.calls[0][0]).toBe('file1');
            expect(mockCancelUploads.mock.calls.length).toBe(0);
        });
    });

    it('waits and resolves in conflict strategy for all', async () => {
        mockCreateModal.mockImplementation(({ props }) => {
            props.apply(TransferConflictStrategy.Rename, true);
        });
        const hook = renderConflict();
        await act(async () => {
            const conflictHandler1 = hook.current.getFileConflictHandler('file1');
            const promise1 = conflictHandler1(abortController.signal);
            await expect(promise1).resolves.toBe(TransferConflictStrategy.Rename);

            expect(mockUpdateState.mock.calls.length).toBe(1);
            expect(mockUpdateState.mock.calls[0][0]).not.toBe('file1'); // It is dynamic function check later.
            expect(mockCancelUploads.mock.calls.length).toBe(0);

            const conflictHandler2 = hook.current.getFileConflictHandler('file2');
            const promise2 = conflictHandler2(abortController.signal);
            await expect(promise2).resolves.toBe(TransferConflictStrategy.Rename);

            // Only conflicting files are updated for file resolver.
            const updateState = mockUpdateState.mock.calls[0][0];
            [
                [TransferState.Conflict, testFile('a.txt'), true],
                [TransferState.Conflict, undefined, false],
                [TransferState.Progress, testFile('a.txt'), false],
                [TransferState.Progress, undefined, false],
            ].forEach(([state, file, expectedResult]) => {
                expect(updateState({ state, file })).toBe(expectedResult);
            });
        });
    });

    it('waits and cancels all uploads', async () => {
        mockCreateModal.mockImplementation(({ props }) => {
            props.cancelAll();
        });
        const hook = renderConflict();
        await act(async () => {
            const conflictHandler1 = hook.current.getFileConflictHandler('file1');
            const promise1 = conflictHandler1(abortController.signal);
            await expect(promise1).resolves.toBe(TransferConflictStrategy.Skip);

            const conflictHandler2 = hook.current.getFileConflictHandler('file2');
            const promise2 = conflictHandler2(abortController.signal);
            await expect(promise2).resolves.toBe(TransferConflictStrategy.Skip);

            expect(mockUpdateState.mock.calls.length).toBe(0);
            expect(mockCancelUploads.mock.calls.length).toBe(1);
        });
    });
});
