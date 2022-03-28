import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';
import { useEffect } from 'react';

import { ContextMenu } from '@proton/components';

import { ItemContextMenuProps } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import { DetailsButton, DownloadButton, PreviewButton, RenameButton, ShareLinkButton } from '../ContextMenu';
import { StopSharingButton } from './ContextMenuButtons';

const SharedLinksItemContextMenu = ({
    item,
    selectedItems,
    shareId,
    anchorRef,
    isOpen,
    position,
    open,
    close,
}: ItemContextMenuProps) => {
    const isOnlyOneItem = selectedItems.length === 1;
    const hasPreviewAvailable =
        isOnlyOneItem && item.IsFile && item.MIMEType && isPreviewAvailable(item.MIMEType, item.Size);

    useEffect(() => {
        if (position) {
            open();
        }
    }, [position]);

    return (
        <ContextMenu isOpen={isOpen} close={close} position={position} anchorRef={anchorRef}>
            {hasPreviewAvailable && <PreviewButton shareId={shareId} item={item} close={close} />}
            <DownloadButton shareId={shareId} items={selectedItems} close={close} />
            {isOnlyOneItem && <RenameButton shareId={shareId} item={item} close={close} />}
            <DetailsButton shareId={shareId} items={selectedItems} close={close} />
            {isOnlyOneItem && <ShareLinkButton shareId={shareId} item={item} close={close} />}
            <StopSharingButton shareId={shareId} items={selectedItems} close={close} />
        </ContextMenu>
    );
};

export default SharedLinksItemContextMenu;
