import { ContextSeparator, useConfirmActionModal } from '@proton/components';

import type { DecryptedLink } from '../../../store';
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
import { DownloadDocumentButton } from './ContextMenuButtons/DownloadButton';
import { useContextMenuItemsVisibility } from './utils/useContextMenuItemsVisibility';
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
    const [publicRenameModal, showPublicRenameModal] = useRenameModal();
    const [publicDetailsModal, showPublicDetailsModal] = usePublicDetailsModal();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();

    const { viewOnly } = usePublicShareStore((state) => ({ viewOnly: state.viewOnly }));
    const { canRename, canDelete } = usePublicLinksPermissions(selectedLinks);

    const { canShowPreview, canOpenInDocs, showDownloadDocument, showDownloadScanButton } =
        useContextMenuItemsVisibility({
            selectedLinks,
        });

    const firstLink = selectedLinks.length > 0 ? selectedLinks[0] : undefined;
    const isOnlyOneItem = selectedLinks.length === 1 && !!firstLink;

    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                {canShowPreview && firstLink && (
                    <PreviewButton link={firstLink} openPreview={openPreview} close={close} />
                )}
                {canOpenInDocs && openInDocs && (
                    <OpenInDocsButton
                        // Safe to assume it's defined (available when shares are enabled)
                        openInDocs={openInDocs}
                        linkId={selectedLinks[0].linkId}
                        mimeType={selectedLinks[0].mimeType}
                        close={close}
                    />
                )}
                {(canShowPreview || canOpenInDocs) && <ContextSeparator />}
                {!showDownloadDocument && <DownloadButton selectedBrowserItems={selectedLinks} close={close} />}
                {showDownloadDocument && openInDocs && (
                    <DownloadDocumentButton documentLink={selectedLinks[0]} close={close} openInDocs={openInDocs} />
                )}
                {showDownloadScanButton && (
                    <DownloadButton selectedBrowserItems={selectedLinks} close={close} virusScan />
                )}
                {!viewOnly && isOnlyOneItem && (
                    <>
                        <ContextSeparator />
                        {!isActiveLinkReadOnly && canRename && (
                            <RenameButton showRenameModal={showPublicRenameModal} link={firstLink} close={close} />
                        )}
                        <DetailsButton
                            showPublicDetailsModal={showPublicDetailsModal}
                            linkId={firstLink.linkId}
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
