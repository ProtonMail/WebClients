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

    const downloadLinksProgresses = getDownloadsLinksProgresses();

    const onDownload = () => {
        // To keep always only one download around.
        clearDownloads();

        const downloadLinks = selectedItems.length
            ? selectedItems.map((link) => ({ ...link, shareId: token }))
            : [{ ...rootItem, shareId: token }];

        void download(downloadLinks);
    };

    const isDownloading = downloads.some((transfer) => isTransferActive(transfer) || isTransferPaused(transfer));

    useEffect(() => {
        // If there is not selectedItems it means "Download all" and we want to exclude rootItem
        const progressInfo = Object.entries(downloadLinksProgresses).reduce(
            (previousValue, [linkId, { progress, total }]) => {
                if (linkId !== rootItem.linkId && total !== undefined) {
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
    }, [downloadLinksProgresses]);

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
            className={clsx(['flex-item-centered-vert', className])}
            color="norm"
            onClick={onDownload}
            loading={isDownloading}
        >
            {isDownloading ? inProgressText : idleText}
            {!isDownloading ? <Icon name="arrow-down-line" className="ml0-5" /> : null}
        </Button>
    );
}
