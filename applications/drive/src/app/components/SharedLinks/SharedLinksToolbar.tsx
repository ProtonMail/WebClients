import { Toolbar, ToolbarSeparator } from '@proton/components';

import { useSharedLinksContent } from './SharedLinksContentProvider';
import {
    DetailsButton,
    DownloadButton,
    LayoutDropdown,
    PreviewButton,
    RenameButton,
    ShareLinkButton,
} from '../FileBrowser/ToolbarButtons';
import StopSharingButton from './ToolbarButtons/StopSharingButton';

interface Props {
    shareId: string;
}

const SharedLinksToolbar = ({ shareId }: Props) => {
    const { fileBrowserControls } = useSharedLinksContent();
    const { selectedItems } = fileBrowserControls;

    return (
        <Toolbar>
            <PreviewButton shareId={shareId} selectedItems={selectedItems} />
            <DownloadButton shareId={shareId} selectedItems={selectedItems} />
            <ToolbarSeparator />
            <RenameButton shareId={shareId} selectedItems={selectedItems} />
            <DetailsButton shareId={shareId} selectedItems={selectedItems} />
            <ToolbarSeparator />
            <ShareLinkButton shareId={shareId} selectedItems={selectedItems} />
            <StopSharingButton shareId={shareId} disabled={!selectedItems.length} />

            <span className="mlauto flex">
                <LayoutDropdown />
            </span>
        </Toolbar>
    );
};

export default SharedLinksToolbar;
