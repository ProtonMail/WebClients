import { useShallow } from 'zustand/react/shallow';

import { ContextSeparator } from '@proton/components';
import { MemberRole } from '@proton/drive';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import type { ContextMenuProps } from '../../../components/FileBrowser';
import { ItemContextMenu } from '../../../components/sections/ContextMenu/ItemContextMenu';
import { useOpenInDocs } from '../../../store/_documents';
import type { LegacyItem } from '../../../utils/sdk/mapNodeToLegacyItem';
import { RenameActionButton } from '../../buttons/RenameActionButton';
import { CopyButton } from '../buttons/CopyButton';
import { CopyLinkContextButton } from '../buttons/CopyLinkContextButton';
import { DetailsButton } from '../buttons/DetailsButton';
import { DownloadButton } from '../buttons/DownloadButton';
import { MoveButton } from '../buttons/MoveButton';
import { OpenInDocsButton } from '../buttons/OpenInDocsButton';
import { PreviewButton } from '../buttons/PreviewButton';
import { RevisionsContextButton } from '../buttons/RevisionsContextButton';
import { ShareLinkButton } from '../buttons/ShareLinkButton';
import { TrashButton } from '../buttons/TrashButton';
import { useDownloadActions } from '../hooks/useDownloadActions';
import { useFolderActions } from '../hooks/useFolderActions';
import { useFolderStore } from '../useFolder.store';

export function FolderItemContextMenu({
    shareId,
    linkId,
    volumeId,
    allSortedItems,
    selectedItems,
    anchorRef,
    isOpen,
    position,
    open,
    close,
    children,
}: ContextMenuProps & {
    shareId: string;
    linkId: string;
    volumeId: string;
    allSortedItems: { nodeUid: string; mimeType?: string; storageSize: number }[];
    selectedItems: LegacyItem[];
}) {
    const selectedItem = selectedItems.length > 0 ? selectedItems[0] : undefined;
    const isOnlyOneItem = selectedItems.length === 1 && !!selectedItem;
    const isOnlyOneFileItem = isOnlyOneItem && selectedItem?.isFile;
    const { downloadItems } = useDownloadActions({ selectedItems });
    const { permissions, role } = useFolderStore(
        useShallow((state) => ({
            role: state.role,
            permissions: state.permissions,
        }))
    );

    const isAdmin = role === MemberRole.Admin;
    const openInDocs = useOpenInDocs(selectedItem);
    const hasPreviewAvailable =
        isOnlyOneFileItem && selectedItem?.mimeType && isPreviewAvailable(selectedItem.mimeType, selectedItem.size);
    const canCopyPublicLink = isAdmin && isOnlyOneItem && selectedItem.isSharedPublicly;

    const {
        actions: {
            showPreviewModal,
            showDetailsModal,
            showRevisionsModal,
            showRenameModal,
            showCopyModal,
            showMoveModal,
            showSharingModal,
            getPublicLinkInfo,
        },
        modals,
    } = useFolderActions({
        allSortedItems: allSortedItems.map((item) => ({
            nodeUid: item.nodeUid,
            mimeType: item.mimeType,
            storageSize: item.storageSize,
        })),
        selectedItems,
        shareId,
        linkId,
        volumeId,
    });

    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                {hasPreviewAvailable && (
                    <PreviewButton
                        selectedItems={selectedItems}
                        type="context"
                        close={close}
                        onClick={showPreviewModal}
                    />
                )}
                {isOnlyOneFileItem && <OpenInDocsButton type="context" selectedItems={selectedItems} close={close} />}
                {(hasPreviewAvailable || (isOnlyOneFileItem && openInDocs.canOpen)) && <ContextSeparator />}
                <DownloadButton type="context" selectedItems={selectedItems} onClick={downloadItems} close={close} />
                {canCopyPublicLink && <CopyLinkContextButton getPublicLinkInfo={getPublicLinkInfo} close={close} />}
                {isAdmin && isOnlyOneItem && (
                    <ShareLinkButton type="context" onClick={showSharingModal} close={close} />
                )}
                <ContextSeparator />
                {permissions.canMove ? (
                    <MoveButton
                        type="context"
                        selectedItems={selectedItems}
                        close={close}
                        onClick={() => showMoveModal(shareId)}
                    />
                ) : null}
                {permissions.canCopy && <CopyButton type="context" close={close} onClick={showCopyModal} />}
                {permissions.canRename && isOnlyOneItem && (
                    <RenameActionButton type="context" close={close} onClick={showRenameModal} />
                )}
                <DetailsButton type="context" selectedItems={selectedItems} onClick={showDetailsModal} close={close} />
                {permissions.canEdit && <ContextSeparator />}
                {permissions.canEdit && isOnlyOneFileItem && (
                    <>
                        <RevisionsContextButton
                            selectedItem={selectedItem}
                            showRevisionsModal={showRevisionsModal}
                            close={close}
                        />
                        <ContextSeparator />
                    </>
                )}
                {permissions.canTrash && <TrashButton type="context" selectedItems={selectedItems} close={close} />}
                {children}
            </ItemContextMenu>
            {modals.previewModal}
            {modals.detailsModal}
            {modals.filesDetailsModal}
            {modals.sharingModal}
            {modals.revisionsModal}
            {modals.renameModal}
            {modals.moveModal}
            {modals.copyModal}
        </>
    );
}
