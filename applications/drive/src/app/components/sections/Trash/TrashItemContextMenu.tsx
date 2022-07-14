import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { DecryptedLink } from '../../../store';
import { ContextMenuProps } from '../../FileBrowser/interface';
import { PreviewButton, DownloadButton, DetailsButton } from '../ContextMenu';
import { DeletePermanentlyButton, RestoreFromTrashButton } from './ContextMenuButtons';
import { ItemContextMenu } from '../ContextMenu/ItemContextMenu';

export function TrashItemContextMenu({
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
    const hasPreviewAvailable =
        selectedLinks.length === 1 &&
        selectedLink.isFile &&
        selectedLink.mimeType &&
        isPreviewAvailable(selectedLink.mimeType, selectedLink.size);
    const hasDownloadAvailable = !selectedLinks.some((item) => !item.isFile);

    const selectedLinkIds = selectedLinks.map(({ linkId }) => linkId);

    return (
        <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
            {hasPreviewAvailable && <PreviewButton shareId={shareId} linkId={selectedLink.linkId} close={close} />}
            {hasDownloadAvailable && <DownloadButton shareId={shareId} selectedLinks={selectedLinks} close={close} />}
            <DetailsButton shareId={shareId} linkIds={selectedLinkIds} close={close} />
            <RestoreFromTrashButton shareId={shareId} selectedLinks={selectedLinks} close={close} />
            <DeletePermanentlyButton shareId={shareId} selectedLinks={selectedLinks} close={close} />
        </ItemContextMenu>
    );
}
