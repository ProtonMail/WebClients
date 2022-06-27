import { useEffect } from 'react';
import { c } from 'ttag';

import { Button, NotificationType, useNotifications } from '@proton/components';

import {
    isTransferActive,
    isTransferPaused,
    isTransferPausedByConnection,
    isTransferDone,
    isTransferFailed,
    isTransferCanceled,
} from '../../utils/transfer';
import { DecryptedLink, useDownload } from '../../store';
import { useSelection } from '../FileBrowser';
import { Download } from './../TransferManager/transfer';
import { getSelectedItems } from '../sections/helpers';

interface Props {
    children: React.ReactNode;
    token: string;
    rootItem: DecryptedLink;
    items: DecryptedLink[];
}

export default function SharedPageHeader({ children, token, rootItem, items }: Props) {
    const selectionControls = useSelection();
    const { downloads, download, clearDownloads } = useDownload();
    useDownloadNotification(downloads);

    const selectedItems = getSelectedItems(items || [], selectionControls?.selectedItemIds || []);
    const count = selectedItems.length;

    const onDownload = () => {
        // To keep always only one download around.
        clearDownloads();

        const downloadLinks = selectedItems.length
            ? selectedItems.map((link) => ({ ...link, shareId: token }))
            : [{ ...rootItem, shareId: token }];

        void download(downloadLinks);
    };

    const isDownloading = downloads.some((transfer) => isTransferActive(transfer) || isTransferPaused(transfer));

    return (
        <>
            <div className="flex flex-nowrap flex-justify-space-between mb1">
                <div className="flex flex-nowrap flex-item-fluid flex-align-items-center mb0 pb0 mr1 shared-page-layout-header">
                    {children}
                </div>
                <Button color="norm" onClick={onDownload} loading={isDownloading}>
                    <span className="text-no-wrap">
                        {count ? c('Action').t`Download (${count})` : c('Action').t`Download all`}
                    </span>
                </Button>
            </div>
        </>
    );
}

function useDownloadNotification(downloads: Download[]) {
    const { createNotification, hideNotification } = useNotifications();

    let type: NotificationType = 'info';
    let text: string | undefined;
    let expiration: number | undefined = -1;
    let disableAutoClose = true;

    if (downloads.some(isTransferPausedByConnection)) {
        type = 'warning';
        text = c('Info').t`Download paused due to connection issue; it will resume automatically`;
    }

    if (downloads.some(isTransferDone)) {
        text = c('Info').t`Download finished`;
        expiration = undefined;
        disableAutoClose = false;
    }

    if (downloads.some(isTransferFailed)) {
        type = 'error';
        const error = downloads[0].error;
        if (error) {
            text = c('Info').t`Download failed due to ${error}`;
        } else {
            text = c('Info').t`Download failed`;
        }
    }

    if (downloads.some(isTransferCanceled)) {
        type = 'warning';
        text = c('Info').t`Download canceled`;
    }

    useEffect(() => {
        if (!text) {
            return;
        }

        const notificationId = createNotification({
            type,
            text,
            expiration,
            disableAutoClose,
        });
        return () => {
            hideNotification(notificationId);
        };
    }, [type, text]);
}
