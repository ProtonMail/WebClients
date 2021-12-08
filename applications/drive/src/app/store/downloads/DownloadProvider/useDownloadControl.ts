import { useCallback, useRef } from 'react';

import { FILE_CHUNK_SIZE } from '@proton/shared/lib/drive/constants';
import { TransferState, TransferProgresses } from '@proton/shared/lib/interfaces/drive/transfer';

import { isTransferProgress, isTransferPending } from '../../../utils/transfer';
import { DownloadControls } from '../interface';
import { Download, UpdateFilter, UpdateState, UpdateCallback } from './interface';

export default function useDownloadControl(
    downloads: Download[],
    updateWithCallback: (idOrFilter: UpdateFilter, newState: UpdateState, callback: UpdateCallback) => void,
    removeFromQueue: (idOrFilter: UpdateFilter, callback: UpdateCallback) => void,
    clearQueue: () => void
) {
    // Controls keep references to ongoing downloads to have ability
    // to pause or cancel them.
    const controls = useRef<{ [id: string]: DownloadControls }>({});
    const progresses = useRef<TransferProgresses>({});

    const add = (id: string, downloadControls: DownloadControls) => {
        controls.current[id] = downloadControls;
        progresses.current[id] = 0;
    };

    const remove = (id: string) => {
        delete controls.current[id];
        delete progresses.current[id];
    };

    const updateProgress = (id: string, increment: number) => {
        progresses.current[id] += increment;
        // Because increment can be float, some aritmetic operation can result
        // in -0.0000000001 which would be then displayed as -0 after rounding.
        if (progresses.current[id] < 0) {
            progresses.current[id] = 0;
        }
    };

    const getProgresses = () => ({ ...progresses.current });

    /**
     * calculateDownloadLoad returns based on progresses of ongoing downloads
     * how many data is currently being remaining to be downloaded.
     * If the size is not known yet (for example, folder which has not loaded
     * all children), it returns undefined. That should be taken as high load
     * and not start any other download for now.
     * Otherwise it returns number of remaining blocks of active transfers.
     */
    const calculateDownloadBlockLoad = (): number | undefined => {
        const progressingDownloads = downloads.filter(isTransferProgress);
        if (progressingDownloads.some(({ meta: { size } }) => size === undefined)) {
            return undefined;
        }
        return progressingDownloads.reduce((sum: number, download) => {
            const downloadedSize = progresses.current[download.id] || 0;
            return sum + Math.ceil(((download.meta.size as number) - downloadedSize) / FILE_CHUNK_SIZE);
        }, 0);
    };

    const pauseDownloads = useCallback(
        (idOrFilter: UpdateFilter) => {
            updateWithCallback(idOrFilter, TransferState.Paused, ({ id, state }) => {
                if (isTransferProgress({ state }) || isTransferPending({ state })) {
                    (controls.current[id] as DownloadControls)?.pause?.();
                }
            });
        },
        [updateWithCallback]
    );

    const resumeDownloads = useCallback(
        (idOrFilter: UpdateFilter) => {
            updateWithCallback(
                idOrFilter,
                ({ resumeState }) => {
                    return resumeState || TransferState.Progress;
                },
                ({ id }) => {
                    (controls.current[id] as DownloadControls)?.resume?.();
                }
            );
        },
        [updateWithCallback]
    );

    const cancelDownloads = useCallback(
        (idOrFilter: UpdateFilter) => {
            updateWithCallback(idOrFilter, TransferState.Canceled, ({ id }) => {
                controls.current[id]?.cancel();
            });
        },
        [updateWithCallback]
    );

    const removeDownloads = useCallback(
        (idOrFilter: UpdateFilter) => {
            // We should never simply remove downloads, but cancel it first, so
            // it does not continue on background without our knowledge.
            cancelDownloads(idOrFilter);
            removeFromQueue(idOrFilter, ({ id }) => remove(id));
        },
        [removeFromQueue]
    );

    const clearDownloads = useCallback(() => {
        Object.entries(controls.current).map(([, downloadControls]) => downloadControls.cancel());
        controls.current = {};
        progresses.current = {};
        clearQueue();
    }, [clearQueue]);

    return {
        add,
        remove,
        updateProgress,
        getProgresses,
        calculateDownloadBlockLoad,
        pauseDownloads,
        resumeDownloads,
        cancelDownloads,
        removeDownloads,
        clearDownloads,
    };
}
