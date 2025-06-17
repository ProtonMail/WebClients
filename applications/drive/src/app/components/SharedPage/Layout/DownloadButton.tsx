import { c } from 'ttag';

import { Button, CircleLoader } from '@proton/atoms';
import type { ThemeColorUnion } from '@proton/colors/types';
import {
    ButtonGroup,
    ContextSeparator,
    Dropdown,
    DropdownMenu,
    DropdownMenuButton,
    Icon,
    usePopperAnchor,
} from '@proton/components';
import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';

import usePublicToken from '../../../hooks/drive/usePublicToken';
import type { DecryptedLink } from '../../../store';
import { useDownload, useDownloadScanFlag } from '../../../store';
import { Actions, countActionWithTelemetry } from '../../../utils/telemetry';
import { isTransferActive, isTransferPaused } from '../../../utils/transfer';
import { useSelection } from '../../FileBrowser';
import { getSelectedItems } from '../../sections/helpers';
import type { PublicLink } from '../interface';
import { useScanAndDownloadInfoModal } from './ScanAndDownloadInfoModal';

export interface DownloadButtonProps {
    rootLink: DecryptedLink;
    items: PublicLink[];
    className?: string;
    color?: ThemeColorUnion;
    disabled?: boolean;
    openInDocs?: (linkId: string, options?: { redirect?: boolean; download?: boolean }) => void;
}

export function DownloadButton({ items, rootLink, openInDocs, disabled }: DownloadButtonProps) {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLDivElement>();
    const { token } = usePublicToken();
    const selectionControls = useSelection();
    const { downloads, download, clearDownloads } = useDownload();
    const [scanAndDownloadInfoModal, showScanAndDownloadInfoModal] = useScanAndDownloadInfoModal();
    const isDownloadScanEnabled = useDownloadScanFlag();

    const selectedItems = getSelectedItems(items || [], selectionControls?.selectedItemIds || []);
    const count = selectedItems.length;

    const handleDownload = (options?: { virusScan: boolean }) => {
        void countActionWithTelemetry(Actions.PublicScanAndDownload);
        // To keep always only one download around.
        clearDownloads();

        // Document downloads are handled in two ways:
        //  1. single files are redirected to the Docs app using `downloadDocument`
        //  2. multiple files are ignored, using `handleContainsDocument` in the queue
        const documentLink =
            count === 1 && isProtonDocsDocument(selectedItems[0].mimeType) ? selectedItems[0] : undefined;

        if (documentLink) {
            // Should never happen to have openInDocs false as the button will be disabled in that case
            if (openInDocs) {
                void openInDocs(documentLink.linkId, { download: true });
            }
            return;
        }

        const downloadLinks = selectedItems.length
            ? selectedItems.map((link) => ({ ...link, shareId: token }))
            : [{ ...rootLink, shareId: token }];

        void download(downloadLinks, options);
    };

    const isDownloading = !!downloads.find((transfer) => isTransferActive(transfer) || isTransferPaused(transfer));

    const buttonTextWithoutScan = count > 1 ? c('Action').t`Download (${count})` : c('Action').t`Download`;
    const buttonTextWithScan = count > 1 ? c('Action').t`Scan & Download (${count})` : c('Action').t`Scan & Download`;

    if (!isDownloadScanEnabled) {
        return (
            <Button
                className="flex items-center gap-2"
                color="weak"
                shape="outline"
                disabled={disabled}
                loading={isDownloading}
                onClick={() => handleDownload()}
                data-testid="download-button"
            >
                <Icon name="arrow-down-line" size={4} />
                {/* Default Download text if scan not available */}
                {buttonTextWithoutScan}
            </Button>
        );
    }

    return (
        <>
            <ButtonGroup className="flex justify-end flex-nowrap" ref={anchorRef} separators={!isDownloading}>
                <Button
                    className="flex items-center gap-2 mr-auto"
                    onClick={() => handleDownload({ virusScan: false })}
                    disabled={disabled || isDownloading}
                    data-testid="download-button"
                    color="weak"
                >
                    <Icon name="arrow-down-line" size={4} />
                    {buttonTextWithoutScan}
                </Button>
                <Button
                    disabled={disabled || isDownloading}
                    data-testid="dropdown-download-button"
                    shape="ghost"
                    size="small"
                    onClick={(e) => {
                        toggle();
                        e.stopPropagation();
                    }}
                >
                    {isDownloading && <CircleLoader />}
                    {!isDownloading && isOpen && (
                        <Icon name="chevron-up-filled" alt={c('Action').t`Hide download options`} />
                    )}
                    {!isDownloading && !isOpen && (
                        <Icon name="chevron-down-filled" alt={c('Action').t`Show more download options`} />
                    )}
                </Button>
            </ButtonGroup>
            <Dropdown anchorRef={anchorRef} isOpen={isOpen} onClose={close}>
                <DropdownMenu>
                    <DropdownMenuButton
                        className="flex items-center gap-2"
                        onClick={() => handleDownload()}
                        data-testid="dropdown-download-button"
                    >
                        <Icon name="arrow-down-line" />
                        {buttonTextWithoutScan}
                    </DropdownMenuButton>
                    <DropdownMenuButton
                        className="flex items-center gap-2"
                        onClick={() => handleDownload({ virusScan: true })}
                        data-testid="scan-download-button"
                    >
                        <Icon name="arrow-down-line" />
                        {buttonTextWithScan}
                    </DropdownMenuButton>
                    <ContextSeparator />
                    <DropdownMenuButton
                        className="flex items-center gap-2"
                        onClick={() => showScanAndDownloadInfoModal({})}
                        data-testid="learn-more"
                    >
                        <Icon name="info-circle" />
                        {c('Info').t`Learn more`}
                    </DropdownMenuButton>
                </DropdownMenu>
            </Dropdown>
            {scanAndDownloadInfoModal}
        </>
    );
}
