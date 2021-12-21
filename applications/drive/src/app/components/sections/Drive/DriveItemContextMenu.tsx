import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';
import { useEffect } from 'react';

import { ContextMenu, ContextSeparator } from '@proton/components';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';
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
import useActiveShare from '../../../hooks/drive/useActiveShare';

const DriveItemContextMenu = ({
    item,
    selectedItems,
    shareId,
    anchorRef,
    isOpen,
    position,
    open,
    close,
}: ItemContextMenuProps) => {
    const { activeFolder: sourceFolder } = useActiveShare();

    const isOnlyOneItem = selectedItems.length === 1;
    const isOnlyOneFileItem = isOnlyOneItem && item.Type === LinkType.FILE;
    const hasPreviewAvailable = isOnlyOneFileItem && item.MIMEType && isPreviewAvailable(item.MIMEType, item.Size);
    const hasLink = isOnlyOneItem && item.ShareUrlShareID && !item.UrlsExpired && !item.Trashed;

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
            {hasLink && <CopyLinkButton shareId={item.ShareUrlShareID as string} close={close} />}
            {isOnlyOneItem && <ShareLinkButton shareId={shareId} item={item} close={close} />}
            <ContextSeparator />
            {sourceFolder && <MoveToFolderButton sourceFolder={sourceFolder} items={selectedItems} close={close} />}
            {isOnlyOneItem && <RenameButton shareId={shareId} item={item} close={close} />}
            <DetailsButton shareId={shareId} items={selectedItems} close={close} />
            <ContextSeparator />
            {sourceFolder && <MoveToTrashButton sourceFolder={sourceFolder} items={selectedItems} close={close} />}
        </ContextMenu>
    );
};

export default DriveItemContextMenu;
