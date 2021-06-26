import React, { useRef, useState, useEffect, useMemo } from 'react';
import { c, msgid } from 'ttag';
import { Icon, Tooltip, classnames, Button } from '@proton/components';
import { Download, Upload } from '../../interfaces/transfer';
import {
    isTransferActive,
    isTransferDone,
    isTransferManuallyPaused,
    isTransferError,
    isTransferCanceled,
    calculateProgress,
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

const Header = ({ downloads, uploads, latestStats, onClose, onToggleMinimize, minimized = false }: Props) => {
    const [uploadsInSession, setUploadsInSession] = useState<Upload[]>([]);
    const [downloadsInSession, setDownloadsInSession] = useState<Download[]>([]);

    const minimizeRef = useRef<HTMLButtonElement>(null);
    const transfers = useMemo(() => [...downloads, ...uploads], [uploads, downloads]);

    const activeUploads = useMemo(() => uploads.filter(isTransferActive), [uploads]);
    const activeDownloads = useMemo(() => downloads.filter(isTransferActive), [downloads]);

    const doneUploads = useMemo(() => uploads.filter(isTransferDone), [uploads]);
    const doneDownloads = useMemo(() => downloads.filter(isTransferDone), [downloads]);

    const pausedTransfers = useMemo(() => transfers.filter(isTransferManuallyPaused), [transfers]);
    const failedTransfers = useMemo(() => transfers.filter(isTransferError), [transfers]);
    const canceledTransfers = useMemo(() => transfers.filter(isTransferCanceled), [transfers]);

    const activeUploadsCount = activeUploads.length;
    const activeDownloadsCount = activeDownloads.length;

    useEffect(() => {
        if (activeUploadsCount) {
            setUploadsInSession((uploadsInSession) => [
                ...doneUploads.filter((done) => uploadsInSession.some(({ id }) => id === done.id)),
                ...activeUploads,
            ]);
        } else {
            setUploadsInSession([]);
        }
    }, [activeUploads, doneUploads, activeUploadsCount]);

    useEffect(() => {
        if (activeDownloadsCount) {
            setDownloadsInSession((downloadsInSession) => [
                ...doneDownloads.filter((done) => downloadsInSession.some(({ id }) => id === done.id)),
                ...activeDownloads,
            ]);
        } else {
            setDownloadsInSession([]);
        }
    }, [activeDownloads, activeDownloadsCount]);

    const getHeadingText = () => {
        const headingElements: string[] = [];

        const activeCount = activeUploadsCount + activeDownloadsCount;
        const doneUploadsCount = doneUploads.length;
        const doneDownloadsCount = doneDownloads.length;
        const doneCount = doneUploadsCount + doneDownloadsCount;

        const errorCount = failedTransfers.length;
        const canceledCount = canceledTransfers.length;
        const pausedCount = pausedTransfers.length;

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
            const uploadProgress = calculateProgress(latestStats, uploadsInSession);
            headingElements.push(
                c('Info').ngettext(
                    msgid`${activeUploadsCount} Uploading (${uploadProgress}%)`,
                    `${activeUploadsCount} Uploading (${uploadProgress}%)`,
                    activeUploadsCount
                )
            );
        }
        if (activeDownloadsCount) {
            const downloadProgress = calculateProgress(latestStats, downloadsInSession);
            headingElements.push(
                c('Info').ngettext(
                    msgid`${activeDownloadsCount} Downloading (${downloadProgress}%)`,
                    `${activeDownloadsCount} Downloading (${downloadProgress}%)`,
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
        <div className="transfers-manager-heading ui-prominent flex flex-align-items-center flex-nowrap pl0-5 pr0-5">
            <div
                role="presentation"
                className="flex-item-fluid p0-5"
                aria-atomic="true"
                aria-live="polite"
                onClick={minimized ? onToggleMinimize : undefined}
            >
                {getHeadingText()}
            </div>
            <Tooltip title={minMaxTitle}>
                <Button
                    icon
                    ref={minimizeRef}
                    type="button"
                    shape="ghost"
                    onClick={() => {
                        onToggleMinimize();
                        minimizeRef.current?.blur();
                    }}
                    aria-expanded={!minimized}
                >
                    <Icon className={classnames(['mauto', minimized && 'rotateX-180'])} name="minimize" />
                    <span className="sr-only">{minMaxTitle}</span>
                </Button>
            </Tooltip>
            <Tooltip title={closeTitle}>
                <Button icon type="button" shape="ghost" onClick={onClose}>
                    <Icon className="mauto" name="off" alt={closeTitle} />
                </Button>
            </Tooltip>
        </div>
    );
};

export default Header;
