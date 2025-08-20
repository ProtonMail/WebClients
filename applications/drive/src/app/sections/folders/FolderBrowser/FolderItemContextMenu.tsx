import { useShallow } from 'zustand/react/shallow';

import { ContextSeparator } from '@proton/components';
import { MemberRole } from '@proton/drive/index';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import type { ContextMenuProps } from '../../../components/FileBrowser';
import { ItemContextMenu } from '../../../components/sections/ContextMenu/ItemContextMenu';
import { useOpenInDocs } from '../../../store/_documents';
import type { LegacyItem } from '../../../utils/sdk/mapNodeToLegacyItem';
import { CopyLinkContextButton } from '../buttons/CopyLinkContextButton';
import { DetailsButton } from '../buttons/DetailsButton';
import { DownloadButton } from '../buttons/DownloadButton';
import { MoveButton } from '../buttons/MoveButton';
import { OpenInDocsButton } from '../buttons/OpenInDocsButton';
import { PreviewButton } from '../buttons/PreviewButton';
import { RenameButton } from '../buttons/RenameButton';
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
    const {
        actions: { showDetailsModal, showRevisionsModal, showRenameModal, showMoveModal, showLinkSharingModal },
        modals,
    } = useFolderActions({ selectedItems, shareId, linkId, volumeId });

    return (
        <>
            <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
                {hasPreviewAvailable && <PreviewButton selectedItems={selectedItems} type="context" close={close} />}
                {isOnlyOneFileItem && <OpenInDocsButton type="context" selectedItems={selectedItems} close={close} />}
                {(hasPreviewAvailable || (isOnlyOneFileItem && openInDocs.canOpen)) && <ContextSeparator />}
                <DownloadButton type="context" selectedItems={selectedItems} onClick={downloadItems} close={close} />
                {isAdmin && <CopyLinkContextButton selectedItems={selectedItems} close={close} />}
                {isAdmin && isOnlyOneItem && (
                    <ShareLinkButton
                        type="context"
                        selectedItems={selectedItems}
                        onClick={showLinkSharingModal}
                        close={close}
                    />
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
                {permissions.canRename && isOnlyOneItem && (
                    <RenameButton
                        type="context"
                        selectedItems={selectedItems}
                        close={close}
                        onClick={showRenameModal}
                    />
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
                {permissions.canEdit && <TrashButton type="context" selectedItems={selectedItems} close={close} />}
                {children}
            </ItemContextMenu>
            {modals.detailsModal}
            {modals.filesDetailsModal}
            {modals.linkSharingModal}
            {modals.revisionsModal}
            {modals.renameModal}
            {modals.moveModal}
        </>
    );
}
