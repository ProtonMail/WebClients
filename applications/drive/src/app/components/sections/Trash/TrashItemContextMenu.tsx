import { useEffect } from 'react';

import { ContextMenu, isPreviewAvailable } from '@proton/components';

import { LinkType } from '../../../interfaces/link';
import { ItemContextMenuProps } from '../../FileBrowser';
import { PreviewButton, DownloadButton, DetailsButton } from '../ContextMenu';
import { DeletePermanentlyButton, RestoreFromTrashButton } from './ContextMenuButtons';

const TrashItemContextMenu = ({
    item,
    selectedItems,
    shareId,
    anchorRef,
    isOpen,
    position,
    open,
    close,
}: ItemContextMenuProps) => {
    const hasPreviewAvailable =
        selectedItems.length === 1 && item.Type === LinkType.FILE && item.MIMEType && isPreviewAvailable(item.MIMEType);
    const hasDownloadAvailable = !selectedItems.some((item) => item.Type === LinkType.FOLDER);

    useEffect(() => {
        if (position) {
            open();
        }
    }, [position]);

    return (
        <ContextMenu isOpen={isOpen} close={close} position={position} anchorRef={anchorRef}>
            {hasPreviewAvailable && <PreviewButton shareId={shareId} item={item} close={close} />}
            {hasDownloadAvailable && <DownloadButton shareId={shareId} items={selectedItems} close={close} />}
            <DetailsButton shareId={shareId} items={selectedItems} close={close} />
            <RestoreFromTrashButton shareId={shareId} items={selectedItems} close={close} />
            <DeletePermanentlyButton shareId={shareId} items={selectedItems} close={close} />
        </ContextMenu>
    );
};

export default TrashItemContextMenu;
