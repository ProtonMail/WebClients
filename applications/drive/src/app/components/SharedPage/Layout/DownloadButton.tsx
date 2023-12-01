import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

import usePublicToken from '../../../hooks/drive/usePublicToken';
import { DecryptedLink, useDownload } from '../../../store';
import { isTransferActive, isTransferPaused } from '../../../utils/transfer';
import { useSelection } from '../../FileBrowser';
import { getSelectedItems } from '../../sections/helpers';
import { PublicLink } from '../interface';
import { useDownloadNotifications } from './useDownloadNotifications';

export interface DownloadButtonProps {
    rootItem: DecryptedLink;
    items: PublicLink[];
    className?: string;
}

export function DownloadButton({ items, className, rootItem }: DownloadButtonProps) {
    const [downloadedSize, setDownloadedSize] = useState<number>(0);
    const [totalSize, setTotalSize] = useState<number>(0);

    const { token } = usePublicToken();
    const selectionControls = useSelection();
    const { downloads, download, clearDownloads, getDownloadsLinksProgresses } = useDownload();

    useDownloadNotifications(downloads);

    const selectedItems = getSelectedItems(items || [], selectionControls?.selectedItemIds || []);
    const count = selectedItems.length;

    const handleDownload = () => {
        // To keep always only one download around.
        clearDownloads();

        const downloadLinks = selectedItems.length
            ? selectedItems.map((link) => ({ ...link, shareId: token }))
            : [{ ...rootItem, shareId: token }];

        void download(downloadLinks);
    };

    const isDownloading = downloads.some((transfer) => isTransferActive(transfer) || isTransferPaused(transfer));

    const updateProgress = () => {
        const downloadLinksProgresses = getDownloadsLinksProgresses();

        // In case of "Download all" (which has no selected item) from folder
        // share, the top folder is included in progresses as well which needs
        // to be excluded to not count progress twice. But in case of file
        // share the root item must be included otherwise no progress would
        // be tracked.
        const progressInfo = Object.entries(downloadLinksProgresses).reduce(
            (previousValue, [linkId, { progress, total }]) => {
                if (
                    (linkId !== rootItem.linkId || Object.keys(downloadLinksProgresses).length === 1) &&
                    total !== undefined
                ) {
                    return {
                        progress: previousValue.progress + progress,
                        total: previousValue.total + total!,
                    };
                } else {
                    return previousValue;
                }
            },
            {
                progress: 0,
                total: 0,
            }
        );
        setDownloadedSize(progressInfo.progress);
        setTotalSize(progressInfo.total);
    };

    // Enrich link date with download progress. Downloads changes only when
    // status changes, not the progress, so if download is active, it needs
    // to run in interval until download is finished.
    useEffect(() => {
        updateProgress();

        if (!downloads.some(isTransferActive)) {
            // Progresses are not handled by state and might be updated
            // without notifying a bit after downloads state is changed.
            const id = setTimeout(updateProgress, 500);
            return () => {
                clearTimeout(id);
            };
        }

        const id = setInterval(updateProgress, 500);
        return () => {
            clearInterval(id);
        };
    }, [downloads]);

    useEffect(() => {
        if (isDownloading === false && Boolean(totalSize)) {
            setTotalSize(0);
            setDownloadedSize(0);
        }
    }, [isDownloading]);

    let idleText: string;

    if (rootItem.isFile) {
        idleText = c('Action').t`Download`;
    } else {
        idleText = count ? c('Action').t`Download (${count})` : c('Action').t`Download all`;
    }

    const percentageValue = totalSize !== 0 ? Math.round((100 * downloadedSize) / totalSize) : 0;

    const inProgressText = c('Label').jt`Downloading ${percentageValue}%`;

    return (
        <Button
            className={clsx(['self-center my-auto', className])}
            color="norm"
            onClick={handleDownload}
            loading={isDownloading}
        >
            {isDownloading ? inProgressText : idleText}
            {!isDownloading ? <Icon name="arrow-down-line" className="ml-2" /> : null}
        </Button>
    );
}
