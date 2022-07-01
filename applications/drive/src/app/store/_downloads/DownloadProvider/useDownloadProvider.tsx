import { useCallback, useEffect } from 'react';
import { c } from 'ttag';

import { useNotifications, usePreventLeave, useModals, useOnline } from '@proton/components';

import { TransferState } from '../../../components/TransferManager/transfer';
import DownloadIsTooBigModal from '../../../components/DownloadIsTooBigModal';
import { isTransferCancelError, isTransferProgress, isTransferPausedByConnection } from '../../../utils/transfer';
import { bufferToStream } from '../../../utils/stream';
import { logError, reportError } from '../../_utils';
import { SignatureIssues } from '../../_links';
import { MAX_DOWNLOADING_BLOCKS_LOAD } from '../constants';
import FileSaver from '../fileSaver/fileSaver';
import { LinkDownload, InitDownloadCallback, DownloadSignatureIssueModal } from '../interface';
import { UpdateFilter } from './interface';
import useDownloadQueue from './useDownloadQueue';
import useDownloadControl from './useDownloadControl';
import useDownloadSignatureIssue from './useDownloadSignatureIssue';

export default function useDownloadProvider(
    initDownload: InitDownloadCallback,
    DownloadSignatureIssueModal: DownloadSignatureIssueModal
) {
    const onlineStatus = useOnline();
    const { createNotification } = useNotifications();
    const { preventLeave } = usePreventLeave();
    const { createModal } = useModals();

    const queue = useDownloadQueue();
    const control = useDownloadControl(queue.downloads, queue.updateWithCallback, queue.remove, queue.clear);
    const { handleSignatureIssue } = useDownloadSignatureIssue(
        DownloadSignatureIssueModal,
        queue.downloads,
        queue.updateState,
        queue.updateWithData,
        control.cancelDownloads
    );

    /**
     * download should be considered as main entry point for download files
     * in Drive app. It does all necessary checks, such as checking if the
     * same files are not currently already downloading, and it adds transfer
     * to the queue.
     */
    const download = async (links: LinkDownload[]) => {
        await queue.add(links).catch((err: any) => {
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
            queue.updateWithData(idOrFilter, TransferState.Pending);
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
            void preventLeave(FileSaver.saveAsFile(stream, nextDownload.meta)).catch(logError);

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

        const controls = initDownload(nextDownload.meta.filename, nextDownload.links, {
            onInit: (size: number, linkSizes: { [linkId: string]: number }) => {
                // Keep the previous state for cases when the download is paused.
                queue.updateWithData(nextDownload.id, ({ state }) => state, { size });
                control.updateLinkSizes(nextDownload.id, linkSizes);

                if (FileSaver.isFileTooBig(size)) {
                    createModal(<DownloadIsTooBigModal onCancel={() => control.cancelDownloads(nextDownload.id)} />);
                }
            },
            onProgress: (linkId: string, increment: number) => {
                control.updateProgress(nextDownload.id, linkId, increment);
            },
            onNetworkError: (error: any) => {
                queue.updateWithData(nextDownload.id, TransferState.NetworkError, { error });
            },
            onSignatureIssue: async (
                abortSignal: AbortSignal,
                link: LinkDownload,
                signatureIssues: SignatureIssues
            ) => {
                await handleSignatureIssue(abortSignal, nextDownload, link, signatureIssues);
            },
        });
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
                        reportError(error);
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

    return {
        downloads: queue.downloads,
        hasDownloads: queue.hasDownloads,
        download,
        getProgresses: control.getProgresses,
        pauseDownloads: control.pauseDownloads,
        resumeDownloads: control.resumeDownloads,
        cancelDownloads: control.cancelDownloads,
        restartDownloads,
        removeDownloads: control.removeDownloads,
        clearDownloads: control.clearDownloads,
    };
}
