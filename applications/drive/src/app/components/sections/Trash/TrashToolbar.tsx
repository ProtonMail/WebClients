import { useMemo } from 'react';

import { Vr } from '@proton/atoms';
import { Toolbar } from '@proton/components';

import { DecryptedLink } from '../../../store';
import { useSelection } from '../../FileBrowser';
import { getSelectedItems } from '../helpers';
import { DetailsButton, DownloadButton, LayoutButton, PreviewButton } from '../ToolbarButtons';
import { DeletePermanentlyButton, RestoreFromTrashButton } from './ToolbarButtons';

interface Props {
    shareId: string;
    items: DecryptedLink[];
}

const TrashToolbar = ({ shareId, items }: Props) => {
    const selectionControls = useSelection()!;

    const selectedItems = useMemo(
        () => getSelectedItems(items, selectionControls!.selectedItemIds),
        [items, selectionControls!.selectedItemIds]
    );

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return null;
        }

        return (
            <>
                <PreviewButton shareId={shareId} selectedLinks={selectedItems} />
                <DownloadButton shareId={shareId} selectedLinks={selectedItems} disabledFolders />
                <Vr />
                <DetailsButton shareId={shareId} linkIds={selectionControls.selectedItemIds} />
                <Vr />
                <RestoreFromTrashButton shareId={shareId} selectedLinks={selectedItems} />
                <DeletePermanentlyButton shareId={shareId} selectedLinks={selectedItems} />
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
