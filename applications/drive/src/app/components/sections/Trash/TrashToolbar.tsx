import { useMemo } from 'react';

import { Vr } from '@proton/atoms';
import { Toolbar } from '@proton/components';

import type { DecryptedLink } from '../../../store';
import { useSelection } from '../../FileBrowser';
import { DetailsButton, DownloadButton, LayoutButton, PreviewButton } from '../ToolbarButtons';
import { getSelectedItems } from '../helpers';
import { DeletePermanentlyButton, RestoreFromTrashButton } from './ToolbarButtons';

interface Props {
    items: DecryptedLink[];
}

const TrashToolbar = ({ items }: Props) => {
    const selectionControls = useSelection()!;

    const selectedItems = useMemo(
        () => getSelectedItems(items, selectionControls!.selectedItemIds),
        [items, selectionControls!.selectedItemIds]
    );

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
                <RestoreFromTrashButton selectedLinks={selectedItems} />
                <DeletePermanentlyButton selectedLinks={selectedItems} />
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

export default TrashToolbar;
