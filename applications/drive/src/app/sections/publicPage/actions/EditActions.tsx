import { ContextSeparator } from '@proton/components';
import type { OpenInDocsType } from '@proton/shared/lib/helpers/mimetype';

import { DeleteButton } from '../../commonButtons/DeleteButton';
import { DetailsButton } from '../../commonButtons/DetailsButton';
import { DownloadButton } from '../../commonButtons/DownloadButton';
import { OpenInDocsOrSheetsButton } from '../../commonButtons/OpenInDocsOrSheetsButton';
import { PreviewButton } from '../../commonButtons/PreviewButton';
import { RenameButton } from '../../commonButtons/RenameButton';
import type { PublicItemChecker } from './actionsItemsChecker';

interface BaseEditActionsProps {
    itemChecker: PublicItemChecker;
    selectedUids: string[];
    onPreview: (uid: string) => void;
    onDownload: (uids: string[], shoulScan?: boolean) => void;
    onDetails: (uid: string) => void;
    onRename: (uid: string) => void;
    onDelete: (uids: string[]) => void;
    onOpenDocsOrSheets: (uid: string, openInDocs: OpenInDocsType) => void;
}

interface ContextMenuEditActionsProps extends BaseEditActionsProps {
    buttonType: 'contextMenu';
    close: () => void;
}

interface ToolbarEditActionsProps extends BaseEditActionsProps {
    buttonType: 'toolbar';
    close?: never;
}

type EditActionsProps = ContextMenuEditActionsProps | ToolbarEditActionsProps;

export function EditActions({
    itemChecker,
    selectedUids,
    onPreview,
    onDownload,
    onDetails,
    onRename,
    onDelete,
    onOpenDocsOrSheets,
    close,
    buttonType,
}: EditActionsProps) {
    const firstItemUid = selectedUids.at(0);
    const openInDocsInfo = itemChecker.openInDocsInfo;
    return (
        <>
            {itemChecker.isSingleSelection && itemChecker.hasPreviewAvailable && firstItemUid && (
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
                    <RenameButton
                        onClick={() => onRename(firstItemUid)}
                        {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                    />
                    <DetailsButton
                        onClick={() => onDetails(firstItemUid)}
                        {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                    />
                </>
            )}
            <ContextSeparator />
            <DeleteButton
                deletionType="delete"
                onClick={() => onDelete(selectedUids)}
                {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
            />
        </>
    );
}
