import { renderHook } from '@testing-library/react';

import { useConfirmActionModal } from '@proton/components';
import { uploadManager } from '@proton/drive/modules/upload';

import { DownloadManager } from '../../managers/download/DownloadManager';
import { useSharingModal } from '../../modals/SharingModal/SharingModal';
import { BaseTransferStatus } from '../../zustand/download/downloadManager.store';
import { useTransferManagerActions } from './useTransferManagerActions';
import type { TransferManagerEntry } from './useTransferManagerState';

jest.mock('@proton/components', () => {
    return {
        useConfirmActionModal: jest.fn(),
    };
});

jest.mock('../../managers/download/DownloadManager', () => {
    return {
        DownloadManager: {
            getInstance: jest.fn(),
        },
    };
});

jest.mock('@proton/drive/modules/upload', () => {
    return {
        ...jest.requireActual('@proton/drive/modules/upload'),
        uploadManager: {
            cancelUpload: jest.fn(),
            retryUpload: jest.fn(),
        },
        useUploadQueueStore: jest.fn((selector) => {
            return selector({
                getItem: jest.fn(),
                clearQueue: jest.fn(),
                queue: new Map(),
            });
        }),
    };
});

jest.mock('../../modals/SharingModal/SharingModal', () => {
    return {
        useSharingModal: jest.fn(),
    };
});

jest.mock('../../zustand/download/downloadManager.store', () => {
    return {
        ...jest.requireActual('../../zustand/download/downloadManager.store'),
        useDownloadManagerStore: jest.fn((selector) => {
            return selector({
                clearQueue: jest.fn(),
                updateDownloadItem: jest.fn(),
                getQueueItem: jest.fn(),
            });
        }),
    };
});

const mockShowConfirmModal = jest.fn();
const mockConfirmModal = <div>Confirm Modal</div>;
const mockSharingModal = <div>Sharing Modal</div>;
const mockShowSharingModal = jest.fn();
const mockDownloadManager = {
    cancel: jest.fn(),
    retry: jest.fn(),
} as any;

const createMockEntry = (
    type: 'upload' | 'download',
    status: BaseTransferStatus,
    id: string = 'test-id'
): TransferManagerEntry => {
    if (type === 'download') {
        return {
            id,
            type: 'download',
            status,
            name: `Test ${type}`,
            transferredBytes: 0,
            storageSize: 100,
            lastStatusUpdateTime: new Date(),
            malwareDetectionStatus: undefined,
        };
    }
    return {
        id,
        type: 'upload',
        status,
        name: `Test ${type}`,
        transferredBytes: 0,
        clearTextSize: 100,
        lastStatusUpdateTime: new Date(),
    };
};

describe('useTransferManagerActions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(useConfirmActionModal).mockReturnValue([mockConfirmModal, mockShowConfirmModal]);
        jest.mocked(useSharingModal).mockReturnValue({
            sharingModal: mockSharingModal,
            showSharingModal: mockShowSharingModal,
        });
        jest.mocked(DownloadManager.getInstance).mockReturnValue(mockDownloadManager);
    });

    describe('cancelAll', () => {
        it('should show correct modal for downloads only', () => {
            const { result } = renderHook(() => useTransferManagerActions());

            const entries = [
                createMockEntry('download', BaseTransferStatus.InProgress, 'download-1'),
                createMockEntry('download', BaseTransferStatus.Pending, 'download-2'),
            ];

            result.current.cancelAll(entries);

            expect(mockShowConfirmModal).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Cancel all downloads?',
                    submitText: 'Cancel downloads',
                    message: 'This will cancel any remaining downloads.',
                })
            );
        });

        it('should show correct modal for uploads only', () => {
            const { result } = renderHook(() => useTransferManagerActions());

            const entries = [
                createMockEntry('upload', BaseTransferStatus.InProgress, 'upload-1'),
                createMockEntry('upload', BaseTransferStatus.Pending, 'upload-2'),
            ];

            result.current.cancelAll(entries);

            expect(mockShowConfirmModal).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Cancel all uploads?',
                    submitText: 'Cancel uploads',
                    message: expect.stringContaining('This will cancel any remaining uploads'),
                })
            );
        });

        it('should show correct modal for both downloads and uploads', () => {
            const { result } = renderHook(() => useTransferManagerActions());

            const entries = [
                createMockEntry('download', BaseTransferStatus.InProgress, 'download-1'),
                createMockEntry('upload', BaseTransferStatus.Pending, 'upload-1'),
            ];

            result.current.cancelAll(entries);

            expect(mockShowConfirmModal).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Cancel all transfers?',
                    submitText: 'Cancel transfers',
                    message: expect.stringContaining('This will cancel any remaining uploads and downloads'),
                })
            );
        });

        it('should only count non-finished and non-cancelled transfers', () => {
            const { result } = renderHook(() => useTransferManagerActions());

            const entries = [
                createMockEntry('download', BaseTransferStatus.Finished, 'download-1'),
                createMockEntry('download', BaseTransferStatus.Cancelled, 'download-2'),
                createMockEntry('upload', BaseTransferStatus.InProgress, 'upload-1'),
            ];

            result.current.cancelAll(entries);

            expect(mockShowConfirmModal).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Cancel all uploads?',
                    submitText: 'Cancel uploads',
                })
            );
        });

        it('should call cancelTransfer for pending and in-progress entries on submit', async () => {
            const { result } = renderHook(() => useTransferManagerActions());

            const entries = [
                createMockEntry('download', BaseTransferStatus.InProgress, 'download-1'),
                createMockEntry('upload', BaseTransferStatus.Pending, 'upload-1'),
                createMockEntry('download', BaseTransferStatus.Finished, 'download-2'),
            ];

            result.current.cancelAll(entries);

            const onSubmit = mockShowConfirmModal.mock.calls[0][0].onSubmit;
            await onSubmit();

            expect(mockDownloadManager.cancel).toHaveBeenCalledWith(['download-1']);
            expect(uploadManager.cancelUpload).toHaveBeenCalledWith('upload-1');
            expect(mockDownloadManager.cancel).not.toHaveBeenCalledWith(['download-2']);
        });
    });

    describe('cancelTransfer', () => {
        it('should cancel download transfer', () => {
            const { result } = renderHook(() => useTransferManagerActions());

            const entry = createMockEntry('download', BaseTransferStatus.InProgress);
            result.current.cancelTransfer(entry);

            expect(mockDownloadManager.cancel).toHaveBeenCalledWith(['test-id']);
        });

        it('should cancel upload transfer', () => {
            const { result } = renderHook(() => useTransferManagerActions());

            const entry = createMockEntry('upload', BaseTransferStatus.InProgress);
            result.current.cancelTransfer(entry);

            expect(uploadManager.cancelUpload).toHaveBeenCalledWith('test-id');
        });
    });

    describe('retryFailedTransfers', () => {
        it('should retry only failed transfers', () => {
            const { result } = renderHook(() => useTransferManagerActions());

            const entries = [
                createMockEntry('download', BaseTransferStatus.Failed, 'download-1'),
                createMockEntry('upload', BaseTransferStatus.Failed, 'upload-1'),
                createMockEntry('download', BaseTransferStatus.InProgress, 'download-2'),
            ];

            result.current.retryFailedTransfers(entries);

            expect(mockDownloadManager.retry).toHaveBeenCalledWith(['download-1']);
            expect(uploadManager.retryUpload).toHaveBeenCalledWith('upload-1');
            expect(mockDownloadManager.retry).toHaveBeenCalledTimes(1);
            expect(uploadManager.retryUpload).toHaveBeenCalledTimes(1);
        });
    });
});
