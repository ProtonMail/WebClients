import { c } from 'ttag';

import { Vr } from '@proton/atoms';
import { Toolbar } from '@proton/components';
import { Icon, ToolbarButton } from '@proton/components';
import isTruthy from '@proton/utils/isTruthy';

import { useSelection } from '../../../components/FileBrowser';
import {
    DetailsButton,
    DownloadButton,
    LayoutButton,
    PreviewButton,
} from '../../../components/sections/ToolbarButtons';
import type { LegacyItem } from '../../../utils/sdk/mapNodeToLegacyItem';
import { useTrashNodes } from '../useTrashNodes';
import { useTrashNotifications } from '../useTrashNotifications';

const getSelectedItems = (items: LegacyItem[], selectedItemIds: string[]): LegacyItem[] =>
    selectedItemIds
        .map((selectedItemId) => items.find(({ isLocked, id }) => !isLocked && selectedItemId === id))
        .filter(isTruthy);

export const TrashToolbar = ({ trashView }: { trashView: ReturnType<typeof useTrashNodes> }) => {
    const selectionControls = useSelection()!;
    const { confirmModal, createDeleteConfirmModal } = useTrashNotifications();
    const { restoreNodes, deleteNodes } = useTrashNodes();
    const { trashNodes } = trashView;
    const selectedItems = getSelectedItems(trashNodes, selectionControls!.selectedItemIds);

    // Opening a file preview opens the file in the context of folder.
    // For photos in the photo stream, it is fine as it is regular folder.
    // But photos in albums only (uploaded by other users) are not in the
    // context of folder and it requires dedicated album endpoints to load
    // "folder". We do not support this in regular preview, so the easiest
    // is to disable opening preview for such a link.
    // In the future, ideally we want trash of photos to separate to own
    // screen or app, then it will not be a problem. In mid-term, we want
    // to open preview without folder context - that is to not redirect to
    // FolderContainer, but open preview on the same page. That will also
    // fix the problem with returning back to trash and stay on the same
    // place in the view.
    const disabledPreview =
        selectedItems.length > 0 &&
        selectedItems[0].photoProperties?.albums.some((album) => album.albumLinkId === selectedItems[0].parentLinkId);

    const handleDelete = () => {
        createDeleteConfirmModal(selectedItems, () => deleteNodes(selectedItems));
    };

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return null;
        }

        return (
            <>
                {!disabledPreview && <PreviewButton selectedBrowserItems={selectedItems} />}
                <DownloadButton selectedBrowserItems={selectedItems} disabledFolders />
                <Vr className="section-toolbar--hide-alone" />
                <DetailsButton selectedBrowserItems={selectedItems} />
                <Vr />
                <ToolbarButton
                    title={c('Action').t`Restore from trash`}
                    icon={<Icon name="arrow-rotate-right" />}
                    onClick={() => restoreNodes(selectedItems)}
                    data-testid="toolbar-restore"
                />
                <ToolbarButton
                    title={c('Action').t`Delete permanently`}
                    icon={<Icon name="cross-circle" />}
                    onClick={() => handleDelete()}
                    data-testid="toolbar-delete"
                />
                {confirmModal}
            </>
        );
    };

    return (
        <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container">
            <div className="gap-2 flex flex-nowrap shrink-0">{renderSelectionActions()}</div>
            <span className="ml-auto flex flex-nowrap shrink-0">
                {selectedItems.length > 0 && <Vr className="hidden lg:flex mx-2" />}
                <LayoutButton />
            </span>
        </Toolbar>
    );
};
