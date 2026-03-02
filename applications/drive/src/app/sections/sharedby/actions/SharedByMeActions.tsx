import { ContextSeparator } from '@proton/components';
import type { OpenInDocsType } from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { DetailsButton } from '../../commonButtons/DetailsButton';
import { DownloadButton } from '../../commonButtons/DownloadButton';
import { OpenInDocsOrSheetsButton } from '../../commonButtons/OpenInDocsOrSheetsButton';
import { PreviewButton } from '../../commonButtons/PreviewButton';
import { RenameButton } from '../../commonButtons/RenameButton';
import { ShareLinkButton } from '../../commonButtons/ShareLinkButton';
import { StopSharingButton } from '../buttons/StopSharingButton';
import type { ItemTypeChecker } from './actionsItemsChecker';

interface BaseSharedByMeActionsProps {
    itemChecker: ItemTypeChecker;
    selectedUids: string[];
    onPreview: (uid: string) => void;
    onDownload: (uids: string[]) => void;
    onDetails: (uid: string) => void;
    onRename: (uid: string) => void;
    onShare: (uid: string) => void;
    onStopSharing: (uid: string) => void;
    onOpenDocsOrSheets: (uid: string, openInDocs: OpenInDocsType) => void;
}

interface ContextMenuSharedByMeActionsProps extends BaseSharedByMeActionsProps {
    buttonType: 'contextMenu';
    close: () => void;
}

interface ToolbarSharedByMeActionsProps extends BaseSharedByMeActionsProps {
    buttonType: 'toolbar';
    close?: never;
}

type SharedByMeActionsProps = ContextMenuSharedByMeActionsProps | ToolbarSharedByMeActionsProps;

export const SharedByMeActions = ({
    itemChecker,
    selectedUids,
    onPreview,
    onDownload,
    onDetails,
    onRename,
    onShare,
    onStopSharing,
    onOpenDocsOrSheets,
    close,
    buttonType,
}: SharedByMeActionsProps) => {
    const firstUid = selectedUids.at(0);
    const openInDocsInfo = itemChecker.openInDocsInfo;
    const hasPreviewAvailable = itemChecker.hasPreviewAvailable(isPreviewAvailable);

    if (selectedUids.length === 0) {
        return null;
    }

    return (
        <>
            {hasPreviewAvailable && firstUid && (
                <>
                    <PreviewButton
                        onClick={() => onPreview(firstUid)}
                        {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                    />
                    <ContextSeparator />
                </>
            )}
            {itemChecker.isOnlyOneItem && openInDocsInfo && firstUid && (
                <OpenInDocsOrSheetsButton
                    isNative={openInDocsInfo.isNative}
                    type={openInDocsInfo.type}
                    onClick={() => onOpenDocsOrSheets(firstUid, openInDocsInfo)}
                    {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                />
            )}
            {itemChecker.canDownload && (
                <DownloadButton
                    onClick={() => onDownload(selectedUids)}
                    {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                />
            )}
            {itemChecker.canRename && firstUid && (
                <>
                    <ContextSeparator />
                    <RenameButton
                        onClick={() => onRename(firstUid)}
                        {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                    />
                </>
            )}
            {firstUid && (
                <DetailsButton
                    onClick={() => onDetails(firstUid)}
                    {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                />
            )}
            {itemChecker.canShare && firstUid && (
                <>
                    <ContextSeparator />
                    <ShareLinkButton
                        onClick={() => onShare(firstUid)}
                        {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                    />
                </>
            )}
            {itemChecker.canStopSharing && firstUid && (
                <>
                    <ContextSeparator />
                    <StopSharingButton
                        onClick={() => onStopSharing(firstUid)}
                        {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                    />
                </>
            )}
        </>
    );
};
