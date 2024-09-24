import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ThemeColorUnion } from '@proton/colors/types';
import {
    ButtonGroup,
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    DropdownSizeUnit,
    Icon,
    usePopperAnchor,
} from '@proton/components';

import usePublicToken from '../../../hooks/drive/usePublicToken';
import type { DecryptedLink } from '../../../store';
import { useDownload } from '../../../store';
import { Actions, countActionWithTelemetry } from '../../../utils/telemetry';
import { isTransferActive, isTransferPaused } from '../../../utils/transfer';
import { useSelection } from '../../FileBrowser';
import { getSelectedItems } from '../../sections/helpers';
import type { PublicLink } from '../interface';
import { ScanAndDownloadSpotlightButton } from './ScanAndDownloadSpotlight';
import { useDownloadNotifications } from './useDownloadNotifications';

export interface DownloadButtonProps {
    rootItem: DecryptedLink;
    items: PublicLink[];
    className?: string;
    isScanAndDownload?: boolean;
    color?: ThemeColorUnion;
    disabled?: boolean;
}

export function DownloadButton({ items, rootItem, isScanAndDownload, disabled }: DownloadButtonProps) {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLDivElement>();
    const { token } = usePublicToken();
    const selectionControls = useSelection();
    const { downloads, download, clearDownloads } = useDownload();

    useDownloadNotifications(downloads);

    const selectedItems = getSelectedItems(items || [], selectionControls?.selectedItemIds || []);
    const count = selectedItems.length;

    const handleDownload = () => {
        countActionWithTelemetry(Actions.PublicDownload);
        // To keep always only one download around.
        clearDownloads();

        const downloadLinks = selectedItems.length
            ? selectedItems.map((link) => ({ ...link, shareId: token }))
            : [{ ...rootItem, shareId: token }];

        void download(downloadLinks);
    };

    const handleScanAndDownload = () => {
        countActionWithTelemetry(Actions.PublicScanAndDownload);
        // To keep always only one download around.
        clearDownloads();

        const downloadLinks = selectedItems.length
            ? selectedItems.map((link) => ({ ...link, shareId: token }))
            : [{ ...rootItem, shareId: token }];

        void download(downloadLinks, { virusScan: true });
    };

    const isDownloading = !!downloads.find((transfer) => isTransferActive(transfer) || isTransferPaused(transfer));
    let buttonText: string = '';
    let buttonTextScanAndDownload: string = '';

    if (rootItem.isFile) {
        buttonText = c('Action').t`Download`;
        buttonTextScanAndDownload = c('Action').t`Scan & Download`;
    } else {
        if (count) {
            buttonText = c('Action').t`Download (${count})`;
            buttonTextScanAndDownload = c('Action').t`Scan & Download (${count})`;
        } else {
            buttonText = c('Action').t`Download all`;
            buttonTextScanAndDownload = c('Action').t`Scan & Download all`;
        }
    }

    if (!isScanAndDownload) {
        return (
            <Button
                color="weak"
                shape="outline"
                loading={isDownloading}
                disabled={disabled}
                onClick={handleDownload}
                data-testid="download-button"
            >
                <Icon name="arrow-down-line" className="mr-2" />
                {buttonText}
            </Button>
        );
    }

    return (
        <div className="flex flex-nowrap items-center gap-4">
            <ScanAndDownloadSpotlightButton className="hidden md:block" />
            <div ref={anchorRef}>
                <ButtonGroup>
                    <Button
                        loading={isDownloading}
                        onClick={handleScanAndDownload}
                        disabled={disabled}
                        data-testid="scan-download-button"
                    >
                        <Icon name="arrow-down-line" className="mr-2" />
                        {buttonTextScanAndDownload}
                    </Button>
                    <DropdownButton
                        hasCaret
                        isOpen={isOpen}
                        onClick={toggle}
                        disabled={isDownloading || disabled}
                        data-testid="dropdown-download-button"
                    />
                </ButtonGroup>
                <Dropdown
                    anchorRef={anchorRef}
                    isOpen={isOpen}
                    onClose={close}
                    size={{
                        width: DropdownSizeUnit.Anchor,
                    }}
                >
                    <DropdownMenu>
                        <DropdownMenuButton
                            className="text-left"
                            onClick={handleDownload}
                            data-testid="download-button"
                        >
                            <Icon name="arrow-down-line" className="mr-2" />
                            {buttonText}
                        </DropdownMenuButton>
                    </DropdownMenu>
                </Dropdown>
            </div>
        </div>
    );
}
