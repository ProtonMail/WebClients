import { useEffect } from 'react';

import { ContextMenu, isPreviewAvailable } from '@proton/components';

import { LinkType } from '../../../interfaces/link';
import { ItemContextMenuProps } from '../../FileBrowser';
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
        isOnlyOneItem && item.Type === LinkType.FILE && item.MIMEType && isPreviewAvailable(item.MIMEType);

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
