import { useMemo } from 'react';

import { Vr } from '@proton/atoms';
import { Toolbar } from '@proton/components';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import { type DecryptedLink, useActions } from '../../../store';
import { useSelection } from '../../FileBrowser';
import {
    DetailsButton,
    DownloadButton,
    LayoutButton,
    OpenInDocsButton,
    PreviewButton,
    RenameButton,
    ShareButton,
    ShareLinkButton,
} from '../ToolbarButtons';
import { hasAlbumSelected } from '../ToolbarButtons/utils';
import { getSelectedItems } from '../helpers';
import { StopSharingButton } from './ToolbarButtons';

interface Props {
    shareId: string;
    items: DecryptedLink[];
}

const SharedLinksToolbar = ({ shareId, items }: Props) => {
    const selectionControls = useSelection()!;
    const { renameLink } = useActions();
    const selectedItems = useMemo(
        () => getSelectedItems(items, selectionControls!.selectedItemIds),
        [items, selectionControls!.selectedItemIds]
    );
    const selectedItem = selectedItems.length === 1 ? selectedItems[0] : undefined;

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return (
                <>
                    <ShareButton shareId={shareId} />
                </>
            );
        }

        return (
            <>
                <PreviewButton selectedBrowserItems={selectedItems} />
                <OpenInDocsButton selectedBrowserItems={selectedItems} />
                {hasAlbumSelected(selectedItems) ? undefined : (
                    <>
                        <DownloadButton selectedBrowserItems={selectedItems} />
                        <Vr />
                    </>
                )}

                <RenameButton selectedLinks={selectedItems} renameLink={renameLink} />
                <DetailsButton selectedBrowserItems={selectedItems} />
                {selectedItem && (
                    <>
                        <Vr />
                        <ShareLinkButton
                            volumeId={selectedItem.volumeId}
                            shareId={selectedItem.rootShareId}
                            linkId={selectedItem.linkId}
                            isAlbum={selectedItem.type === LinkType.ALBUM}
                        />
                    </>
                )}

                <StopSharingButton selectedLinks={selectedItems} />
            </>
        );
    };

    return (
        <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container">
            <div className="gap-2 flex flex-nowrap shrink-0">{renderSelectionActions()}</div>
            <span className="ml-auto flex flex-nowrap shrink-0">
                <Vr className="hidden lg:flex mx-2" />
                <LayoutButton />
            </span>
        </Toolbar>
    );
};

export default SharedLinksToolbar;
