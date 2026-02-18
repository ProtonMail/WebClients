import { useShallow } from 'zustand/react/shallow';

import { Vr } from '@proton/atoms/Vr/Vr';
import { Toolbar } from '@proton/components';
import isTruthy from '@proton/utils/isTruthy';

import { LayoutButton } from '../../../components/sections/ToolbarButtons';
import { useSelectionStore } from '../../../modules/selection';
import { SearchActions } from './actions/SearchActions';
import { useSearchActions } from './actions/useSearchActions';
import { useSearchViewStore } from './store';

interface SearchResultToolbarProps {
    uids: string[];
}

const getSelectedItemsId = (uids: string[], selectedItemIds: string[]) =>
    selectedItemIds.map((selectedItemId) => uids.find((uid) => selectedItemId === uid)).filter(isTruthy);

export const SearchResultViewToolbar = ({ uids }: SearchResultToolbarProps) => {
    const { selectedItemIds: newSelectedItemIds } = useSelectionStore(
        useShallow((state) => ({
            selectedItemIds: state.selectedItemIds,
        }))
    );

    const selectedItemsIds = getSelectedItemsId(uids, Array.from(newSelectedItemIds));

    const selectedItems = selectedItemsIds
        .map((uid) => useSearchViewStore.getState().getSearchResultItem(uid))
        .filter(isTruthy);

    const actions = useSearchActions();
    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return null;
        }

        return (
            <SearchActions
                buttonType="toolbar"
                onPreview={actions.handlePreview}
                onDetails={actions.handleDetails}
                onDownload={actions.handleDownload}
                onRename={actions.handleRename}
                onTrash={actions.handleTrash}
                onGoToParent={actions.handleGoToParent}
                onOpenDocsOrSheets={actions.handleOpenDocsOrSheets}
            />
        );
    };

    return (
        <>
            <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container">
                <div className="gap-2 flex flex-nowrap shrink-0">
                    {renderSelectionActions()}
                    {actions.modals.previewModal}
                    {actions.modals.detailsModal}
                    {actions.modals.renameModal}
                </div>
                <span className="ml-auto flex flex-nowrap shrink-0">
                    {selectedItems.length ? <Vr className="hidden lg:flex mx-2" /> : null}
                    <LayoutButton />
                </span>
            </Toolbar>
        </>
    );
};
