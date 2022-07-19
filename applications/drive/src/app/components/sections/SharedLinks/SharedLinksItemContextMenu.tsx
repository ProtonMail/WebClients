import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { DecryptedLink } from '../../../store';
import { ContextMenuProps } from '../../FileBrowser/interface';
import { DetailsButton, DownloadButton, PreviewButton, RenameButton, ShareLinkButton } from '../ContextMenu';
import { StopSharingButton } from './ContextMenuButtons';
import { ItemContextMenu } from '../ContextMenu/ItemContextMenu';

export function SharedLinksItemContextMenu({
    shareId,
    selectedLinks,
    anchorRef,
    isOpen,
    position,
    open,
    close,
}: ContextMenuProps & {
    shareId: string;
    selectedLinks: DecryptedLink[];
}) {
    const selectedLink = selectedLinks[0];
    const isOnlyOneItem = selectedLinks.length === 1;
    const hasPreviewAvailable =
        isOnlyOneItem &&
        selectedLink.isFile &&
        selectedLink.mimeType &&
        isPreviewAvailable(selectedLink.mimeType, selectedLink.size);

    const selectedLinkIds = selectedLinks.map(({ linkId }) => linkId);

    return (
        <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
            {hasPreviewAvailable && <PreviewButton shareId={shareId} linkId={selectedLink.linkId} close={close} />}
            <DownloadButton shareId={shareId} selectedLinks={selectedLinks} close={close} />
            {isOnlyOneItem && <RenameButton shareId={shareId} link={selectedLink} close={close} />}
            <DetailsButton shareId={shareId} linkIds={selectedLinkIds} close={close} />
            {isOnlyOneItem && <ShareLinkButton shareId={shareId} link={selectedLink} close={close} />}
            <StopSharingButton shareId={shareId} selectedLinks={selectedLinks} close={close} />
        </ItemContextMenu>
    );
}
