import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import type { ThemeColorUnion } from '@proton/colors/types';
import {
    ContextSeparator,
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    usePopperAnchor,
} from '@proton/components';

import usePublicToken from '../../../hooks/drive/usePublicToken';
import type { DecryptedLink } from '../../../store';
import { useDownload, useDownloadScanFlag } from '../../../store';
import { Actions, countActionWithTelemetry } from '../../../utils/telemetry';
import { isTransferActive, isTransferPaused } from '../../../utils/transfer';
import { useSelection } from '../../FileBrowser';
import { getSelectedItems } from '../../sections/helpers';
import type { PublicLink } from '../interface';
import { useScanAndDownloadInfoModal } from './ScanAndDownloadInfoModal';
import { useDownloadNotifications } from './useDownloadNotifications';

export interface DownloadButtonProps {
    rootItem: DecryptedLink;
    items: PublicLink[];
    className?: string;
    color?: ThemeColorUnion;
    disabled?: boolean;
}

export function DownloadButton({ items, rootItem, disabled }: DownloadButtonProps) {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLDivElement>();
    const { token } = usePublicToken();
    const selectionControls = useSelection();
    const { downloads, download, clearDownloads } = useDownload();
    const [scanAndDownloadInfoModal, showScanAndDownloadInfoModal] = useScanAndDownloadInfoModal();
    const isDownloadScanEnabled = useDownloadScanFlag();

    useDownloadNotifications(downloads);

    const selectedItems = getSelectedItems(items || [], selectionControls?.selectedItemIds || []);
    const count = selectedItems.length;

    const handleDownload = (options?: { virusScan: boolean }) => {
        countActionWithTelemetry(Actions.PublicScanAndDownload);
        // To keep always only one download around.
        clearDownloads();

        const downloadLinks = selectedItems.length
            ? selectedItems.map((link) => ({ ...link, shareId: token }))
            : [{ ...rootItem, shareId: token }];

        void download(downloadLinks, options);
    };

    const isDownloading = !!downloads.find((transfer) => isTransferActive(transfer) || isTransferPaused(transfer));

    const buttonTextWithScan = count > 1 ? c('Action').t`Download (${count})` : c('Action').t`Download`;
    const buttonTextWithoutScan =
        count > 1 ? c('Action').t`Download without scanning (${count})` : c('Action').t`Download without scanning`;

    if (!isDownloadScanEnabled) {
        return (
            <Button
                className="flex flex-column gap-4 py-3 min-w-custom"
                style={{
                    '--min-w-custom': '8.25rem',
                }}
                color="weak"
                shape="outline"
                disabled={disabled || isDownloading}
                onClick={() => handleDownload()}
                data-testid="download-button"
            >
                <div className="flex items-center gap-2">
                    <Icon name="arrow-down-line" size={4} />
                    {isDownloading && <CircleLoader />}
                </div>
                {/* Default Download text if scan not available */}
                {buttonTextWithScan}
            </Button>
        );
    }

    return (
        <>
            <div className="relative md:w-full">
                <Button
                    className="w-full h-full flex gap-2 py-2 items-start justify-center text-left flex-column md:gap-4 md:py-3"
                    onClick={() => handleDownload({ virusScan: true })}
                    disabled={disabled || isDownloading}
                    data-testid="scan-download-button"
                    color="weak"
                >
                    <div className="w-full flex items-center gap-2" ref={anchorRef}>
                        <Icon name="arrow-down-line" size={4} />
                        {isDownloading && <CircleLoader />}
                    </div>
                    {buttonTextWithScan}
                </Button>
                <Button
                    disabled={disabled || isDownloading}
                    data-testid="dropdown-download-button"
                    className="absolute right-custom border-none top-custom"
                    style={{
                        '--top-custom': '.5rem',
                        '--right-custom': '.5rem',
                    }}
                    shape="ghost"
                    size="small"
                    icon
                    onClick={(e) => {
                        toggle();
                        e.stopPropagation();
                    }}
                >
                    <Icon name="three-dots-vertical" alt={c('Action').t`More options`} />
                </Button>
            </div>
            <Dropdown anchorRef={anchorRef} isOpen={isOpen} onClose={close}>
                <DropdownMenu>
                    <DropdownMenuButton
                        className="text-left"
                        onClick={() => handleDownload({ virusScan: true })}
                        data-testid="scan-download-button"
                    >
                        <Icon name="arrow-down-line" className="mr-2" />
                        {buttonTextWithScan}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="text-left"
                        onClick={() => handleDownload()}
                        data-testid="download-button"
                    >
                        <Icon name="arrow-down-line" className="mr-2" />
                        {buttonTextWithoutScan}
                    </DropdownMenuButton>
                    <ContextSeparator />
                    <DropdownMenuButton
                        className="text-left"
                        onClick={() => showScanAndDownloadInfoModal({})}
                        data-testid="learn-more"
                    >
                        <Icon name="info-circle" className="mr-2" />
                        {c('Info').t`Learn more`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
            {scanAndDownloadInfoModal}
        </>
    );
}
