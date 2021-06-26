import { useState, useCallback, useEffect } from 'react';

import { TransfersStats, TransferStats } from '../../components/TransferManager/interfaces';
import { Transfer, TransferProgresses, TransferState } from '../../interfaces/transfer';
import { isTransferProgress } from '../../utils/transfer';

const PROGRESS_UPDATE_INTERVAL = 500;
const SPEED_SNAPSHOTS = 10; // How many snapshots should the speed be average of

function useStatsHistory(transfers: Transfer[], getTransferProgresses: () => TransferProgresses) {
    const [statsHistory, setStatsHistory] = useState<TransfersStats[]>([]);

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
                {} as { [id: string]: TransferStats }
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
            clearInterval(int);
        };
    }, [transfers]);

    return statsHistory;
}

export default useStatsHistory;
