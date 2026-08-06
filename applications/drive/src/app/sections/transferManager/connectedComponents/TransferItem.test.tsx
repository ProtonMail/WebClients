import { act, fireEvent, render, screen } from '@testing-library/react';

import { UploadStatus } from '@proton/drive/modules/upload';

import { AbuseCategory } from '../../../modals/ReportAbuseModal';
import { DownloadManager } from '../../../modules/download/DownloadManager';
import {
    type DownloadItem,
    DownloadStatus,
    useDownloadManagerStore,
} from '../../../modules/download/downloadManager.store';
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
            category: AbuseCategory.Malware,
            comment: malwareInfo.message,
        });
    });
});

describe('TransferItem - integrity warning', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(DownloadManager.getInstance).mockReturnValue(mockDownloadManager as unknown as DownloadManager);
        act(() => {
            useDownloadManagerStore.getState().clearQueue();
        });
    });

    it('shows a warning label when an integrity issue was approved', () => {
        seedDownloadItem({ status: DownloadStatus.Finished });

        render(
            <TransferItem
                entry={createEntry({
                    status: DownloadStatus.Finished,
                    warningMessage: 'Data integrity check failed',
                })}
                cancelTransfer={jest.fn()}
                retryTransfer={jest.fn()}
            />
        );

        expect(screen.getByTestId('transfer-row:status').textContent).toBe('Downloaded');
        expect(screen.getByTestId('transfer-row:transferred-data').textContent).toBe('Data integrity check failed');
    });

    it('shows the normal success label when there is no integrity issue', () => {
        seedDownloadItem({ status: DownloadStatus.Finished });

        render(
            <TransferItem
                entry={createEntry({ status: DownloadStatus.Finished })}
                cancelTransfer={jest.fn()}
                retryTransfer={jest.fn()}
            />
        );

        expect(screen.getByTestId('transfer-row:status').textContent).toBe('Downloaded');
    });
});

describe('TransferItem - preparing state', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(DownloadManager.getInstance).mockReturnValue(mockDownloadManager as unknown as DownloadManager);
        act(() => {
            useDownloadManagerStore.getState().clearQueue();
        });
    });

    it('shows transferred bytes while preparing, same as a normal download', () => {
        seedDownloadItem({ status: DownloadStatus.Preparing, storageSize: undefined });

        render(
            <TransferItem
                entry={createEntry({
                    status: DownloadStatus.Preparing,
                    storageSize: undefined,
                    transferredBytes: 2048,
                })}
                cancelTransfer={jest.fn()}
                retryTransfer={jest.fn()}
            />
        );

        expect(screen.getByTestId('transfer-row:transferred-data').textContent).toContain('2 KB');
    });
});

describe('TransferItem - cancelled state', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(DownloadManager.getInstance).mockReturnValue(mockDownloadManager as unknown as DownloadManager);
        act(() => {
            useDownloadManagerStore.getState().clearQueue();
        });
    });

    it('does not show the size of an upload cancelled through its parent folder', () => {
        render(
            <TransferItem
                entry={createEntry({
                    id: 'upload-1',
                    type: 'upload',
                    name: 'tiny.txt',
                    status: UploadStatus.ParentCancelled,
                    transferredBytes: 0,
                    clearTextSize: 396,
                })}
                cancelTransfer={jest.fn()}
                retryTransfer={jest.fn()}
            />
        );

        expect(screen.getByTestId('transfer-row:status').textContent).toBe('Canceled');
        expect(screen.queryByTestId('transfer-row:transferred-data')).not.toBeInTheDocument();
    });
});
