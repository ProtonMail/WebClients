import { ContextSeparator } from '@proton/components';
import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import type { DecryptedLink } from '../../../store';
import type { ContextMenuProps } from '../../FileBrowser/interface';
import { useRenameModal } from '../../modals/RenameModal';
import { ItemContextMenu } from '../ContextMenu/ItemContextMenu';
import { DownloadButton, MoveToTrashButton, OpenInDocsButton, PreviewButton, RenameButton } from './ContextMenuButtons';
import { usePublicLinkOwnerInfo } from './utils/usePublicLinkOwnerInfo';

export function DrivePublicContextMenu({
    selectedLinks,
    anchorRef,
    isOpen,
    position,
    open,
    openPreview,
    openInDocs,
    close,
    children,
    isActiveLinkReadOnly,
}: ContextMenuProps & {
    shareId: string;
    selectedLinks: DecryptedLink[];
    isActiveLinkReadOnly?: boolean;
    openPreview: (item: DecryptedLink) => void;
    openInDocs?: (linkId: string) => void;
}) {
    const { isCreator, isLastEditor } = usePublicLinkOwnerInfo(selectedLinks);
    const selectedLink = selectedLinks.length > 0 ? selectedLinks[0] : undefined;
    const isOnlyOneItem = selectedLinks.length === 1 && !!selectedLink;
    const isOnlyOneFileItem = isOnlyOneItem && selectedLink.isFile;
    const hasPreviewAvailable =
        isOnlyOneFileItem && selectedLink.mimeType && isPreviewAvailable(selectedLink.mimeType, selectedLink.size);
    const [publicRenameModal, showPublicRenameModal] = useRenameModal();
    const isDocument = isProtonDocument(selectedLink?.mimeType || '');

    const showPreviewButton = hasPreviewAvailable;
    const showOpenInDocsButton = isOnlyOneFileItem && isDocument && openInDocs;

    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                {showPreviewButton && <PreviewButton link={selectedLink} openPreview={openPreview} close={close} />}
                {showOpenInDocsButton && (
                    <OpenInDocsButton
                        openInDocs={openInDocs}
                        linkId={selectedLink.linkId}
                        mimeType={selectedLink.mimeType}
                        close={close}
                    />
                )}
                {(showPreviewButton || showOpenInDocsButton) && <ContextSeparator />}
                <DownloadButton selectedBrowserItems={selectedLinks} close={close} />
                {isOnlyOneItem && !isActiveLinkReadOnly && isLastEditor && (
                    <>
                        <ContextSeparator />
                        <RenameButton showRenameModal={showPublicRenameModal} link={selectedLink} close={close} />
                    </>
                )}

                {isCreator && isLastEditor && (
                    <>
                        <ContextSeparator />
                        <MoveToTrashButton selectedLinks={selectedLinks} close={close} />
                    </>
                )}
                {children}
            </ItemContextMenu>
            {publicRenameModal}
        </>
    );
}
