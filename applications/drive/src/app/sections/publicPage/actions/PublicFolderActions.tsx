import { useShallow } from 'zustand/react/shallow';

import type { useConfirmActionModal } from '@proton/components';
import isTruthy from '@proton/utils/isTruthy';

import type { useDetailsModal } from '../../../modals/DetailsModal';
import type { useRenameModal } from '../../../modals/RenameModal';
import type { usePreviewModal } from '../../../modals/preview';
import { useSelectionStore } from '../../../modules/selection';
import { usePublicFolderStore } from '../usePublicFolder.store';
import { EditActions } from './EditActions';
import { ViewActions } from './ViewActions';
import { createActionsItemChecker } from './actionsItemsChecker';
import { usePublicActions } from './usePublicActions';

interface BasePublicFolderActionsProps {
    showPreviewModal: ReturnType<typeof usePreviewModal>[1];
    showDetailsModal: ReturnType<typeof useDetailsModal>[1];
    showRenameModal: ReturnType<typeof useRenameModal>[1];
    showConfirmModal: ReturnType<typeof useConfirmActionModal>[1];
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
    showPreviewModal,
    showDetailsModal,
    showConfirmModal,
    showRenameModal,
    close,
    buttonType,
}: PublicFolderActionsProps) {
    const { selectedUids } = useSelectionStore(
        useShallow((state) => ({
            selectedUids: Array.from(state.selectedItemIds.values()),
        }))
    );

    const items = selectedUids.map(usePublicFolderStore.getState().getFolderItem).filter(isTruthy);

    const itemChecker = createActionsItemChecker(items);

    const { handlePreview, handleDownload, handleDetails, handleRename, handleDelete } = usePublicActions({
        showPreviewModal,
        showDetailsModal,
        showRenameModal,
        showConfirmModal,
    });

    if (itemChecker.canEdit) {
        return (
            <EditActions
                itemChecker={itemChecker}
                selectedUids={selectedUids}
                onPreview={handlePreview}
                onDownload={handleDownload}
                onDetails={handleDetails}
                onRename={handleRename}
                onDelete={handleDelete}
                {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
            />
        );
    }

    return (
        <ViewActions
            itemChecker={itemChecker}
            selectedUids={selectedUids}
            onPreview={handlePreview}
            onDownload={handleDownload}
            onDetails={handleDetails}
            {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
        />
    );
}
