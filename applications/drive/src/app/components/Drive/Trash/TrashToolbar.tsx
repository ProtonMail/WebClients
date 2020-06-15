import React from 'react';

import { Toolbar, ToolbarSeparator } from 'react-components';

import { useDriveCache } from '../../DriveCache/DriveCacheProvider';
import { useTrashContent } from './TrashContentProvider';
import { DeletePermanentlyButton, EmptyTrashButton, RestoreFromTrashButton } from './ToolbarButtons';

interface Props {
    shareId: string;
}

const TrashToolbar = ({ shareId }: Props) => {
    const cache = useDriveCache();
    const { fileBrowserControls } = useTrashContent();
    const { selectedItems } = fileBrowserControls;
    const trashItems = shareId ? cache.get.trashMetas(shareId) : [];

    return (
        <Toolbar>
            {
                <>
                    <RestoreFromTrashButton shareId={shareId} disabled={!selectedItems.length} />
                    <ToolbarSeparator />
                    <DeletePermanentlyButton shareId={shareId} disabled={!selectedItems.length} />
                </>
            }
            {<EmptyTrashButton shareId={shareId} disabled={!trashItems.length} />}
        </Toolbar>
    );
};

export default TrashToolbar;
