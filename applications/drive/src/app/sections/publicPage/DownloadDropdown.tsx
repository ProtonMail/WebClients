import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Dropdown, DropdownMenu, DropdownMenuButton, usePopperAnchor } from '@proton/components';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';

import { useScanAndDownloadInfoModal } from '../../modals/ScanAndDownloadInfoModal';

export interface DownloadDropdownProps {
    onDownload: () => void;
    onScanAndDownload: () => void;
    nbSelected?: number;
    disabled?: boolean;
    isLoading?: boolean;
}

export function DownloadDropdown({
    onDownload,
    onScanAndDownload,
    nbSelected,
    disabled = false,
    isLoading = false,
}: DownloadDropdownProps) {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();
    const [scanAndDownloadInfoModal, showScanAndDownloadInfoModal] = useScanAndDownloadInfoModal();

    const buttonTextWithoutScan = nbSelected === 0 ? c('Action').t`Download` : c('Action').t`Download (${nbSelected})`;
    const buttonTextWithScan =
        nbSelected === 0 ? c('Action').t`Scan & Download` : c('Action').t`Scan & Download (${nbSelected})`;

    return (
        <>
            <Button
                ref={anchorRef}
                className="flex items-center gap-2 mr-auto"
                onClick={(e) => {
                    toggle();
                    e.stopPropagation();
                }}
                disabled={disabled || isLoading}
                data-testid="download-button"
                color="weak"
                shape="ghost"
            >
                <IcArrowDownLine size={4} />
                {buttonTextWithoutScan}
            </Button>
            <Dropdown anchorRef={anchorRef} isOpen={isOpen} onClose={close}>
                <DropdownMenu>
                    <DropdownMenuButton
                        className="flex items-center gap-2"
                        onClick={() => {
                            onDownload();
                            close();
                        }}
                        data-testid="dropdown-download-button"
                    >
                        <IcArrowDownLine />
                        {buttonTextWithoutScan}
                    </DropdownMenuButton>
                    <div className="relative">
                        <DropdownMenuButton
                            className="flex items-center gap-2 pr-11"
                            onClick={() => {
                                onScanAndDownload();
                                close();
                            }}
                            data-testid="scan-download-button"
                        >
                            <IcArrowDownLine />
                            {buttonTextWithScan}
                        </DropdownMenuButton>
                        <button
                            className="absolute right-0 top-0 bottom-0 mr-4"
                            aria-label={c('Info').t`Learn more`}
                            onClick={(e) => {
                                showScanAndDownloadInfoModal({});
                                e.stopPropagation();
                            }}
                        >
                            <Tooltip title={c('Info').t`Learn more`}>
                                <span className="flex items-center">
                                    <IcInfoCircle />
                                </span>
                            </Tooltip>
                        </button>
                    </div>
                </DropdownMenu>
            </Dropdown>
            {scanAndDownloadInfoModal}
        </>
    );
}
