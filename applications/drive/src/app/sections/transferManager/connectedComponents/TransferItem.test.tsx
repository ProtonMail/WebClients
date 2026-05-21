import { act, fireEvent, render, screen } from '@testing-library/react';

import {
    type DownloadItem,
    DownloadStatus,
    useDownloadManagerStore,
} from '../../../legacy/zustand/download/downloadManager.store';
import { AbuseCategoryType } from '../../../modals/ReportAbuseModal';
import { DownloadManager } from '../../../modules/download/DownloadManager';
import type { TransferManagerEntry } from '../useTransferManagerState';
import { TransferItem } from './TransferItem';

jest.mock('../../../modules/download/DownloadManager', () => ({
    DownloadManager: {
        getInstance: jest.fn(),
    },
}));

const REPORT_BUTTON_TEST_ID = 'drive-transfers-manager:item-controls-report';
const DOWNLOAD_ANYWAY_BUTTON_TEST_ID = 'drive-transfers-manager:item-controls-download-anyway';

const mockDownloadManager = {
    setMalawareDecision: jest.fn(),
};

const malwareInfo = {
    uid: 'node-uid-1',
    name: 'evil.exe',
    mediaType: 'application/octet-stream',
    size: 1024,
    message: 'Suspicious payload detected',
};

const seedDownloadItem = (overrides: Partial<DownloadItem> = {}): DownloadItem => {
    const item: DownloadItem = {
        downloadId: 'download-1',
        name: 'evil.exe',
        status: DownloadStatus.MalwareDetected,
        downloadedBytes: 0,
        storageSize: 1024,
        thumbnailUrl: undefined,
        error: undefined,
        speedBytesPerSecond: 0,
        nodeUids: [],
        malwareDetectionStatus: undefined,
        malwareInfo,
        lastStatusUpdateTime: new Date(),
        ...overrides,
    };
    act(() => {
        useDownloadManagerStore.setState((state) => {
            const queue = new Map(state.queue);
            const queueIds = new Set(state.queueIds);
            queue.set(item.downloadId, item);
            queueIds.add(item.downloadId);
            return { ...state, queue, queueIds };
        });
    });
    return item;
};

const createEntry = (overrides: Partial<TransferManagerEntry> = {}): TransferManagerEntry =>
    ({
        id: 'download-1',
        type: 'download',
        name: 'evil.exe',
        status: DownloadStatus.MalwareDetected,
        transferredBytes: 0,
        storageSize: 1024,
        lastStatusUpdateTime: new Date(),
        malwareDetectionStatus: undefined,
        ...overrides,
    }) as TransferManagerEntry;

describe('TransferItem - malware report button', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(DownloadManager.getInstance).mockReturnValue(mockDownloadManager as unknown as DownloadManager);
        act(() => {
            useDownloadManagerStore.getState().clearQueue();
        });
    });

    it('renders the report button when status is MalwareDetected and onReportAbuse is provided', () => {
        seedDownloadItem({ status: DownloadStatus.MalwareDetected });
        const onReportAbuse = jest.fn();

        render(
            <TransferItem
                entry={createEntry({ status: DownloadStatus.MalwareDetected })}
                cancelTransfer={jest.fn()}
                retryTransfer={jest.fn()}
                onReportAbuse={onReportAbuse}
            />
        );

        expect(screen.getByTestId(REPORT_BUTTON_TEST_ID)).toBeInTheDocument();
        expect(screen.getByTestId(DOWNLOAD_ANYWAY_BUTTON_TEST_ID)).toBeInTheDocument();
    });

    it('does not render the report button when status is MalwareScanUnavailable', () => {
        seedDownloadItem({ status: DownloadStatus.MalwareScanUnavailable });
        const onReportAbuse = jest.fn();

        render(
            <TransferItem
                entry={createEntry({ status: DownloadStatus.MalwareScanUnavailable })}
                cancelTransfer={jest.fn()}
                retryTransfer={jest.fn()}
                onReportAbuse={onReportAbuse}
            />
        );

        expect(screen.queryByTestId(REPORT_BUTTON_TEST_ID)).not.toBeInTheDocument();
        // The "Download anyway" button should still appear for unavailable scans
        expect(screen.getByTestId(DOWNLOAD_ANYWAY_BUTTON_TEST_ID)).toBeInTheDocument();
    });

    it('does not render the report button when onReportAbuse is not provided', () => {
        seedDownloadItem({ status: DownloadStatus.MalwareDetected });

        render(
            <TransferItem
                entry={createEntry({ status: DownloadStatus.MalwareDetected })}
                cancelTransfer={jest.fn()}
                retryTransfer={jest.fn()}
            />
        );

        expect(screen.queryByTestId(REPORT_BUTTON_TEST_ID)).not.toBeInTheDocument();
        expect(screen.getByTestId(DOWNLOAD_ANYWAY_BUTTON_TEST_ID)).toBeInTheDocument();
    });

    it('does not render the report button for non-malware statuses', () => {
        seedDownloadItem({ status: DownloadStatus.Failed });
        const onReportAbuse = jest.fn();

        render(
            <TransferItem
                entry={createEntry({ status: DownloadStatus.Failed })}
                cancelTransfer={jest.fn()}
                retryTransfer={jest.fn()}
                onReportAbuse={onReportAbuse}
            />
        );

        expect(screen.queryByTestId(REPORT_BUTTON_TEST_ID)).not.toBeInTheDocument();
        expect(screen.queryByTestId(DOWNLOAD_ANYWAY_BUTTON_TEST_ID)).not.toBeInTheDocument();
    });

    it('calls onReportAbuse with malware info when the report button is clicked', () => {
        seedDownloadItem({ status: DownloadStatus.MalwareDetected });
        const onReportAbuse = jest.fn();

        render(
            <TransferItem
                entry={createEntry({ status: DownloadStatus.MalwareDetected })}
                cancelTransfer={jest.fn()}
                retryTransfer={jest.fn()}
                onReportAbuse={onReportAbuse}
            />
        );

        fireEvent.click(screen.getByTestId(REPORT_BUTTON_TEST_ID));

        expect(onReportAbuse).toHaveBeenCalledWith(malwareInfo.uid, {
            category: AbuseCategoryType.Malware,
            comment: malwareInfo.message,
        });
    });
});
