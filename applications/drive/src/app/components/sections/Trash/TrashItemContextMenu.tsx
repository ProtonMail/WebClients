import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';
import { useEffect } from 'react';

import { ContextMenu } from '@proton/components';

import { LinkType } from '@proton/shared/lib/interfaces/drive/link';
import { ItemContextMenuProps } from '@proton/shared/lib/interfaces/drive/fileBrowser';
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
        selectedItems.length === 1 &&
        item.Type === LinkType.FILE &&
        item.MIMEType &&
        isPreviewAvailable(item.MIMEType, item.Size);
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
