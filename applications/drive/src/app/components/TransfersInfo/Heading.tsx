import React, { useRef, useState, useEffect, useMemo } from 'react';
import { c, msgid } from 'ttag';
import { Icon, Tooltip, classnames } from 'react-components';
import { Transfer, Download, Upload } from '../../interfaces/transfer';
import {
    isTransferActive,
    isTransferDone,
    isTransferPaused,
    isTransferError,
    isTransferCanceled,
    isTransferFinished,
} from '../../utils/transfer';
import { TransfersStats } from './interfaces';

interface Props {
    downloads: Download[];
    uploads: Upload[];
    latestStats: TransfersStats;
    minimized: boolean;
    onToggleMinimize: () => void;
    onClose: () => void;
}

const Heading = ({ downloads, uploads, latestStats, onClose, onToggleMinimize, minimized = false }: Props) => {
    const [currentUploads, setCurrentUploads] = useState<Upload[]>([]);
    const [currentDownloads, setCurrentDownloads] = useState<Download[]>([]);

    const minimizeRef = useRef<HTMLButtonElement>(null);
    const transfers = useMemo(() => [...downloads, ...uploads], [uploads, downloads]);

    const activeUploads = useMemo(() => uploads.filter(isTransferActive), [uploads]);
    const activeDownloads = useMemo(() => downloads.filter(isTransferActive), [downloads]);
    const allTransfersFinished = useMemo(() => transfers.every(isTransferFinished), [transfers]);

    const doneUploads = useMemo(() => uploads.filter(isTransferDone), [uploads]);
    const doneDownloads = useMemo(() => downloads.filter(isTransferDone), [downloads]);

    const pausedTransfers = useMemo(() => transfers.filter(isTransferPaused), [transfers]);
    const failedTransfers = useMemo(() => transfers.filter(isTransferError), [transfers]);
    const canceledTransfers = useMemo(() => transfers.filter(isTransferCanceled), [transfers]);

    const activeUploadsCount = activeUploads.length;
    const activeDownloadsCount = activeDownloads.length;

    useEffect(() => {
        if (activeUploadsCount) {
            setCurrentUploads((currentUploads) => [
                ...currentUploads.filter((upload) => activeUploads.every(({ id }) => id !== upload.id)),
                ...activeUploads,
            ]);
        } else {
            setCurrentUploads([]);
        }
    }, [activeUploads]);

    useEffect(() => {
        if (activeDownloadsCount) {
            setCurrentDownloads((currentDownloads) => [
                ...currentDownloads.filter((download) => activeDownloads.every(({ id }) => id !== download.id)),
                ...activeDownloads,
            ]);
        } else {
            setCurrentDownloads([]);
        }
    }, [activeDownloads]);

    const getHeadingText = () => {
        const headingElements: string[] = [];

        const activeCount = activeUploadsCount + activeDownloadsCount;
        const doneUploadsCount = doneUploads.length;
        const doneDownloadsCount = doneDownloads.length;
        const doneCount = doneUploadsCount + doneDownloadsCount;

        const errorCount = failedTransfers.length;
        const canceledCount = canceledTransfers.length;
        const pausedCount = pausedTransfers.length;

        const calculateProgress = (transfers: Transfer[]) => {
            const result = transfers.reduce(
                (result, transfer) => {
                    result.size += transfer.meta.size || 0;
                    result.progress += latestStats.stats[transfer.id]?.progress || 0;
                    return result;
                },
                { size: 0, progress: 0 }
            );

            return Math.floor(100 * (result.progress / (result.size || 1)));
        };

        if (!activeCount) {
            if (doneUploadsCount && doneDownloadsCount) {
                headingElements.push(
                    c('Info').ngettext(msgid`${doneCount} Finished`, `${doneCount} Finished`, doneCount)
                );
            } else {
                if (doneUploadsCount) {
                    headingElements.push(
                        c('Info').ngettext(
                            msgid`${doneUploadsCount} Uploaded`,
                            `${doneUploadsCount} Uploaded`,
                            doneUploadsCount
                        )
                    );
                }
                if (doneDownloadsCount) {
                    headingElements.push(
                        c('Info').ngettext(
                            msgid`${doneDownloadsCount} Downloaded`,
                            `${doneDownloadsCount} Downloaded`,
                            doneDownloadsCount
                        )
                    );
                }
            }
        }

        if (activeUploadsCount) {
            const uploadProgress = calculateProgress(currentUploads);
            headingElements.push(
                c('Info').ngettext(
                    msgid`${activeUploadsCount} Uploading ${uploadProgress}%`,
                    `${activeUploadsCount} Uploading ${uploadProgress}%`,
                    activeUploadsCount
                )
            );
        }
        if (activeDownloadsCount) {
            const downloadProgress = calculateProgress(currentDownloads);
            headingElements.push(
                c('Info').ngettext(
                    msgid`${activeDownloadsCount} Downloading ${downloadProgress}%`,
                    `${activeDownloadsCount} Downloading ${downloadProgress}%`,
                    activeDownloadsCount
                )
            );
        }

        if (pausedCount) {
            headingElements.push(
                c('Info').ngettext(msgid`${pausedCount} Paused`, `${pausedCount} Paused`, pausedCount)
            );
        }

        if (canceledCount) {
            headingElements.push(
                c('Info').ngettext(msgid`${canceledCount} Canceled`, `${canceledCount} Canceled`, canceledCount)
            );
        }

        if (errorCount) {
            headingElements.push(c('Info').ngettext(msgid`${errorCount} Failed`, `${errorCount} Failed`, errorCount));
        }

        return headingElements.join(', ');
    };

    const minMaxTitle = minimized ? c('Action').t`Maximize transfers` : c('Action').t`Minimize transfers`;
    const closeTitle = c('Action').t`Close transfers`;

    return (
        <div className="pd-transfers-heading flex flex-items-center flex-nowrap pl0-5 pr0-5 color-global-light">
            <div
                role="presentation"
                className="flex-item-fluid p0-5"
                aria-atomic="true"
                aria-live="polite"
                onClick={minimized ? onToggleMinimize : undefined}
            >
                {getHeadingText()}
            </div>
            <Tooltip title={minMaxTitle} className="pd-transfers-headingTooltip flex-item-noshrink flex">
                <button
                    ref={minimizeRef}
                    type="button"
                    className="pd-transfers-headingButton p0-5 flex"
                    onClick={() => {
                        onToggleMinimize();
                        minimizeRef.current?.blur();
                    }}
                    aria-expanded={!minimized}
                >
                    <Icon className={classnames(['mauto', minimized && 'rotateX-180'])} name="minimize" />
                    <span className="sr-only">{minMaxTitle}</span>
                </button>
            </Tooltip>
            <Tooltip
                title={closeTitle}
                className={classnames([
                    'pd-transfers-headingTooltip flex-item-noshrink flex',
                    !allTransfersFinished && 'pd-transfers-headingTooltip--isDisabled',
                ])}
            >
                <button
                    type="button"
                    disabled={!allTransfersFinished}
                    className="pd-transfers-headingButton flex p0-5"
                    onClick={onClose}
                >
                    <Icon className="mauto" name="off" />
                    <span className="sr-only">{closeTitle}</span>
                </button>
            </Tooltip>
        </div>
    );
};

export default Heading;
