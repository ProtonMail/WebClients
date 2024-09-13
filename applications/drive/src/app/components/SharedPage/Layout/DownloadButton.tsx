import { useState } from 'react';

import { c } from 'ttag';

import { Button, Href } from '@proton/atoms';
import type { ThemeColorUnion } from '@proton/colors/types';
import {
    ButtonGroup,
    Dropdown,
    DropdownButton,
    DropdownMenu,
    DropdownMenuButton,
    DropdownSizeUnit,
    usePopperAnchor,
} from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import { Spotlight } from '@proton/components/components/spotlight';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import usePublicToken from '../../../hooks/drive/usePublicToken';
import type { DecryptedLink } from '../../../store';
import { useDownload } from '../../../store';
import { Actions, countActionWithTelemetry } from '../../../utils/telemetry';
import { isTransferActive, isTransferPaused } from '../../../utils/transfer';
import { useSelection } from '../../FileBrowser';
import { getSelectedItems } from '../../sections/helpers';
import type { PublicLink } from '../interface';
import { useDownloadNotifications } from './useDownloadNotifications';

export interface DownloadButtonProps {
    rootItem: DecryptedLink;
    items: PublicLink[];
    className?: string;
    isScanAndDownload?: boolean;
    color?: ThemeColorUnion;
    disabled?: boolean;
    partialView?: boolean;
}

const SpotlightContent = () => (
    <div>
        <h5 className="text-semibold mb-3 flex items-center">
            <Icon name="info-circle" size={5} className="mr-2" />
            {c('Info').t`File scanning in Drive`}
        </h5>
        <div className="mb-6">
            {c('Info')
                .t`To help protect you, ${DRIVE_APP_NAME} can scan and block malicious files. You should still only download files from people you trust.`}{' '}
            <Href className="text-no-decoration" href={getKnowledgeBaseUrl('/proton-drive-malware-protection')}>
                {c('Link').t`Learn more`}
            </Href>
        </div>
    </div>
);

const SpotlightFooter = () => (
    <div className="bg-white">
        <div className="flex flex-row items-center">
            <Icon name="lock-check-filled" size={6} className="mr-2 color-disabled" />
            <span className="color-disabled">{c('Info').t`End-to-End Encrypted`}.</span>
            <Href className="color-disabled ml-1" href={getKnowledgeBaseUrl('/proton-drive-malware-protection')}>
                {c('Link').t`Learn more`}
            </Href>
        </div>
    </div>
);
const InfoIcon = ({ className }: { className?: string }) => {
    const [show, setShow] = useState(false);
    const toggleSpotlight = () => setShow((current) => !current);
    const handleClose = () => setShow(false);

    return (
        <Spotlight
            content={<SpotlightContent />}
            footer={<SpotlightFooter />}
            show={show}
            onClose={handleClose}
            originalPlacement="bottom-end"
            size="large"
        >
            <Button
                icon
                shape="ghost"
                className={className}
                onClick={toggleSpotlight}
                aria-label={c('Action').t`Open scan and download info`}
            >
                <Icon name="info-circle" size={4} data-testid="scan-and-download-tooltip" />
            </Button>
        </Spotlight>
    );
};

export function DownloadButton({ items, rootItem, isScanAndDownload, disabled, partialView }: DownloadButtonProps) {
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
        <div className={clsx('flex flex-nowrap items-center gap-4', partialView && 'gap-8 flex-row-reverse')}>
            <InfoIcon className="hidden md:block" />
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
