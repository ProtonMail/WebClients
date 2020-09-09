import React, { useCallback, useEffect, useRef } from 'react';
import { useToggle, classnames, useElementRect } from 'react-components';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { buffer } from 'proton-shared/lib/helpers/function';
import { useDownloadProvider } from '../downloads/DownloadProvider';
import { useUploadProvider } from '../uploads/UploadProvider';
import Header from './Header';
import Transfer from './Transfer';
import { TransferState, Download, Upload } from '../../interfaces/transfer';
import { isTransferProgress } from '../../utils/transfer';
import { TransfersStats, TransferType, TransferStats } from './interfaces';

interface TransferListEntry<T extends TransferType> {
    transfer: T extends TransferType.Download ? Download : Upload;
    type: T;
}

const PROGRESS_UPDATE_INTERVAL = 500;
const SPEED_SNAPSHOTS = 10; // How many snapshots should the speed be average of
const ROW_HEIGHT_PX = 70;

enum TRANSFER_GROUP {
    ACTIVE,
    DONE,
    QUEUED,
}
const STATE_TO_GROUP_MAP = {
    [TransferState.Progress]: TRANSFER_GROUP.ACTIVE,
    [TransferState.Finalizing]: TRANSFER_GROUP.ACTIVE,
    [TransferState.Paused]: TRANSFER_GROUP.ACTIVE,
    [TransferState.Canceled]: TRANSFER_GROUP.ACTIVE,
    [TransferState.Done]: TRANSFER_GROUP.DONE,
    [TransferState.Error]: TRANSFER_GROUP.DONE,
    [TransferState.Initializing]: TRANSFER_GROUP.QUEUED,
    [TransferState.Pending]: TRANSFER_GROUP.QUEUED,
};

export const MAX_VISIBLE_TRANSFERS = 5;

type ListItemData = {
    sortedEntries: (TransferListEntry<TransferType.Download> | TransferListEntry<TransferType.Upload>)[];
    latestStats: TransfersStats;
    calculateAverageSpeed: (id: string) => number;
};

type ListItemRowProps = Omit<ListChildComponentProps, 'data'> & { data: ListItemData };

const ListItemRow = ({ style, index, data }: ListItemRowProps) => {
    const { calculateAverageSpeed, latestStats, sortedEntries } = data;
    const { transfer, type } = sortedEntries[index];

    return (
        <Transfer
            style={style}
            transfer={transfer}
            type={type}
            stats={{
                progress: latestStats.stats[transfer.id]?.progress ?? 0,
                speed: calculateAverageSpeed(transfer.id),
            }}
        />
    );
};

function TransferManager() {
    const containerRef = useRef<HTMLDivElement>(null);
    const rect = useElementRect(containerRef, buffer);
    const { state: minimized, toggle: toggleMinimized } = useToggle();
    const { downloads, getDownloadsProgresses, clearDownloads } = useDownloadProvider();
    const { uploads, getUploadsProgresses, clearUploads } = useUploadProvider();
    const [statsHistory, setStatsHistory] = React.useState<TransfersStats[]>([]);

    const getTransfer = useCallback(
        (id: string) => downloads.find((download) => download.id === id) || uploads.find((upload) => upload.id === id),
        [downloads, uploads]
    );

    const updateStats = () => {
        const timestamp = new Date();
        const progresses = { ...getUploadsProgresses(), ...getDownloadsProgresses() };

        setStatsHistory((prev) => {
            const lastStats = (id: string) => prev[0]?.stats[id] || {};
            const stats = Object.entries(progresses).reduce(
                (stats, [id, progress]) => ({
                    ...stats,
                    [id]: {
                        // get speed snapshot based on bytes downloaded since last update
                        speed: isTransferProgress(lastStats(id))
                            ? (progresses[id] - lastStats(id).progress) * (1000 / PROGRESS_UPDATE_INTERVAL)
                            : 0,
                        state: getTransfer(id)?.state ?? TransferState.Error,
                        progress,
                    },
                }),
                {} as { [id: string]: TransferStats }
            );

            return [{ stats, timestamp }, ...prev.slice(0, SPEED_SNAPSHOTS - 1)];
        });
    };

    useEffect(() => {
        updateStats();

        const uploading = uploads.filter(isTransferProgress);
        const downloading = downloads.filter(isTransferProgress);

        if (!uploading.length && !downloading.length) {
            return;
        }

        const int = setInterval(updateStats, PROGRESS_UPDATE_INTERVAL);

        return () => {
            clearInterval(int);
        };
    }, [uploads, downloads]);

    const latestStats = statsHistory[0];

    if (!latestStats || downloads.length + uploads.length === 0) {
        return null;
    }

    const handleCloseClick = () => {
        clearDownloads();
        clearUploads();
    };

    const calculateAverageSpeed = (id: string) => {
        let sum = 0;

        for (let i = 0; i < statsHistory.length; i++) {
            const stats = statsHistory[i].stats[id];

            if (stats?.state !== TransferState.Progress) {
                break; // Only take most recent progress (e.g. after pause)
            }
            sum += stats.speed;
        }

        return sum / statsHistory.length;
    };

    const getListEntry = <T extends TransferType>(type: T) => (
        transfer: T extends TransferType.Download ? Download : Upload
    ): TransferListEntry<T> => ({
        transfer,
        type,
    });

    const getDownloadListEntry = getListEntry(TransferType.Download);
    const getUploadListEntry = getListEntry(TransferType.Upload);

    const downloadEntries = downloads.map(getDownloadListEntry);
    const uploadEntries = uploads.map(getUploadListEntry);

    const sortedEntries = [...downloadEntries, ...uploadEntries].sort(
        (a, b) =>
            STATE_TO_GROUP_MAP[a.transfer.state] - STATE_TO_GROUP_MAP[b.transfer.state] ||
            b.transfer.startDate.getTime() - a.transfer.startDate.getTime()
    );

    return (
        <div className={classnames(['pd-transfers', minimized && 'pd-transfers--minimized'])}>
            <Header
                downloads={downloads}
                uploads={uploads}
                latestStats={latestStats}
                minimized={minimized}
                onToggleMinimize={toggleMinimized}
                onClose={handleCloseClick}
            />

            <div className="pd-transfers-list" ref={containerRef}>
                {rect && (
                    <FixedSizeList
                        className="no-outline"
                        itemData={{
                            sortedEntries,
                            latestStats,
                            calculateAverageSpeed,
                        }}
                        itemCount={sortedEntries.length}
                        itemSize={ROW_HEIGHT_PX}
                        height={ROW_HEIGHT_PX * Math.min(MAX_VISIBLE_TRANSFERS, sortedEntries.length)}
                        width={rect.width}
                        itemKey={(index, { sortedEntries }: ListItemData) => sortedEntries[index].transfer?.id ?? index}
                    >
                        {ListItemRow}
                    </FixedSizeList>
                )}
            </div>
        </div>
    );
}

export default TransferManager;
