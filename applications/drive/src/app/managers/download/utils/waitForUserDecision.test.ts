import { NodeType } from '@proton/drive/index';

import {
    type DownloadItem,
    DownloadStatus,
    IssueStatus,
    type SignatureIssue,
    useDownloadManagerStore,
} from '../../../zustand/download/downloadManager.store';
import { waitForSignatureIssueDecision, waitForUnsupportedFileDecision } from './waitForUserDecision';

const DECISION_TIMEOUT = 1500;

const createDownloadItem = (overrides: Partial<DownloadItem> = {}): DownloadItem => ({
    downloadId: overrides.downloadId ?? 'download-id',
    name: overrides.name ?? 'file.txt',
    storageSize: overrides.storageSize ?? 10,
    thumbnailUrl: overrides.thumbnailUrl,
    error: overrides.error,
    speedBytesPerSecond: overrides.speedBytesPerSecond,
    status: overrides.status ?? DownloadStatus.Pending,
    nodeUids: overrides.nodeUids ?? [],
    downloadedBytes: overrides.downloadedBytes ?? 0,
    malwareDetected: overrides.malwareDetected,
    unsupportedFileDetected: overrides.unsupportedFileDetected,
    signatureIssues: overrides.signatureIssues,
    signatureIssueAllDecision: overrides.signatureIssueAllDecision,
    lastStatusUpdateTime: overrides.lastStatusUpdateTime ?? new Date(),
    isPhoto: overrides.isPhoto,
});

const seedDownloadItem = (item: DownloadItem) => {
    useDownloadManagerStore.setState((state) => {
        const queue = new Map(state.queue);
        queue.set(item.downloadId, item);
        const queueIds = new Set(state.queueIds);
        queueIds.add(item.downloadId);
        return { ...state, queue, queueIds };
    });
};

const updateDownloadItem = (downloadId: string, updater: (item: DownloadItem) => DownloadItem) => {
    useDownloadManagerStore.setState((state) => {
        const existing = state.queue.get(downloadId);
        if (!existing) {
            return state;
        }
        const queue = new Map(state.queue);
        queue.set(downloadId, updater(existing));
        return { ...state, queue };
    });
};

const advanceTimers = async () => {
    jest.advanceTimersByTime(DECISION_TIMEOUT);
    await Promise.resolve();
};

describe('waitForUserDecision', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        useDownloadManagerStore.getState().clearQueue();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('resolves waitForUnsupportedDecision when download is approved', async () => {
        const downloadId = 'unsupported-download';
        seedDownloadItem(
            createDownloadItem({
                downloadId,
                unsupportedFileDetected: IssueStatus.Detected,
            })
        );

        const onSuccess = jest.fn();
        const decisionPromise = waitForUnsupportedFileDecision(downloadId, onSuccess);

        updateDownloadItem(downloadId, (item) => ({
            ...item,
            unsupportedFileDetected: IssueStatus.Approved,
        }));
        await advanceTimers();

        await expect(decisionPromise).resolves.toBe(IssueStatus.Approved);
        expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('polls signature issues until the user decides', async () => {
        const downloadId = 'signature-download';
        const issueName = 'photo.jpg';
        const signatureIssue: SignatureIssue = {
            name: issueName,
            nodeType: NodeType.File,
            location: 'manifest',
            issueStatus: IssueStatus.Detected,
        };

        seedDownloadItem(
            createDownloadItem({
                downloadId,
                signatureIssues: {
                    [issueName]: signatureIssue,
                },
            })
        );

        const decisionPromise = waitForSignatureIssueDecision(downloadId, issueName);

        // Still detected -> promise should remain pending
        await advanceTimers();
        let resolved = false;
        void decisionPromise.then(() => {
            resolved = true;
        });
        expect(resolved).toBe(false);
        updateDownloadItem(downloadId, (item) => {
            const currentIssue = item.signatureIssues?.[issueName];
            if (!currentIssue) {
                throw new Error('Signature issue missing in test setup');
            }
            return {
                ...item,
                signatureIssues: {
                    ...(item.signatureIssues ?? {}),
                    [issueName]: {
                        ...currentIssue,
                        issueStatus: IssueStatus.Rejected,
                    },
                },
            };
        });

        await advanceTimers();

        await expect(decisionPromise).resolves.toBe(IssueStatus.Rejected);
    });
});
