import { DownloadStatus, useDownloadManagerStore } from '../downloadManager.store';
import { handleDownloadError } from './handleError';

jest.mock('@proton/drive/legacy/errorHandling', () => ({
    ...jest.requireActual('@proton/drive/legacy/errorHandling'),
    sendErrorReport: jest.fn(),
}));

describe('handleDownloadError', () => {
    const addItem = () =>
        useDownloadManagerStore.getState().addDownloadItem({
            name: 'archive.zip',
            storageSize: 100,
            status: DownloadStatus.InProgress,
            nodeUids: ['node-uid'],
            downloadedBytes: 0,
        });
    const getError = (downloadId: string) => useDownloadManagerStore.getState().getQueueItem(downloadId)?.error;

    it('should show a short message for storage quota errors', () => {
        const downloadId = addItem();

        handleDownloadError(
            downloadId,
            [],
            new DOMException(
                'The operation failed because it would cause the application to exceed its storage quota.',
                'QuotaExceededError'
            )
        );

        expect(getError(downloadId)?.message).toBe('Not enough browser storage');
    });
});
