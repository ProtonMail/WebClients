import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';
import { useEffect } from 'react';

import { ContextMenu } from '@proton/components';

import { DecryptedLink } from '../../../store';
import { ContextMenuProps } from '../../FileBrowser/interface';
import { DetailsButton, DownloadButton, PreviewButton, RenameButton, ShareLinkButton } from '../ContextMenu';
import { StopSharingButton } from './ContextMenuButtons';

export default function generateSharedLinksItemContextMenu(shareId: string, selectedLinks: DecryptedLink[]) {
    return function SharedLinksItemContextMenuWrapper(props: ContextMenuProps) {
        return <SharedLinksItemContextMenu shareId={shareId} selectedLinks={selectedLinks} {...props} />;
    };
}

function SharedLinksItemContextMenu({
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

    useEffect(() => {
        if (position) {
            open();
        }
    }, [position]);

    return (
        <ContextMenu isOpen={isOpen} close={close} position={position} anchorRef={anchorRef}>
            {hasPreviewAvailable && <PreviewButton shareId={shareId} link={selectedLink} close={close} />}
            <DownloadButton shareId={shareId} selectedLinks={selectedLinks} close={close} />
            {isOnlyOneItem && <RenameButton shareId={shareId} link={selectedLink} close={close} />}
            <DetailsButton shareId={shareId} linkIds={selectedLinkIds} close={close} />
            {isOnlyOneItem && <ShareLinkButton shareId={shareId} link={selectedLink} close={close} />}
            <StopSharingButton shareId={shareId} selectedLinks={selectedLinks} close={close} />
        </ContextMenu>
    );
}
