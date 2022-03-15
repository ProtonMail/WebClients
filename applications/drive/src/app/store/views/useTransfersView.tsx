import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

            // With a lot of uploads the interval is not called in precise
            // time and to compute correct speed we need to have accurate
            // difference from the last check.
            const lastTimestamp = prev[0]?.timestamp || new Date();
            const intervalSinceLastCheck = timestamp.getTime() - lastTimestamp.getTime();

            const stats = Object.entries(transferProgresses).reduce(
                (stats, [id, progress]) => ({
                    ...stats,
                    [id]: {
                        // get speed snapshot based on bytes uploaded/downloaded since last update
                        speed: lastStats(id).active
                            ? (transferProgresses[id] - lastStats(id).progress) * (1000 / intervalSinceLastCheck)
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

    const runUpdateStatsJob = useRunPeriodicJobOnce(updateStats, PROGRESS_UPDATE_INTERVAL);

    useEffect(() => {
        const transfersInProgress = transfers.filter(isTransferProgress);
        if (!transfersInProgress.length) {
            return;
        }

        const stop = runUpdateStatsJob();
        return () => {
            // When transfer is paused, progress is updated a bit later.
            // Therefore we need to update stats even few ms after nothing
            // is in progress.
            setTimeout(stop, PROGRESS_UPDATE_INTERVAL);
        };
    }, [transfers]);

    return statsHistory;
}

function useRunPeriodicJobOnce(job: () => void, interval: number): () => () => void {
    // The job will be running until there is any caller requesting it.
    const numOfCallers = useRef(0);

    return () => {
        numOfCallers.current++;
        if (numOfCallers.current === 1) {
            const timer = setInterval(() => {
                if (numOfCallers.current === 0) {
                    clearInterval(timer);
                    return;
                }
                job();
            }, interval);
            job();
        }
        return () => {
            numOfCallers.current--;
        };
    };
}
