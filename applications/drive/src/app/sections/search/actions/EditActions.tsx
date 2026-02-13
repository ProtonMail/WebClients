import { Vr } from '@proton/atoms/Vr/Vr';
import { ContextSeparator } from '@proton/components';
import type { OpenInDocsType } from '@proton/shared/lib/helpers/mimetype';

import { DeleteButton } from '../../commonButtons/DeleteButton';
import { DetailsButton } from '../../commonButtons/DetailsButton';
import { DownloadButton } from '../../commonButtons/DownloadButton';
import { OpenInDocsOrSheetsButton } from '../../commonButtons/OpenInDocsOrSheetsButton';
import { PreviewButton } from '../../commonButtons/PreviewButton';
import { RenameButton } from '../../commonButtons/RenameButton';
import type { SearchItemChecker } from './actionsItemChecker';

interface BaseEditActionsProps {
    itemChecker: SearchItemChecker;
    selectedUids: string[];
    onPreview: (uid: string) => void;
    onDownload: (uids: string[]) => void;
    onDetails: (uid: string) => void;
    onRename: (uid: string) => void;
    onTrash: (uids: string[]) => void;
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
    onTrash,
    onOpenDocsOrSheets,
    close,
    buttonType,
}: EditActionsProps) {
    const isContextMenu = buttonType === 'contextMenu';
    const separator = isContextMenu ? <ContextSeparator /> : <Vr />;
    const extraProps = isContextMenu ? { close, buttonType } : { buttonType };
    return (
        <>
            {itemChecker.canPreview && (
                <PreviewButton onClick={() => onPreview(itemChecker.firstItemUid)} {...extraProps} />
            )}
            {itemChecker.canOpenInDocs && (
                <OpenInDocsOrSheetsButton
                    isNative={itemChecker.openInDocsInfo.isNative}
                    type={itemChecker.openInDocsInfo.type}
                    onClick={() => onOpenDocsOrSheets(itemChecker.firstItemUid, itemChecker.openInDocsInfo)}
                    {...extraProps}
                />
            )}
            {itemChecker.canDownload && <DownloadButton onClick={() => onDownload(selectedUids)} {...extraProps} />}
            {/* TODO: Add share button */}
            {/* TODO: Add move button */}

            {(itemChecker.canRename || itemChecker.canShowDetails) && separator}
            {itemChecker.canRename && (
                <RenameButton onClick={() => onRename(itemChecker.firstItemUid)} {...extraProps} />
            )}
            {itemChecker.canShowDetails && (
                <DetailsButton onClick={() => onDetails(itemChecker.firstItemUid)} {...extraProps} />
            )}

            {/* TODO: Add separator and "See version history" for file in context menu */}
            {itemChecker.canDelete && (
                <>
                    {separator}
                    <DeleteButton deletionType="trash" onClick={() => onTrash(selectedUids)} {...extraProps} />
                </>
            )}
            {/* TODO: Add separator and goto parent for context menu */}
        </>
    );
}
