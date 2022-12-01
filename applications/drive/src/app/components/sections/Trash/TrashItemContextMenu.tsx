import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { DecryptedLink } from '../../../store';
import { ContextMenuProps } from '../../FileBrowser/interface';
import { DetailsButton, DownloadButton, PreviewButton } from '../ContextMenu';
import { ItemContextMenu } from '../ContextMenu/ItemContextMenu';
import { DeletePermanentlyButton, RestoreFromTrashButton } from './ContextMenuButtons';

export function TrashItemContextMenu({
    selectedLinks,
    anchorRef,
    isOpen,
    position,
    open,
    close,
}: ContextMenuProps & {
    selectedLinks: DecryptedLink[];
}) {
    const selectedLink = selectedLinks[0];
    const shareId = selectedLink ? selectedLink.rootShareId : '';
    const hasPreviewAvailable =
        selectedLinks.length === 1 &&
        selectedLink.isFile &&
        selectedLink.mimeType &&
        isPreviewAvailable(selectedLink.mimeType, selectedLink.size);
    const hasDownloadAvailable = !selectedLinks.some((item) => !item.isFile);

    return (
        <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
            {hasPreviewAvailable && <PreviewButton shareId={shareId} linkId={selectedLink.linkId} close={close} />}
            {hasDownloadAvailable && <DownloadButton shareId={shareId} selectedLinks={selectedLinks} close={close} />}
            <DetailsButton selectedLinks={selectedLinks} close={close} />
            <RestoreFromTrashButton selectedLinks={selectedLinks} close={close} />
            <DeletePermanentlyButton selectedLinks={selectedLinks} close={close} />
        </ItemContextMenu>
    );
}
