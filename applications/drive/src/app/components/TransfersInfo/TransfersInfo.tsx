import React, { useCallback } from 'react';
import { useDownloadProvider } from '../downloads/DownloadProvider';
import { useUploadProvider } from '../uploads/UploadProvider';
import Heading from './Heading';
import Transfer, { TransferType, TransferStats } from './Transfer';
import { useToggle, classnames } from 'react-components';
import { TransferState } from '../../interfaces/transfer';

const PROGRESS_UPDATE_INTERVAL = 500;
const SPEED_SNAPSHOTS = 10; // How many snapshots should the speed be average of

interface TransfersStats {
    timestamp: Date;
    stats: { [id: string]: TransferStats };
}

function TransfersInfo() {
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
            const lastStats = (id: string) => prev[0]?.stats[id];
            const stats = Object.entries(progresses).reduce(
                (stats, [id, progress]) => ({
                    ...stats,
                    [id]: {
                        // get speed snapshot based on bytes downloaded since last update
                        speed:
                            lastStats(id)?.state === TransferState.Progress
                                ? (progresses[id] - lastStats(id).progress) * (1000 / PROGRESS_UPDATE_INTERVAL)
                                : 0,
                        state: getTransfer(id)?.state ?? TransferState.Error,
                        progress
                    }
                }),
                {} as { [id: string]: TransferStats }
            );

            return [{ stats, timestamp }, ...prev.slice(0, SPEED_SNAPSHOTS - 1)];
        });
    };

    React.useEffect(() => {
        updateStats();

        const activeUploads = uploads.filter(({ state }) => state === TransferState.Progress);
        const activeDownloads = downloads.filter(({ state }) => state === TransferState.Progress);

        if (!activeUploads.length && !activeDownloads.length) {
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

    const downloadTransfers = downloads.map((download) => ({
        transfer: download,
        component: (
            <Transfer
                key={download.id}
                transfer={download}
                type={TransferType.Download}
                stats={{
                    progress: latestStats.stats[download.id]?.progress,
                    speed: calculateAverageSpeed(download.id)
                }}
            />
        )
    }));

    const uploadTransfers = uploads.map((upload) => ({
        transfer: upload,
        component: (
            <Transfer
                key={upload.id}
                transfer={upload}
                type={TransferType.Upload}
                stats={{
                    progress: latestStats.stats[upload.id]?.progress,
                    speed: calculateAverageSpeed(upload.id)
                }}
            />
        )
    }));

    const transfers = [...downloadTransfers, ...uploadTransfers]
        .sort((a, b) => b.transfer.startDate.getTime() - a.transfer.startDate.getTime())
        .map(({ component }) => component);

    return (
        <div className={classnames(['pd-transfers', minimized && 'pd-transfers--minimized'])}>
            <Heading
                downloads={downloads}
                uploads={uploads}
                minimized={minimized}
                onToggleMinimize={toggleMinimized}
                onClose={handleCloseClick}
            />
            <div className="pd-transfers-list">{transfers}</div>
        </div>
    );
}

export default TransfersInfo;
