import React, { useCallback, useEffect, useRef } from 'react';
import { useToggle, classnames } from 'react-components';
import { AutoSizer, List, ListRowRenderer, CellMeasurer, CellMeasurerCache } from 'react-virtualized';
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
export const MAX_VISIBLE_TRANSFERS = 5;

function TransferManager() {
    const cellMeasurerCache = useRef(new CellMeasurerCache({ fixedWidth: true, defaultHeight: 70 }));
    const { state: minimized, toggle: toggleMinimized } = useToggle();
    const { downloads, getDownloadsProgresses, clearDownloads } = useDownloadProvider();
    const { uploads, getUploadsProgresses, clearUploads } = useUploadProvider();
    const [statsHistory, setStatsHistory] = React.useState<TransfersStats[]>([]);
    const listRef = useRef<List>(null);

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
        (a, b) => b.transfer.startDate.getTime() - a.transfer.startDate.getTime()
    );

    const rowRenderer: ListRowRenderer = ({ index, style, parent }) => {
        const { transfer, type } = sortedEntries[index];
        return (
            // Row index 0 because rows are equal in size, we only need to calculate first one (in case of font scaling)
            <CellMeasurer key={transfer.id} cache={cellMeasurerCache.current} parent={parent} rowIndex={0}>
                <Transfer
                    style={style}
                    transfer={transfer}
                    type={type}
                    stats={{
                        progress: latestStats.stats[transfer.id]?.progress ?? 0,
                        speed: calculateAverageSpeed(transfer.id),
                    }}
                />
            </CellMeasurer>
        );
    };

    const estimatedRowHeight = cellMeasurerCache.current.rowHeight({ index: 0 });

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

            <div className="pd-transfers-list">
                <AutoSizer disableHeight>
                    {({ width }) => (
                        <List
                            className="no-outline"
                            ref={listRef}
                            rowRenderer={rowRenderer}
                            rowCount={sortedEntries.length}
                            rowHeight={cellMeasurerCache.current.rowHeight}
                            height={estimatedRowHeight * Math.min(MAX_VISIBLE_TRANSFERS, sortedEntries.length)}
                            estimatedRowSize={estimatedRowHeight}
                            width={width}
                        />
                    )}
                </AutoSizer>
            </div>
        </div>
    );
}

export default TransferManager;
