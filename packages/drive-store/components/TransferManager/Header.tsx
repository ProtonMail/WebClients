import { useEffect, useMemo, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';
import clsx from '@proton/utils/clsx';

import {
    calculateProgress,
    isTransferActive,
    isTransferCanceled,
    isTransferDone,
    isTransferError,
    isTransferManuallyPaused,
    isTransferSkipped,
} from '../../utils/transfer';
import type { Download, TransfersStats, Upload } from './transfer';

interface Props {
    downloads: Download[];
    uploads: Upload[];
    stats: TransfersStats;
    minimized: boolean;
    onToggleMinimize: () => void;
    onClose: () => void;
}

const Header = ({ downloads, uploads, stats, onClose, onToggleMinimize, minimized = false }: Props) => {
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
    const skippedTransfers = useMemo(() => transfers.filter(isTransferSkipped), [transfers]);

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
        const skippedCount = skippedTransfers.length;
        const pausedCount = pausedTransfers.length;

        if (!activeCount) {
            if (doneUploadsCount && doneDownloadsCount) {
                headingElements.push(
                    c('Info').ngettext(msgid`${doneCount} finished`, `${doneCount} finished`, doneCount)
                );
            } else {
                if (doneUploadsCount) {
                    headingElements.push(
                        c('Info').ngettext(
                            msgid`${doneUploadsCount} uploaded`,
                            `${doneUploadsCount} uploaded`,
                            doneUploadsCount
                        )
                    );
                }
                if (doneDownloadsCount) {
                    headingElements.push(
                        c('Info').ngettext(
                            msgid`${doneDownloadsCount} downloaded`,
                            `${doneDownloadsCount} downloaded`,
                            doneDownloadsCount
                        )
                    );
                }
            }
        }

        if (activeUploadsCount) {
            const uploadProgress = calculateProgress(stats, uploadsInSession);
            headingElements.push(
                c('Info').ngettext(
                    msgid`${activeUploadsCount} uploading (${uploadProgress}%)`,
                    `${activeUploadsCount} uploading (${uploadProgress}%)`,
                    activeUploadsCount
                )
            );
        }
        if (activeDownloadsCount) {
            if (downloadsInSession.some(({ meta: { size } }) => size === undefined)) {
                headingElements.push(
                    c('Info').ngettext(
                        msgid`${activeDownloadsCount} downloading`,
                        `${activeDownloadsCount} downloading`,
                        activeDownloadsCount
                    )
                );
            } else {
                const downloadProgress = calculateProgress(stats, downloadsInSession);
                headingElements.push(
                    c('Info').ngettext(
                        msgid`${activeDownloadsCount} downloading (${downloadProgress}%)`,
                        `${activeDownloadsCount} downloading (${downloadProgress}%)`,
                        activeDownloadsCount
                    )
                );
            }
        }

        if (pausedCount) {
            headingElements.push(
                c('Info').ngettext(msgid`${pausedCount} paused`, `${pausedCount} paused`, pausedCount)
            );
        }

        if (canceledCount) {
            headingElements.push(
                c('Info').ngettext(msgid`${canceledCount} canceled`, `${canceledCount} canceled`, canceledCount)
            );
        }

        if (skippedCount) {
            headingElements.push(
                // translator: Shown in the transfer manager header - ex. "3 skipped"
                c('Info').ngettext(msgid`${skippedCount} skipped`, `${skippedCount} skipped`, skippedCount)
            );
        }

        if (errorCount) {
            headingElements.push(c('Info').ngettext(msgid`${errorCount} failed`, `${errorCount} failed`, errorCount));
        }

        return headingElements.join(', ');
    };

    const minMaxTitle = minimized ? c('Action').t`Maximize transfers` : c('Action').t`Minimize transfers`;
    const closeTitle = c('Action').t`Close transfers`;

    return (
        <div className="transfers-manager-heading ui-prominent flex items-center flex-nowrap px-2">
            <div
                role="presentation"
                className="flex-1 p-2"
                aria-atomic="true"
                aria-live="polite"
                data-testid="drive-transfers-manager:header"
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
                    aria-controls="transfer-manager"
                >
                    <Icon className={clsx(['m-auto', minimized && 'rotateX-180'])} name="low-dash" />
                    <span className="sr-only">{minMaxTitle}</span>
                </Button>
            </Tooltip>
            <Tooltip title={closeTitle}>
                <Button icon type="button" shape="ghost" data-testid="drive-transfers-manager:close" onClick={onClose}>
                    <Icon className="m-auto" name="cross" alt={closeTitle} />
                </Button>
            </Tooltip>
        </div>
    );
};

export default Header;
