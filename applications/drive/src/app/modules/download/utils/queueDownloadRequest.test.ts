import { DownloadStatus, useDownloadManagerStore } from '../downloadManager.store';
import { queueAlbumDownloadRequest } from './queueDownloadRequest';

describe('queueAlbumDownloadRequest', () => {
    beforeEach(() => {
        useDownloadManagerStore.getState().clearQueue();
    });

    it('names the archive after the album when albumName is set', () => {
        const requestedDownloads = new Map();
        const scheduleArchive = jest.fn();

        const downloadId = queueAlbumDownloadRequest({
            albumUid: 'album-1',
            albumName: 'Summer trip',
            requestedDownloads,
            scheduleArchive,
        });

        const item = useDownloadManagerStore.getState().getQueueItem(downloadId);
        expect(item?.name).toBe('Summer trip.zip');
        expect(item?.status).toBe(DownloadStatus.Preparing);
        expect(item?.nodeUids).toEqual(['album-1']);
        expect(requestedDownloads.get(downloadId)).toEqual({ albumUid: 'album-1', albumName: 'Summer trip' });
        expect(scheduleArchive).toHaveBeenCalledWith(downloadId);
    });

    it.each(['', '   '])('falls back to a generic album name when albumName is %p', (albumName) => {
        const downloadId = queueAlbumDownloadRequest({
            albumUid: 'album-1',
            albumName,
            requestedDownloads: new Map(),
            scheduleArchive: jest.fn(),
        });

        const item = useDownloadManagerStore.getState().getQueueItem(downloadId);
        expect(item?.name).toBe('Album.zip');
    });
});
