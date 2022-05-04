import { Vr } from '@proton/atoms';
import { Toolbar } from '@proton/components';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { DetailsButton, DownloadButton, LayoutButton, PreviewButton } from '../ToolbarButtons';
import { DeletePermanentlyButton, RestoreFromTrashButton } from './ToolbarButtons';

interface Props {
    shareId: string;
    selectedItems: FileBrowserItem[];
}

const TrashToolbar = ({ shareId, selectedItems }: Props) => {
    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return null;
        }

        return (
            <>
                <PreviewButton shareId={shareId} selectedItems={selectedItems} />
                <DownloadButton shareId={shareId} selectedItems={selectedItems} disabledFolders />
                <Vr />
                <DetailsButton shareId={shareId} selectedItems={selectedItems} />
                <Vr />
                <RestoreFromTrashButton shareId={shareId} selectedItems={selectedItems} />
                <DeletePermanentlyButton shareId={shareId} selectedItems={selectedItems} />
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
