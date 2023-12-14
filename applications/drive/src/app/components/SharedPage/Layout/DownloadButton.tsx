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
    const { token } = usePublicToken();
    const selectionControls = useSelection();
    const { downloads, download, clearDownloads } = useDownload();

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

    let idleText: string;

    if (rootItem.isFile) {
        idleText = c('Action').t`Download`;
    } else {
        idleText = count ? c('Action').t`Download (${count})` : c('Action').t`Download all`;
    }

    const inProgressText = c('Label').t`Downloading`;

    return (
        <Button
            className={clsx(['self-center my-auto', className])}
            color={isDownloading ? 'weak' : 'norm'}
            onClick={handleDownload}
            loading={isDownloading}
        >
            {isDownloading ? inProgressText : idleText}
            {!isDownloading ? <Icon name="arrow-down-line" className="ml-2" /> : null}
        </Button>
    );
}
