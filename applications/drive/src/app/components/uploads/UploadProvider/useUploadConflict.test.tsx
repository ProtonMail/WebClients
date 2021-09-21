import { ReactNode } from 'react';
import { renderHook, act } from '@testing-library/react-hooks';

import { ModalsProvider } from '@proton/components';

// import { TransferConflictStrategy } from '../interface';
import { ConflictStrategyHandler, FileUpload, FolderUpload } from './interface';
import useUploadConflict from './useUploadConflict';

describe('useUploadConflict', () => {
    const mockUpdateState = jest.fn();
    const mockUpdateWithData = jest.fn();
    const cancelUploads = jest.fn();

    let hook: {
        current: {
            getFileConflictHandler: (id: string) => ConflictStrategyHandler;
        };
    };

    beforeEach(() => {
        mockUpdateState.mockClear();
        mockUpdateWithData.mockClear();
        cancelUploads.mockClear();

        const fileUploads: FileUpload[] = [];
        const folderUploads: FolderUpload[] = [];

        const wrapper = ({ children }: { children: ReactNode }) => <ModalsProvider>{children}</ModalsProvider>;
        const { result } = renderHook(
            () => useUploadConflict(fileUploads, folderUploads, mockUpdateState, mockUpdateWithData, cancelUploads),
            { wrapper }
        );
        hook = result;
    });

    it('aborts promise returned by file conflict handler', async () => {
        const abortController = new AbortController();
        await act(async () => {
            const conflictHandler = hook.current.getFileConflictHandler('id');
            const promise = conflictHandler(abortController.signal);
            abortController.abort();
            await expect(promise).rejects.toThrowError('Upload was canceled');
        });
    });

    /* it('waits and resolves in conflict strategy', async () => {
        const abortController = new AbortController();
        await act(async () => {
            const conflictHandler = hook.current.getFileConflictHandler('id');
            const promise = conflictHandler(abortController.signal);
            // TODO how to control modal?
            await expect(promise).resolves.toBe(TransferConflictStrategy.Rename);
        });
    }); */
});
