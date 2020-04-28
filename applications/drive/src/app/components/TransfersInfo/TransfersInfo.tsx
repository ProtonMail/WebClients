import * as React from 'react';
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

    const updateStats = () => {
        const timestamp = new Date();
        const progresses = { ...getUploadsProgresses(), ...getDownloadsProgresses() };

        setStatsHistory((prev) => {
            const stats = Object.entries(progresses).reduce(
                (stats, [id, progress]) => ({
                    ...stats,
                    [id]: {
                        // get speed snapshot based on bytes downloaded since last update
                        speed: prev[0]?.stats[id]
                            ? (progresses[id] - prev[0].stats[id].progress) * (1000 / PROGRESS_UPDATE_INTERVAL)
                            : 0,
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

        const activeUploads = uploads.filter(({ state }) => state !== TransferState.Done);
        const activeDownloads = downloads.filter(({ state }) => state !== TransferState.Done);

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
        const sum = statsHistory.reduce((acc, { stats }) => acc + (stats[id]?.speed || 0), 0);
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
