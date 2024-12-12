import { ContextSeparator, useConfirmActionModal } from '@proton/components';
import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import type { DecryptedLink } from '../../../store';
import { useAnonymousUploadAuthStore } from '../../../zustand/upload/anonymous-auth.store';
import type { ContextMenuProps } from '../../FileBrowser/interface';
import { useRenameModal } from '../../modals/RenameModal';
import { ItemContextMenu } from '../ContextMenu/ItemContextMenu';
import { DeleteButton, DownloadButton, OpenInDocsButton, PreviewButton, RenameButton } from './ContextMenuButtons';
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
    const { uploadTokens } = useAnonymousUploadAuthStore();
    const { isCreator, isLastEditor, loggedIn } = usePublicLinkOwnerInfo(selectedLinks);
    const selectedLink = selectedLinks.length > 0 ? selectedLinks[0] : undefined;
    const isOnlyOneItem = selectedLinks.length === 1 && !!selectedLink;
    const isOnlyOneFileItem = isOnlyOneItem && selectedLink.isFile;
    const hasPreviewAvailable =
        isOnlyOneFileItem && selectedLink.mimeType && isPreviewAvailable(selectedLink.mimeType, selectedLink.size);
    const [publicRenameModal, showPublicRenameModal] = useRenameModal();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const isDocument = isProtonDocument(selectedLink?.mimeType || '');

    const showPreviewButton = hasPreviewAvailable;
    const showOpenInDocsButton = isOnlyOneFileItem && isDocument && openInDocs;

    // TODO: Move it once we have we have renaming for anonymous
    const isDeletionAllowed = loggedIn
        ? isCreator && isLastEditor
        : selectedLinks.every((link) => uploadTokens.has(link.linkId));

    // In case user is loggedIn, we will not have any authorizationToken for uploads
    const selectedLinksWithToken = loggedIn
        ? selectedLinks
        : selectedLinks.map((link) => ({ ...link, authorizationToken: uploadTokens.get(link.linkId) }));

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

                {isDeletionAllowed && (
                    <>
                        <ContextSeparator />
                        <DeleteButton
                            selectedLinks={selectedLinksWithToken}
                            close={close}
                            showConfirmModal={showConfirmModal}
                            anonymousRemoval={!isCreator && !isLastEditor}
                        />
                    </>
                )}
                {children}
            </ItemContextMenu>
            {publicRenameModal}
            {confirmModal}
        </>
    );
}
