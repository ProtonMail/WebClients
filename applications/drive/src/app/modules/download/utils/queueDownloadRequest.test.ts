import { createMockNodeEntity } from '@proton/drive/modules/testing';

import { DownloadStatus, useDownloadManagerStore } from '../downloadManager.store';
import { queueAlbumDownloadRequest, queueDownloadRequest } from './queueDownloadRequest';

describe('queueDownloadRequest', () => {
    beforeEach(() => {
        useDownloadManagerStore.getState().clearQueue();
    });

    const baseParams = {
        requestedDownloads: new Map(),
        scheduleSingleFile: jest.fn(),
        scheduleArchive: jest.fn(),
        getArchiveName: () => 'archive.zip',
    };

    it('does not mark the item as having an approved signature issue when skipSignatureCheck is set on a single-file download', () => {
        const node = createMockNodeEntity({ uid: 'file-1' });

        const downloadId = queueDownloadRequest({
            ...baseParams,
            nodes: [node],
            isPhoto: false,
            skipSignatureCheck: true,
        });

        if (!downloadId) {
            throw new Error('Expected queueDownloadRequest to return a downloadId');
        }
        const item = useDownloadManagerStore.getState().getQueueItem(downloadId);
        expect(item?.signatureIssueAllDecision).toBeUndefined();
    });

    it('does not mark the item as having an approved signature issue when skipSignatureCheck is set on an archive download', () => {
        const nodes = [createMockNodeEntity({ uid: 'file-1' }), createMockNodeEntity({ uid: 'file-2' })];

        const downloadId = queueDownloadRequest({
            ...baseParams,
            nodes,
            isPhoto: false,
            skipSignatureCheck: true,
        });

        if (!downloadId) {
            throw new Error('Expected queueDownloadRequest to return a downloadId');
        }
        const item = useDownloadManagerStore.getState().getQueueItem(downloadId);
        expect(item?.signatureIssueAllDecision).toBeUndefined();
    });
});

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
