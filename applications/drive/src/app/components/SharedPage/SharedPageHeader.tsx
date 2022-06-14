import { c } from 'ttag';

import { Button, Tooltip, TooltipType } from '@proton/components';

import {
    isTransferActive,
    isTransferPaused,
    isTransferPausedByConnection,
    isTransferDone,
    isTransferFailed,
    isTransferCanceled,
} from '../../utils/transfer';
import { DecryptedLink, useDownload } from '../../store';
import { useSelection } from '../FileBrowser/state/useSelection';
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
                <DownloadTooltip downloads={downloads}>
                    <Button color="norm" onClick={onDownload} loading={isDownloading}>
                        <span className="text-no-wrap">
                            {count ? c('Action').t`Download (${count})` : c('Action').t`Download all`}
                        </span>
                    </Button>
                </DownloadTooltip>
            </div>
        </>
    );
}

function DownloadTooltip({ downloads, children }: { downloads: any; children: React.ReactElement }) {
    let type: TooltipType = 'info';
    let title;

    if (downloads.some(isTransferPausedByConnection)) {
        type = 'warning';
        title = c('Info').t`Download paused due to connection issue; it will resume automatically`;
    }

    if (downloads.some(isTransferDone)) {
        title = c('Info').t`Download finished`;
    }

    if (downloads.some(isTransferFailed)) {
        type = 'error';
        const error = downloads[0].error;
        if (error) {
            title = c('Info').t`Download failed due to ${error}`;
        } else {
            title = c('Info').t`Download failed`;
        }
    }

    if (downloads.some(isTransferCanceled)) {
        type = 'warning';
        title = c('Info').t`Download canceled`;
    }

    return (
        <Tooltip type={type} isOpen={!!title} title={title}>
            {children}
        </Tooltip>
    );
}
