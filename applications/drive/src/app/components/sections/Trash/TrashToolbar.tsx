import { Toolbar, ToolbarSeparator } from '@proton/components';

import { DetailsButton, DownloadButton, LayoutButton, PreviewButton } from '../ToolbarButtons';
import { DeletePermanentlyButton, RestoreFromTrashButton } from './ToolbarButtons';
import { useTrashContent } from './TrashContentProvider';

interface Props {
    shareId: string;
}

const TrashToolbar = ({ shareId }: Props) => {
    const { fileBrowserControls } = useTrashContent();
    const { selectedItems } = fileBrowserControls;

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return null;
        }

        return (
            <>
                <PreviewButton shareId={shareId} selectedItems={selectedItems} />
                <DownloadButton shareId={shareId} selectedItems={selectedItems} disabledFolders />
                <ToolbarSeparator />
                <DetailsButton shareId={shareId} selectedItems={selectedItems} />
                <ToolbarSeparator />
                <RestoreFromTrashButton shareId={shareId} />
                <DeletePermanentlyButton shareId={shareId} />
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

export default TrashToolbar;
