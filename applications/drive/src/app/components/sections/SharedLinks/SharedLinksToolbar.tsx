import { Toolbar, ToolbarSeparator } from '@proton/components';

import {
    DetailsButton,
    DownloadButton,
    LayoutDropdown,
    PreviewButton,
    RenameButton,
    ShareLinkButton,
} from '../ToolbarButtons';
import { StopSharingButton } from './ToolbarButtons';
import { useSharedLinksContent } from './SharedLinksContentProvider';

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
            <StopSharingButton shareId={shareId} selectedItems={selectedItems} />

            <span className="mlauto flex">
                <LayoutDropdown />
            </span>
        </Toolbar>
    );
};

export default SharedLinksToolbar;
