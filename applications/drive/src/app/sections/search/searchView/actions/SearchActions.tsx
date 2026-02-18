import { useShallow } from 'zustand/react/shallow';

import type { OpenInDocsType } from '@proton/shared/lib/helpers/mimetype';
import isTruthy from '@proton/utils/isTruthy';

import { useSelectionStore } from '../../../../modules/selection';
import { sendErrorReport } from '../../../../utils/errorHandling';
import { useSearchViewStore } from '../store';
import { EditActions } from './EditActions';
import { createActionsItemChecker } from './actionsItemChecker';

interface BaseSearchActionsProps {
    onPreview: (uid: string) => void;
    onDetails: (uid: string) => void;
    onDownload: (uids: string[]) => Promise<void>;
    onRename: (uid: string) => void;
    onTrash: (uids: string[]) => void;
    onGoToParent: (parentNodeUid: string) => void;
    onOpenDocsOrSheets: (uid: string, openInDocs: OpenInDocsType) => void;
}

interface ContextMenuSearchActionsProps extends BaseSearchActionsProps {
    buttonType: 'contextMenu';
    close: () => void;
}

interface ToolbarSearchActionsProps extends BaseSearchActionsProps {
    buttonType: 'toolbar';
    close?: never;
}

export type SearchActionsProps = ContextMenuSearchActionsProps | ToolbarSearchActionsProps;

export function SearchActions({
    close,
    buttonType,
    onPreview,
    onDownload,
    onDetails,
    onRename,
    onTrash,
    onGoToParent,
    onOpenDocsOrSheets,
}: SearchActionsProps) {
    const { selectedUids } = useSelectionStore(
        useShallow((state) => ({
            selectedUids: Array.from(state.selectedItemIds.values()),
        }))
    );
    const items = selectedUids.map(useSearchViewStore.getState().getSearchResultItem).filter(isTruthy);
    const itemChecker = createActionsItemChecker(items, buttonType);
    if (!itemChecker.hasAtLeastOneSelectedItem) {
        // No actions when nothing is selected.
        return null;
    }

    if (!itemChecker.canEdit) {
        // Currently the search is only indexing files in the MyFiles volume where the user
        // should always have a edit permissions.
        // TODO: Add readonly search actions when we add readonly volumes/nodes.
        sendErrorReport(new Error('Missing action implementations for view-only search results'));
        return null;
    }

    return (
        <EditActions
            itemChecker={itemChecker}
            selectedUids={selectedUids}
            onPreview={onPreview}
            onDownload={onDownload}
            onDetails={onDetails}
            onRename={onRename}
            onTrash={onTrash}
            onGoToParent={onGoToParent}
            onOpenDocsOrSheets={onOpenDocsOrSheets}
            {...(buttonType === 'contextMenu' ? { close, buttonType } : { buttonType })}
        />
    );
}
