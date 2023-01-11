import { useEffect } from 'react';

import { c } from 'ttag';

import { NotificationType, useNotifications } from '@proton/components';

import {
    isTransferCanceled,
    isTransferDone,
    isTransferFailed,
    isTransferPausedByConnection,
} from '../../../utils/transfer';
import { Download } from '../../TransferManager/transfer';

export function useDownloadNotifications(downloads: Download[]) {
    const { createNotification, hideNotification } = useNotifications();

    let type: NotificationType = 'info';
    let text: string | undefined;
    let expiration: number | undefined = -1;
    let showCloseButton = false;

    if (downloads.some(isTransferPausedByConnection)) {
        type = 'warning';
        text = c('Info').t`Download paused due to connection issue; it will resume automatically`;
    }

    if (downloads.some(isTransferDone)) {
        text = c('Info').t`Download finished`;
        expiration = undefined;
        showCloseButton = true;
    }

    if (downloads.some(isTransferFailed)) {
        type = 'error';
        const error = downloads[0].error;
        if (error) {
            text = c('Info').t`Download failed due to ${error}`;
        } else {
            text = c('Info').t`Download failed`;
        }
        showCloseButton = true;
    }

    if (downloads.some(isTransferCanceled)) {
        type = 'warning';
        text = c('Info').t`Download canceled`;
        expiration = 5000;
        showCloseButton = true;
    }

    useEffect(() => {
        if (!text) {
            return;
        }

        const notificationId = createNotification({
            type,
            text,
            expiration,
            showCloseButton,
        });
        return () => {
            hideNotification(notificationId);
        };
    }, [type, text]);
}
