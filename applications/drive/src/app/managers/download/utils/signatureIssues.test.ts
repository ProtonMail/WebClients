import type { UnverifiedAuthorError } from '@protontech/drive-sdk';

import { type NodeEntity, NodeType } from '@proton/drive/index';

import {
    type DownloadItem,
    DownloadStatus,
    IssueStatus,
    useDownloadManagerStore,
} from '../../../zustand/download/downloadManager.store';
import { addAndWaitForManifestIssueDecision, addAndWaitForMetadataIssueDecision } from './signatureIssues';
import { waitForSignatureIssueDecision } from './waitForUserDecision';

jest.mock('./waitForUserDecision');

const mockWaitForSignatureIssueDecision = waitForSignatureIssueDecision as jest.MockedFunction<
    typeof waitForSignatureIssueDecision
>;

const makeItem = (overrides: Partial<DownloadItem> = {}): DownloadItem => ({
    downloadId: overrides.downloadId ?? 'download-id',
    name: overrides.name ?? 'file.txt',
    storageSize: 10,
    status: DownloadStatus.InProgress,
    nodeUids: [],
    downloadedBytes: 0,
    lastStatusUpdateTime: new Date(),
    ...overrides,
});

const seedItem = (item: DownloadItem) => {
    useDownloadManagerStore.setState((state) => {
        const queue = new Map(state.queue);
        queue.set(item.downloadId, item);
        const queueIds = new Set(state.queueIds);
        queueIds.add(item.downloadId);
        return { ...state, queue, queueIds };
    });
};

const makeNode = (name: string): NodeEntity =>
    ({
        name,
        type: NodeType.File,
        nameAuthor: { ok: true, value: 'alice@proton.me' },
    }) as unknown as NodeEntity;

describe('signatureIssues', () => {
    beforeEach(() => {
        useDownloadManagerStore.getState().clearQueue();
        mockWaitForSignatureIssueDecision.mockReset();
        mockWaitForSignatureIssueDecision.mockReturnValue(new Promise(() => {}));
    });

    describe('addAndWaitForManifestIssueDecision', () => {
        it('should short-circuit with Approved when signatureIssueAllDecision is Approved', async () => {
            const downloadId = 'dl-1';
            seedItem(makeItem({ downloadId, signatureIssueAllDecision: IssueStatus.Approved }));

            await expect(addAndWaitForManifestIssueDecision(downloadId, makeNode('a.txt'))).resolves.toBe(
                IssueStatus.Approved
            );
            expect(mockWaitForSignatureIssueDecision).not.toHaveBeenCalled();
            expect(useDownloadManagerStore.getState().getQueueItem(downloadId)?.signatureIssues).toBeUndefined();
        });

        it('should short-circuit with Rejected when signatureIssueAllDecision is Rejected', async () => {
            const downloadId = 'dl-2';
            seedItem(makeItem({ downloadId, signatureIssueAllDecision: IssueStatus.Rejected }));

            await expect(addAndWaitForManifestIssueDecision(downloadId, makeNode('b.txt'))).resolves.toBe(
                IssueStatus.Rejected
            );
            expect(mockWaitForSignatureIssueDecision).not.toHaveBeenCalled();
            expect(useDownloadManagerStore.getState().getQueueItem(downloadId)?.signatureIssues).toBeUndefined();
        });

        it('should fall through to polling when no blanket decision is set', () => {
            const downloadId = 'dl-3';
            seedItem(makeItem({ downloadId }));

            void addAndWaitForManifestIssueDecision(downloadId, makeNode('c.txt'));

            expect(mockWaitForSignatureIssueDecision).toHaveBeenCalledWith(downloadId, 'c.txt');
            expect(
                useDownloadManagerStore.getState().getQueueItem(downloadId)?.signatureIssues?.['c.txt']
            ).toBeDefined();
        });
    });

    describe('addAndWaitForMetadataIssueDecision', () => {
        const error = { error: 'unverified author' } as UnverifiedAuthorError;

        it('should short-circuit with Approved when signatureIssueAllDecision is Approved', async () => {
            const downloadId = 'dl-4';
            seedItem(makeItem({ downloadId, signatureIssueAllDecision: IssueStatus.Approved }));

            await expect(addAndWaitForMetadataIssueDecision(downloadId, makeNode('d.txt'), error)).resolves.toBe(
                IssueStatus.Approved
            );
            expect(mockWaitForSignatureIssueDecision).not.toHaveBeenCalled();
            expect(useDownloadManagerStore.getState().getQueueItem(downloadId)?.signatureIssues).toBeUndefined();
        });

        it('should short-circuit with Rejected when signatureIssueAllDecision is Rejected', async () => {
            const downloadId = 'dl-5';
            seedItem(makeItem({ downloadId, signatureIssueAllDecision: IssueStatus.Rejected }));

            await expect(addAndWaitForMetadataIssueDecision(downloadId, makeNode('e.txt'), error)).resolves.toBe(
                IssueStatus.Rejected
            );
            expect(mockWaitForSignatureIssueDecision).not.toHaveBeenCalled();
            expect(useDownloadManagerStore.getState().getQueueItem(downloadId)?.signatureIssues).toBeUndefined();
        });

        it('should fall through to polling when no blanket decision is set', () => {
            const downloadId = 'dl-6';
            seedItem(makeItem({ downloadId }));

            void addAndWaitForMetadataIssueDecision(downloadId, makeNode('f.txt'), error);

            expect(mockWaitForSignatureIssueDecision).toHaveBeenCalledWith(downloadId, 'f.txt');
            expect(
                useDownloadManagerStore.getState().getQueueItem(downloadId)?.signatureIssues?.['f.txt']
            ).toBeDefined();
        });
    });
});
