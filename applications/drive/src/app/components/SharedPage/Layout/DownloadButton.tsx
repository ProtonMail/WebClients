import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ThemeColorUnion } from '@proton/colors/types';
import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

import usePublicToken from '../../../hooks/drive/usePublicToken';
import { DecryptedLink, useDownload, useDownloadScanFlag } from '../../../store';
import { isTransferActive, isTransferPaused } from '../../../utils/transfer';
import { useSelection } from '../../FileBrowser';
import { getSelectedItems } from '../../sections/helpers';
import { PublicLink } from '../interface';
import { useDownloadNotifications } from './useDownloadNotifications';

export interface DownloadButtonProps {
    rootItem: DecryptedLink;
    items: PublicLink[];
    className?: string;
    isScanAndDownload?: boolean;
    color?: ThemeColorUnion;
    disabled?: boolean;
    hideIcon?: boolean;
}
export function DownloadButton({
    items,
    className,
    rootItem,
    isScanAndDownload,
    color,
    disabled,
    hideIcon,
}: DownloadButtonProps) {
    const { token } = usePublicToken();
    const selectionControls = useSelection();
    const { downloads, download, clearDownloads } = useDownload();
    const isDownloadScanEnabled = useDownloadScanFlag();

    useDownloadNotifications(downloads);

    const selectedItems = getSelectedItems(items || [], selectionControls?.selectedItemIds || []);
    const count = selectedItems.length;

    const handleDownload = () => {
        // To keep always only one download around.
        clearDownloads();

        const downloadLinks = selectedItems.length
            ? selectedItems.map((link) => ({ ...link, shareId: token }))
            : [{ ...rootItem, shareId: token }];

        const options = isScanAndDownload && isDownloadScanEnabled ? { virusScan: true } : undefined;
        void download(downloadLinks, options);
    };

    const { isDisabled, isDownloading } = downloads.reduce(
        (acc, transfer) => {
            const isLoading = isTransferActive(transfer) || isTransferPaused(transfer);
            if (isLoading) {
                return {
                    isDisabled: true,
                    // The following prop is used to handle Scan and Download.
                    // we want to show spinner only for the button that has been clicked,
                    // but the other has to be disabled at the same time
                    isDownloading: isScanAndDownload ? !!transfer?.options?.virusScan : !transfer?.options?.virusScan,
                };
            }
            return acc;
        },
        { isDisabled: false, isDownloading: false }
    );

    let buttonText: string = '';

    if (rootItem.isFile) {
        buttonText = isScanAndDownload ? c('Action').t`Scan & Download` : c('Action').t`Download`;
    } else {
        if (count) {
            buttonText = isScanAndDownload
                ? c('Action').t`Scan & Download (${count})`
                : c('Action').t`Download (${count})`;
        } else {
            buttonText = isScanAndDownload ? c('Action').t`Scan & Download all` : c('Action').t`Download all`;
        }
    }

    const buttonColor = color || (isDownloading ? 'weak' : 'norm');

    return (
        <Button
            className={clsx(['self-center my-auto', className])}
            color={buttonColor}
            onClick={handleDownload}
            loading={isDownloading}
            data-testid={`${isScanAndDownload ? 'scan-' : ''}download-button`}
            disabled={isDisabled || disabled}
        >
            {buttonText}
            {!isDownloading && !hideIcon ? <Icon name="arrow-down-line" className="ml-2" /> : null}
        </Button>
    );
}
