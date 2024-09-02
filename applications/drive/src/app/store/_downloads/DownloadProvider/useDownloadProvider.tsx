import { useCallback, useEffect } from 'react';

import { c } from 'ttag';

import { useNotifications, useOnline, usePreventLeave } from '@proton/components';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import type { UserModel } from '@proton/shared/lib/interfaces';
import type { ScanResultItem } from '@proton/shared/lib/interfaces/drive/file';

import { TransferState } from '../../../components/TransferManager/transfer';
import { useDownloadIsTooBigModal } from '../../../components/modals/DownloadIsTooBigModal';
import { logError, sendErrorReport } from '../../../utils/errorHandling';
import { bufferToStream } from '../../../utils/stream';
import {
    isTransferCancelError,
    isTransferOngoing,
    isTransferPausedByConnection,
    isTransferProgress,
} from '../../../utils/transfer';
import type { SignatureIssues } from '../../_links';
import { useTransferLog } from '../../_transfer';
import { MAX_DOWNLOADING_BLOCKS_LOAD } from '../constants';
import FileSaver from '../fileSaver/fileSaver';
import type { InitDownloadCallback, LinkDownload } from '../interface';
import type { UpdateFilter } from './interface';
import useDownloadContainsDocument from './useDownloadContainsDocument';
import useDownloadControl from './useDownloadControl';
import { useDownloadMetrics } from './useDownloadMetrics';
import useDownloadQueue from './useDownloadQueue';
import useDownloadScanIssue from './useDownloadScanIssue';
import useDownloadSignatureIssue from './useDownloadSignatureIssue';

export default function useDownloadProvider(user: UserModel | undefined, initDownload: InitDownloadCallback) {
    const onlineStatus = useOnline();
    const { createNotification } = useNotifications();
    const { observe } = useDownloadMetrics('download', user);
    const { preventLeave } = usePreventLeave();
    const [downloadIsTooBigModal, showDownloadIsTooBigModal] = useDownloadIsTooBigModal();

    const { log, downloadLogs, clearLogs } = useTransferLog('download');
    const queue = useDownloadQueue((id, message) => log(id, `queue: ${message}`));
    const control = useDownloadControl(queue.downloads, queue.updateWithCallback, queue.remove, queue.clear);
    const { handleSignatureIssue, signatureIssueModal } = useDownloadSignatureIssue(
        queue.downloads,
        queue.updateState,
        queue.updateWithData,
        control.cancelDownloads
    );
    const { handleScanIssue } = useDownloadScanIssue(queue.updateWithData, control.cancelDownloads);
    const { handleContainsDocument, containsDocumentModal } = useDownloadContainsDocument(control.cancelDownloads);

    /**
     * download should be considered as main entry point for download files
     * in Drive app. It does all necessary checks, such as checking if the
     * same files are not currently already downloading, and it adds transfer
     * to the queue.
     */
    const download = async (links: LinkDownload[], options?: { virusScan?: boolean }): Promise<void> => {
        await queue.add(links, options).catch((err: any) => {
            if ((err as Error).name === 'DownloadUserError') {
                createNotification({
                    text: err.message,
                    type: 'error',
                });
            } else {
                createNotification({
                    text: c('Notification').t`Failed to download files: ${err}`,
                    type: 'error',
                });
                console.error(err);
            }
        });
    };

    const restartDownloads = useCallback(
        async (idOrFilter: UpdateFilter) => {
            queue.updateWithData(idOrFilter, TransferState.Pending, {
                retry: true,
            });
        },
        [queue.downloads, queue.updateState]
    );

    // Effect to start next download if there is enough capacity to do so.
    useEffect(() => {
        const { nextDownload } = queue;
        if (!nextDownload) {
            return;
        }

        // If link contains the whole buffer already, there is no need to
        // calculate load or wait for anything else. It can be downloaded
        // right away.
        if (nextDownload.links.every(({ buffer }) => !!buffer)) {
            const buffer = nextDownload.links.flatMap(({ buffer }) => buffer);
            const stream = bufferToStream(buffer as Uint8Array[]);
            void preventLeave(
                FileSaver.saveAsFile(stream, nextDownload.meta, (message) => log(nextDownload.id, message))
            ).catch(logError);

            queue.updateState(nextDownload.id, TransferState.Done);
            return;
        }

        const loadSizes = queue.downloads.filter(isTransferProgress).map((download) => download.meta.size);
        if (loadSizes.some((size) => size === undefined)) {
            return;
        }
        const load = control.calculateDownloadBlockLoad();
        if (load === undefined || load > MAX_DOWNLOADING_BLOCKS_LOAD) {
            return;
        }

        // Set progress right away to not start the download more than once.
        queue.updateState(nextDownload.id, TransferState.Progress);

        const controls = initDownload(
            nextDownload.meta.filename,
            nextDownload.links,
            {
                onInit: (size: number, linkSizes: { [linkId: string]: number }) => {
                    log(nextDownload.id, `loaded size: ${size}, number of links: ${Object.keys(linkSizes).length}`);

                    // Keep the previous state for cases when the download is paused.
                    queue.updateWithData(nextDownload.id, ({ state }) => state, { size });
                    control.updateLinkSizes(nextDownload.id, linkSizes);

                    if (FileSaver.isFileTooBig(size)) {
                        void showDownloadIsTooBigModal({ onCancel: () => control.cancelDownloads(nextDownload.id) });
                    }
                },
                onProgress: (linkIds: string[], increment: number) => {
                    control.updateProgress(nextDownload.id, linkIds, increment);
                },
                onNetworkError: (error: any) => {
                    log(nextDownload.id, `network issue: ${error}`);
                    queue.updateWithData(nextDownload.id, TransferState.NetworkError, { error });
                },
                onScanIssue: async (abortSignal: AbortSignal, error?: Error, response?: ScanResultItem) => {
                    log(
                        nextDownload.id,
                        `scan issue error: ${JSON.stringify(error || '')}; response: ${JSON.stringify(response || '')}`
                    );
                    await handleScanIssue(abortSignal, nextDownload, error);
                },
                onSignatureIssue: async (
                    abortSignal: AbortSignal,
                    link: LinkDownload,
                    signatureIssues: SignatureIssues
                ) => {
                    log(nextDownload.id, `signature issue: ${JSON.stringify(signatureIssues)}`);
                    await handleSignatureIssue(abortSignal, nextDownload, link, signatureIssues);
                },
                onContainsDocument: async (abortSignal: AbortSignal) => {
                    await handleContainsDocument(abortSignal, nextDownload);
                },
            },
            (message: string) => log(nextDownload.id, message),
            nextDownload.options
        );
        control.add(nextDownload.id, controls);
        void preventLeave(
            controls
                .start()
                .then(() => {
                    queue.updateState(nextDownload.id, TransferState.Done);
                })
                .catch((error: any) => {
                    if (isTransferCancelError(error)) {
                        queue.updateState(nextDownload.id, TransferState.Canceled);
                    } else {
                        queue.updateWithData(nextDownload.id, TransferState.Error, { error });
                        sendErrorReport(error);
                    }

                    // If the error is 429 (rate limited), we should not continue
                    // with other downloads in the queue and fail fast, otherwise
                    // it just triggers more strict jails and leads to nowhere.
                    if (error?.status === HTTP_ERROR_CODES.TOO_MANY_REQUESTS) {
                        log(nextDownload.id, `Got 429, canceling ongoing uploads`);
                        control.cancelDownloads(isTransferOngoing);
                    }
                })
                .finally(() => {
                    control.remove(nextDownload.id);
                })
        );
    }, [queue.nextDownload, queue.downloads]);

    useEffect(() => {
        if (onlineStatus) {
            const ids = queue.downloads.filter(isTransferPausedByConnection).map(({ id }) => id);
            control.resumeDownloads(({ id }) => ids.includes(id));
        }
    }, [onlineStatus]);

    useEffect(() => {
        observe(queue.downloads);
    }, [queue.downloads]);

    return {
        downloads: queue.downloads,
        hasDownloads: queue.hasDownloads,
        download,
        getProgresses: control.getProgresses,
        getLinksProgress: control.getLinksProgress,
        pauseDownloads: control.pauseDownloads,
        resumeDownloads: control.resumeDownloads,
        cancelDownloads: control.cancelDownloads,
        restartDownloads,
        removeDownloads: control.removeDownloads,
        clearDownloads: () => {
            control.clearDownloads();
            clearLogs();
        },
        updateWithData: queue.updateWithData,
        downloadDownloadLogs: downloadLogs,
        modals: (
            <>
                {downloadIsTooBigModal}
                {signatureIssueModal}
                {containsDocumentModal}
            </>
        ),
    };
}
