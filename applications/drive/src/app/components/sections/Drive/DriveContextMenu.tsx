import { ContextSeparator } from '@proton/components';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { DecryptedLink } from '../../../store';
import { ContextMenuProps } from '../../FileBrowser/interface';
import {
    CopyLinkButton,
    DetailsButton,
    DownloadButton,
    PreviewButton,
    RenameButton,
    ShareLinkButton,
} from '../ContextMenu';
import { ItemContextMenu } from '../ContextMenu/ItemContextMenu';
import { MoveToFolderButton, MoveToTrashButton } from './ContextMenuButtons';

export function DriveItemContextMenu({
    shareId,
    selectedLinks,
    anchorRef,
    isOpen,
    position,
    open,
    close,
    children,
    isActiveLinkReadOnly,
}: ContextMenuProps & {
    shareId: string;
    selectedLinks: DecryptedLink[];
    isActiveLinkReadOnly?: boolean;
}) {
    const selectedLink = selectedLinks[0];
    const isOnlyOneItem = selectedLinks.length === 1;
    const isOnlyOneFileItem = isOnlyOneItem && selectedLink.isFile;
    const hasPreviewAvailable =
        isOnlyOneFileItem && selectedLink.mimeType && isPreviewAvailable(selectedLink.mimeType, selectedLink.size);
    const hasLink = isOnlyOneItem && selectedLink.shareUrl && !selectedLink.shareUrl.isExpired && !selectedLink.trashed;

    return (
        <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
            {hasPreviewAvailable && <PreviewButton shareId={shareId} linkId={selectedLink.linkId} close={close} />}
            {hasPreviewAvailable && <ContextSeparator />}
            <DownloadButton shareId={shareId} selectedLinks={selectedLinks} close={close} />
            {hasLink && <CopyLinkButton shareId={shareId} linkId={selectedLink.linkId} close={close} />}
            {isOnlyOneItem && <ShareLinkButton shareId={shareId} link={selectedLink} close={close} />}
            <ContextSeparator />
            {!isActiveLinkReadOnly ? (
                <MoveToFolderButton shareId={shareId} selectedLinks={selectedLinks} close={close} />
            ) : null}
            {isOnlyOneItem && !isActiveLinkReadOnly && (
                <RenameButton shareId={shareId} link={selectedLink} close={close} />
            )}
            <DetailsButton selectedLinks={selectedLinks} close={close} />
            <ContextSeparator />
            <MoveToTrashButton selectedLinks={selectedLinks} close={close} />
            {children}
        </ItemContextMenu>
    );
}
