import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';
import { useEffect } from 'react';

import { ContextMenu, ContextSeparator } from '@proton/components';
import { ItemContextMenuProps } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import {
    DetailsButton,
    DownloadButton,
    CopyLinkButton,
    PreviewButton,
    RenameButton,
    ShareButton,
    ShareLinkButton,
} from '../ContextMenu';
import { MoveToFolderButton, MoveToTrashButton } from './ContextMenuButtons';

const DriveItemContextMenu = ({
    children,
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
    const isOnlyOneFileItem = isOnlyOneItem && item.IsFile;
    const hasPreviewAvailable = isOnlyOneFileItem && item.MIMEType && isPreviewAvailable(item.MIMEType, item.Size);
    const hasLink = isOnlyOneItem && item.SharedUrl && !item.UrlsExpired && !item.Trashed;

    useEffect(() => {
        if (position) {
            open();
        }
    }, [position]);

    return (
        <ContextMenu isOpen={isOpen} close={close} position={position} noMaxHeight anchorRef={anchorRef}>
            {hasPreviewAvailable && <PreviewButton shareId={shareId} item={item} close={close} />}
            {hasPreviewAvailable && <ContextSeparator />}
            <DownloadButton shareId={shareId} items={selectedItems} close={close} />
            {isOnlyOneItem && <ShareButton shareId={shareId} item={item} close={close} />}
            {hasLink && <CopyLinkButton shareId={shareId} linkId={item.LinkID} close={close} />}
            {isOnlyOneItem && <ShareLinkButton shareId={shareId} item={item} close={close} />}
            <ContextSeparator />
            <MoveToFolderButton shareId={shareId} items={selectedItems} close={close} />
            {isOnlyOneItem && <RenameButton shareId={shareId} item={item} close={close} />}
            <DetailsButton shareId={shareId} items={selectedItems} close={close} />
            <ContextSeparator />
            <MoveToTrashButton shareId={shareId} items={selectedItems} close={close} />
            {children}
        </ContextMenu>
    );
};

export default DriveItemContextMenu;
