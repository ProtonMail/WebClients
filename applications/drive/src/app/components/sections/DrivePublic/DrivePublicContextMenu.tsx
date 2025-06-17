import { ContextSeparator, useConfirmActionModal } from '@proton/components';
import { isProtonDocsDocument } from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { type DecryptedLink, useDownloadScanFlag } from '../../../store';
import { usePublicShareStore } from '../../../zustand/public/public-share.store';
import type { ContextMenuProps } from '../../FileBrowser/interface';
import { usePublicDetailsModal } from '../../modals/DetailsModal';
import { useRenameModal } from '../../modals/RenameModal';
import { ItemContextMenu } from '../ContextMenu/ItemContextMenu';
import {
    DeleteButton,
    DetailsButton,
    DownloadButton,
    OpenInDocsButton,
    PreviewButton,
    RenameButton,
} from './ContextMenuButtons';
import { usePublicLinksPermissions } from './utils/usePublicLinksPermissions';

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
    openInDocs?: (linkId: string, options?: { redirect?: boolean; download?: boolean }) => void;
}) {
    const { viewOnly } = usePublicShareStore((state) => ({ viewOnly: state.viewOnly }));
    const { canRename, canDelete } = usePublicLinksPermissions(selectedLinks);
    const selectedLink = selectedLinks.length > 0 ? selectedLinks[0] : undefined;
    const isOnlyOneItem = selectedLinks.length === 1 && !!selectedLink;
    const isOnlyOneFileItem = isOnlyOneItem && selectedLink.isFile;
    const hasPreviewAvailable =
        isOnlyOneFileItem && selectedLink.mimeType && isPreviewAvailable(selectedLink.mimeType, selectedLink.size);
    const [publicRenameModal, showPublicRenameModal] = useRenameModal();
    const [publicDetailsModal, showPublicDetailsModal] = usePublicDetailsModal();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const isDocument = isProtonDocsDocument(selectedLink?.mimeType || '');
    const isDownloadScanEnabled = useDownloadScanFlag();

    const showPreviewButton = hasPreviewAvailable;
    const showOpenInDocsButton = isOnlyOneFileItem && isDocument && openInDocs;
    const showDownloadButton = isDocument ? isOnlyOneFileItem && openInDocs : true;

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
                {showDownloadButton && (
                    <DownloadButton selectedBrowserItems={selectedLinks} openInDocs={openInDocs} close={close} />
                )}
                {/* // Hide button with scan as docs can't be scanned */}
                {isDownloadScanEnabled && showDownloadButton && !showOpenInDocsButton && (
                    <DownloadButton
                        selectedBrowserItems={selectedLinks}
                        openInDocs={openInDocs}
                        close={close}
                        virusScan
                    />
                )}
                {!viewOnly && isOnlyOneItem && (
                    <>
                        <ContextSeparator />
                        {!isActiveLinkReadOnly && canRename && (
                            <RenameButton showRenameModal={showPublicRenameModal} link={selectedLink} close={close} />
                        )}
                        <DetailsButton
                            showPublicDetailsModal={showPublicDetailsModal}
                            linkId={selectedLink.linkId}
                            close={close}
                        />
                    </>
                )}
                {!viewOnly && canDelete && (
                    <>
                        <ContextSeparator />
                        <DeleteButton links={selectedLinks} close={close} showConfirmModal={showConfirmModal} />
                    </>
                )}
                {children}
            </ItemContextMenu>
            {publicRenameModal}
            {publicDetailsModal}
            {confirmModal}
        </>
    );
}
