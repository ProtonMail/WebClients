import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';
import { useEffect } from 'react';

import { ContextMenu, ContextSeparator } from '@proton/components';

import { DecryptedLink } from '../../../store';
import { ContextMenuProps } from '../../FileBrowser/interface';
import {
    DetailsButton,
    DownloadButton,
    CopyLinkButton,
    PreviewButton,
    RenameButton,
    ShareLinkButton,
} from '../ContextMenu';
import { MoveToFolderButton, MoveToTrashButton } from './ContextMenuButtons';

export default function generateDriveItemContextMenu(shareId: string, selectedLinks: DecryptedLink[]) {
    return function DriveItemContextMenuWrapper(props: ContextMenuProps) {
        return <DriveItemContextMenu shareId={shareId} selectedLinks={selectedLinks} {...props} />;
    };
}

export function DriveItemContextMenu({
    shareId,
    selectedLinks,
    anchorRef,
    isOpen,
    position,
    open,
    close,
    children,
}: ContextMenuProps & {
    shareId: string;
    selectedLinks: DecryptedLink[];
}) {
    const selectedLink = selectedLinks[0];
    const isOnlyOneItem = selectedLinks.length === 1;
    const isOnlyOneFileItem = isOnlyOneItem && selectedLink.isFile;
    const hasPreviewAvailable =
        isOnlyOneFileItem && selectedLink.mimeType && isPreviewAvailable(selectedLink.mimeType, selectedLink.size);
    const hasLink = isOnlyOneItem && selectedLink.shareUrl && !selectedLink.shareUrl.isExpired && !selectedLink.trashed;
    const selectedLinkIds = selectedLinks.map(({ linkId }) => linkId);

    useEffect(() => {
        if (position) {
            open();
        }
    }, [position]);

    return (
        <ContextMenu isOpen={isOpen} close={close} position={position} noMaxHeight anchorRef={anchorRef}>
            {hasPreviewAvailable && <PreviewButton shareId={shareId} link={selectedLink} close={close} />}
            {hasPreviewAvailable && <ContextSeparator />}
            <DownloadButton shareId={shareId} selectedLinks={selectedLinks} close={close} />
            {hasLink && <CopyLinkButton shareId={shareId} linkId={selectedLink.linkId} close={close} />}
            {isOnlyOneItem && <ShareLinkButton shareId={shareId} link={selectedLink} close={close} />}
            <ContextSeparator />
            <MoveToFolderButton shareId={shareId} selectedLinks={selectedLinks} close={close} />
            {isOnlyOneItem && <RenameButton shareId={shareId} link={selectedLink} close={close} />}
            <DetailsButton shareId={shareId} linkIds={selectedLinkIds} close={close} />
            <ContextSeparator />
            <MoveToTrashButton shareId={shareId} selectedLinks={selectedLinks} close={close} />
            {children}
        </ContextMenu>
    );
}
