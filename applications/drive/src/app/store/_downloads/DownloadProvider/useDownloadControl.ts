import { useCallback, useRef } from 'react';

import { FILE_CHUNK_SIZE } from '@proton/shared/lib/drive/constants';

import { TransferState } from '../../../components/TransferManager/transfer';
import { isTransferFinished, isTransferPending, isTransferProgress } from '../../../utils/transfer';
import { DownloadControls } from '../interface';
import {
    Download,
    DownloadLinksProgresses,
    DownloadProgresses,
    UpdateCallback,
    UpdateFilter,
    UpdateState,
} from './interface';

export default function useDownloadControl(
    downloads: Download[],
    updateWithCallback: (idOrFilter: UpdateFilter, newState: UpdateState, callback: UpdateCallback) => void,
    removeFromQueue: (idOrFilter: UpdateFilter, callback: UpdateCallback) => void,
    clearQueue: () => void
) {
    // Controls keep references to ongoing downloads to have ability
    // to pause or cancel them.
    const controls = useRef<{ [id: string]: DownloadControls }>({});
    const progresses = useRef<DownloadProgresses>({});

    const add = (id: string, downloadControls: DownloadControls) => {
        controls.current[id] = downloadControls;
        progresses.current[id] = { progress: 0, links: {} };
    };

    const remove = (id: string) => {
        delete controls.current[id];
        delete progresses.current[id];
    };

    const getLinkProgress = (id: string, linkId: string) => {
        if (!progresses.current[id].links[linkId]) {
            progresses.current[id].links[linkId] = {
                progress: 0,
            };
        }
        return progresses.current[id].links[linkId];
    };

    const updateLinkSizes = (id: string, linkSizes: { [linkId: string]: number }) => {
        // Progress might be updated even when transfer is already finished and
        // thus progress is not here anymore. In such case it is OK to simply
        // ignore the call to not crash.
        if (progresses.current[id] === undefined) {
            return;
        }
        Object.entries(linkSizes || {}).forEach(([linkId, size]) => {
            getLinkProgress(id, linkId).total = size;
        });
    };

    const updateProgress = (id: string, linkIds: string[], increment: number) => {
        // Progress might be updated even when transfer is already finished and
        // thus progress is not here anymore. In such case it is OK to simply
        // ignore the call to not crash.
        if (progresses.current[id] === undefined) {
            return;
        }
        progresses.current[id].progress += increment;
        // Because increment can be float, some aritmetic operation can result
        // in -0.0000000001 which would be then displayed as -0 after rounding.
        if (progresses.current[id].progress < 0) {
            progresses.current[id].progress = 0;
        }

        linkIds.forEach((linkId) => (getLinkProgress(id, linkId).progress += increment));
    };

    const getProgresses = () =>
        Object.fromEntries(Object.entries(progresses.current).map(([linkId, { progress }]) => [linkId, progress]));

    const getLinksProgress = (): DownloadLinksProgresses =>
        Object.values(progresses.current).reduce((aggregatedLinks, { links }) => {
            // What if some link is downloaded more than once?
            // Probably very rare case which we can safely ignore. The worst case
            // scenario is that we show randomly progress of one download, but
            // thanks to browser caching it will not be that much off.
            return { ...aggregatedLinks, ...links };
        }, {});

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
            const downloadedSize = progresses.current[download.id]?.progress || 0;
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
            // Do not cancel already finished transfers.
            updateWithCallback(
                idOrFilter,
                ({ state }) => (isTransferFinished({ state }) ? state : TransferState.Canceled),
                ({ state, id }) => !isTransferFinished({ state }) && controls.current[id]?.cancel()
            );
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
        updateLinkSizes,
        updateProgress,
        getProgresses,
        getLinksProgress,
        calculateDownloadBlockLoad,
        pauseDownloads,
        resumeDownloads,
        cancelDownloads,
        removeDownloads,
        clearDownloads,
    };
}
