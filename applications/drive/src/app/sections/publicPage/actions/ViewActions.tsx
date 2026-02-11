import { ContextSeparator } from '@proton/components/index';
import type { OpenInDocsType } from '@proton/shared/lib/helpers/mimetype';

import { DetailsButton } from '../../commonButtons/DetailsButton';
import { DownloadButton } from '../../commonButtons/DownloadButton';
import { OpenInDocsOrSheetsButton } from '../../commonButtons/OpenInDocsOrSheetsButton';
import { PreviewButton } from '../../commonButtons/PreviewButton';
import type { PublicItemChecker } from './actionsItemsChecker';

interface BaseViewActionsProps {
    itemChecker: PublicItemChecker;
    selectedUids: string[];
    onPreview: (uid: string) => void;
    onDownload: (uids: string[], shouldScan?: boolean) => void;
    onDetails: (uid: string) => void;
    onOpenDocsOrSheets: (uid: string, openInDocs: OpenInDocsType) => void;
}

interface ContextMenuViewActionsProps extends BaseViewActionsProps {
    buttonType: 'contextMenu';
    close: () => void;
}

interface ToolbarViewActionsProps extends BaseViewActionsProps {
    buttonType: 'toolbar';
    close?: never;
}

type ViewActionsProps = ContextMenuViewActionsProps | ToolbarViewActionsProps;

export function ViewActions({
    itemChecker,
    selectedUids,
    onPreview,
    onDownload,
    onDetails,
    onOpenDocsOrSheets,
    close,
    buttonType,
}: ViewActionsProps) {
    const firstItemUid = selectedUids.at(0);
    const openInDocsInfo = itemChecker.openInDocsInfo;

    return (
        <>
            {itemChecker.hasPreviewAvailable && itemChecker.isSingleSelection && firstItemUid && (
                <>
                    <PreviewButton
                        onClick={() => onPreview(firstItemUid)}
                        {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                    />
                    <ContextSeparator />
                </>
            )}
            {itemChecker.isSingleSelection && openInDocsInfo && firstItemUid && (
                <OpenInDocsOrSheetsButton
                    isNative={openInDocsInfo.isNative}
                    type={openInDocsInfo.type}
                    onClick={() => onOpenDocsOrSheets(firstItemUid, openInDocsInfo)}
                    {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                />
            )}
            <DownloadButton
                onClick={() => onDownload(selectedUids)}
                {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
            />
            {itemChecker.canScanMalware && (
                <DownloadButton
                    onClick={() => onDownload(selectedUids, true)}
                    withScan
                    {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                />
            )}

            {itemChecker.isSingleSelection && firstItemUid && (
                <>
                    <ContextSeparator />
                    <DetailsButton
                        onClick={() => onDetails(firstItemUid)}
                        {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                    />
                </>
            )}
        </>
    );
}
