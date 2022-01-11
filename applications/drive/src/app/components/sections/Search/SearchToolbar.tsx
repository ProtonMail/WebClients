import { Toolbar, ToolbarSeparator } from '@proton/components';
import { MoveToFolderButton, MoveToTrashButton } from '../Drive/ToolbarButtons';

import {
    DetailsButton,
    DownloadButton,
    LayoutButton,
    PreviewButton,
    RenameButton,
    ShareLinkButton,
} from '../ToolbarButtons';
import { useSearchContent } from './SearchContentProvider';

interface Props {
    shareId: string;
}

// TODO: Mobile
export const SearchToolbar = ({ shareId }: Props) => {
    const { fileBrowserControls } = useSearchContent();
    const { selectedItems } = fileBrowserControls;

    const isOnlyOneItem = selectedItems.length === 1;
    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return null;
        }

        const activeFolder = {
            shareId,
            linkId: selectedItems[0].ParentLinkID,
        };

        return (
            <>
                <PreviewButton shareId={shareId} selectedItems={selectedItems} />
                <ToolbarSeparator />
                <DownloadButton shareId={shareId} selectedItems={selectedItems} disabledFolders />
                <ShareLinkButton shareId={shareId} selectedItems={selectedItems} />
                <ToolbarSeparator />
                {isOnlyOneItem && <MoveToFolderButton sourceFolder={activeFolder} selectedItems={selectedItems} />}
                <RenameButton shareId={shareId} selectedItems={selectedItems} />
                <DetailsButton shareId={shareId} selectedItems={selectedItems} />
                {isOnlyOneItem && (
                    <>
                        <ToolbarSeparator />
                        <MoveToTrashButton sourceFolder={activeFolder} selectedItems={selectedItems} />
                    </>
                )}
            </>
        );
    };

    return (
        <Toolbar>
            {renderSelectionActions()}
            <span className="mlauto flex">
                <LayoutButton />
            </span>
        </Toolbar>
    );
};
