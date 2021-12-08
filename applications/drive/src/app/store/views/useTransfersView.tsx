import { useCallback, useEffect, useMemo, useState } from 'react';

import {
    Transfer,
    TransferProgresses,
    TransfersStats,
    TransferState,
    TransferStats,
    TransferHistoryStats,
    TransfersHistoryStats,
} from '@proton/shared/lib/interfaces/drive/transfer';

import { isTransferProgress, isTransferFinished } from '../../utils/transfer';
import { useDownloadProvider } from '../downloads';
import { useUpload } from '../uploads';

const PROGRESS_UPDATE_INTERVAL = 500;
const SPEED_SNAPSHOTS = 10; // How many snapshots should the speed be average of

/**
 * useTransfersView provides data for transfer manager.
 */
export default function useTransfersView() {
    const { downloads, getDownloadsProgresses, clearDownloads } = useDownloadProvider();
    const { uploads, getUploadsProgresses, clearUploads } = useUpload();

    const transfers = useMemo(() => [...downloads, ...uploads], [downloads, uploads]);
    const hasActiveTransfer = useMemo(() => !transfers.every(isTransferFinished), [transfers]);

    const getTransferProgresses = useCallback(() => {
        return {
            ...getDownloadsProgresses(),
            ...getUploadsProgresses(),
        };
    }, [getDownloadsProgresses, getUploadsProgresses]);
    const stats = useStats(transfers, getTransferProgresses);

    const clearAllTransfers = useCallback(() => {
        clearDownloads();
        clearUploads();
    }, [clearDownloads, clearUploads]);

    return {
        downloads,
        uploads,
        hasActiveTransfer,
        stats,
        clearAllTransfers,
    };
}

function useStats(transfers: Transfer[], getTransferProgresses: () => TransferProgresses) {
    const statsHistory = useStatsHistory(transfers, getTransferProgresses);

    return useMemo((): TransfersStats => {
        const calculateAverageSpeed = (transferId: string) => {
            let sum = 0;

            for (let i = 0; i < statsHistory.length; i++) {
                const stats = statsHistory[i].stats[transferId];

                if (!stats?.active || stats.speed < 0) {
                    break; // Only take most recent progress (e.g. after pause or progress reset)
                }
                sum += stats.speed;
            }

            return sum / statsHistory.length;
        };

        const getStats = (transferId: string): TransferStats => ({
            progress: statsHistory[0]?.stats[transferId]?.progress || 0,
            averageSpeed: calculateAverageSpeed(transferId),
        });

        return Object.fromEntries(Object.keys(getTransferProgresses()).map((id) => [id, getStats(id)]));
    }, [statsHistory]);
}

function useStatsHistory(transfers: Transfer[], getTransferProgresses: () => TransferProgresses) {
    const [statsHistory, setStatsHistory] = useState<TransfersHistoryStats[]>([]);

    const getTransfer = useCallback((id: string) => transfers.find((transfer) => transfer.id === id), [transfers]);

    const updateStats = () => {
        const timestamp = new Date();
        const transferProgresses = getTransferProgresses();

        setStatsHistory((prev) => {
            const lastStats = (id: string) => prev[0]?.stats[id] || {};
            const stats = Object.entries(transferProgresses).reduce(
                (stats, [id, progress]) => ({
                    ...stats,
                    [id]: {
                        // get speed snapshot based on bytes downloaded since last update
                        speed: lastStats(id).active
                            ? (transferProgresses[id] - lastStats(id).progress) * (1000 / PROGRESS_UPDATE_INTERVAL)
                            : 0,
                        active: getTransfer(id)?.state === TransferState.Progress,
                        progress,
                    },
                }),
                {} as { [id: string]: TransferHistoryStats }
            );

            return [{ stats, timestamp }, ...prev.slice(0, SPEED_SNAPSHOTS - 1)];
        });
    };

    useEffect(() => {
        updateStats();

        const transfersInProgress = transfers.filter(isTransferProgress);
        if (!transfersInProgress.length) {
            return;
        }

        const int = setInterval(updateStats, PROGRESS_UPDATE_INTERVAL);
        return () => {
            // When transfer is paused, progress is updated a bit later.
            // Therefore we need to update stats even few ms after nothing
            // is in progress.
            setTimeout(updateStats, PROGRESS_UPDATE_INTERVAL);
            clearInterval(int);
        };
    }, [transfers]);

    return statsHistory;
}
