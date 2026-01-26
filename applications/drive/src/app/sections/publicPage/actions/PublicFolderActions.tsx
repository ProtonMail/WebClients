import { useShallow } from 'zustand/react/shallow';

import type { OpenInDocsType } from '@proton/shared/lib/helpers/mimetype';
import isTruthy from '@proton/utils/isTruthy';

import { useSelectionStore } from '../../../modules/selection';
import { usePublicFolderStore } from '../usePublicFolder.store';
import { EditActions } from './EditActions';
import { ViewActions } from './ViewActions';
import { createActionsItemChecker } from './actionsItemsChecker';

interface BasePublicFolderActionsProps {
    onPreview: (uid: string) => void;
    onDetails: (uid: string) => void;
    onDownload: (uids: string[]) => Promise<void>;
    onRename: (uid: string) => void;
    onDelete: (uids: string[]) => void;
    onOpenDocsOrSheets: (uid: string, openInDocs: OpenInDocsType) => void;
}

interface ContextMenuPublicFolderActionsProps extends BasePublicFolderActionsProps {
    buttonType: 'contextMenu';
    close: () => void;
}

interface ToolbarPublicFolderActionsProps extends BasePublicFolderActionsProps {
    buttonType: 'toolbar';
    close?: never;
}

type PublicFolderActionsProps = ContextMenuPublicFolderActionsProps | ToolbarPublicFolderActionsProps;

export function PublicFolderActions({
    close,
    buttonType,
    onPreview,
    onDownload,
    onDetails,
    onRename,
    onDelete,
    onOpenDocsOrSheets,
}: PublicFolderActionsProps) {
    const { selectedUids } = useSelectionStore(
        useShallow((state) => ({
            selectedUids: Array.from(state.selectedItemIds.values()),
        }))
    );

    const items = selectedUids.map(usePublicFolderStore.getState().getFolderItem).filter(isTruthy);

    const itemChecker = createActionsItemChecker(items);

    return (
        <>
            {itemChecker.canEdit ? (
                <EditActions
                    itemChecker={itemChecker}
                    selectedUids={selectedUids}
                    onPreview={onPreview}
                    onDownload={onDownload}
                    onDetails={onDetails}
                    onRename={onRename}
                    onDelete={onDelete}
                    onOpenDocsOrSheets={onOpenDocsOrSheets}
                    {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                />
            ) : (
                <ViewActions
                    itemChecker={itemChecker}
                    selectedUids={selectedUids}
                    onPreview={onPreview}
                    onDownload={onDownload}
                    onDetails={onDetails}
                    onOpenDocsOrSheets={onOpenDocsOrSheets}
                    {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
                />
            )}
        </>
    );
}
