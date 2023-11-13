import { useMemo } from 'react';

import { Vr } from '@proton/atoms';
import { Toolbar } from '@proton/components';

import { DecryptedLink } from '../../../store';
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

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            return null;
        }

        return (
            <>
                <PreviewButton selectedLinks={selectedItems} />
                <DownloadButton selectedLinks={selectedItems} disabledFolders />
                <Vr className="section-toolbar--hide-alone" />
                <DetailsButton selectedLinks={selectedItems} />
                <Vr />
                <RestoreFromTrashButton selectedLinks={selectedItems} />
                <DeletePermanentlyButton selectedLinks={selectedItems} />
            </>
        );
    };

    return (
        <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container">
            <div className="gap-2 flex flex-nowrap flex-item-noshrink">{renderSelectionActions()}</div>
            <span className="ml-auto flex flex-nowrap flex-item-noshrink">
                {selectedItems.length > 0 && <Vr className="hidden lg:flex mx-2" />}
                <LayoutButton />
            </span>
        </Toolbar>
    );
};

export default TrashToolbar;
