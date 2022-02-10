import { Toolbar, ToolbarSeparator } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import {
    DetailsButton,
    DownloadButton,
    LayoutButton,
    PreviewButton,
    RenameButton,
    ShareFileButton,
    ShareLinkButton,
} from '../ToolbarButtons';
import { StopSharingButton } from './ToolbarButtons';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
}

const SharedLinksToolbar = ({ shareId, selectedItems }: Props) => {
    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return (
                <>
                    <ShareFileButton shareId={shareId} />
                </>
            );
        }

        return (
            <>
                <PreviewButton shareId={shareId} selectedItems={selectedItems} />
                <DownloadButton shareId={shareId} selectedItems={selectedItems} />
                <ToolbarSeparator />
                <RenameButton shareId={shareId} selectedItems={selectedItems} />
                <DetailsButton shareId={shareId} selectedItems={selectedItems} />
                <ToolbarSeparator />
                <ShareLinkButton shareId={shareId} selectedItems={selectedItems} />
                <StopSharingButton shareId={shareId} selectedItems={selectedItems} />
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

export default SharedLinksToolbar;
