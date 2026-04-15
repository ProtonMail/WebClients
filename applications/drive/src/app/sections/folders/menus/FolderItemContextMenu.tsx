import { useShallow } from 'zustand/react/shallow';

import { ContextSeparator } from '@proton/components';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';

import { ItemContextMenu } from '../../../components/sections/ContextMenu/ItemContextMenu';
import type { ContextMenuPosition } from '../../../modules/contextMenu';
import { useOpenInDocs } from '../../../store/_documents';
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
import { useDownloadActions } from '../useDownloadActions';
import type { FolderViewItem } from '../useFolder.store';
import { useFolderStore } from '../useFolder.store';
import type { FolderActions } from '../useFolderActions';

export function FolderItemContextMenu({
    selectedItems,
    anchorRef,
    isOpen,
    position,
    open,
    close,
    actions,
    canShareSelectedItem,
    children,
}: {
    anchorRef: React.RefObject<HTMLElement>;
    isOpen: boolean;
    position: ContextMenuPosition | undefined;
    open: () => void;
    close: () => void;
    shareId: string;
    linkId: string;
    volumeId: string;
    selectedItems: FolderViewItem[];
    actions: FolderActions;
    canShareSelectedItem: boolean;
    children?: React.ReactNode;
}) {
    const selectedItem = selectedItems.length > 0 ? selectedItems[0] : undefined;
    const isOnlyOneItem = selectedItems.length === 1 && !!selectedItem;
    const isOnlyOneFileItem = isOnlyOneItem && selectedItem?.isFile;
    const { downloadItems } = useDownloadActions({ selectedItems });
    const { permissions } = useFolderStore(
        useShallow((state) => ({
            permissions: state.permissions,
        }))
    );

    const canCopyPublicLink = canShareSelectedItem && selectedItem?.isSharedPublicly;

    const openInDocs = useOpenInDocs(selectedItem);
    const hasPreviewAvailable =
        isOnlyOneFileItem && selectedItem?.mimeType && isPreviewAvailable(selectedItem.mimeType, selectedItem.size);

    const {
        showPreviewModal,
        showDetailsModal,
        showRevisionsModal,
        showRenameModal,
        showCopyModal,
        showMoveModal,
        showSharingModal,
        getPublicLinkInfo,
    } = actions;

    return (
        <ItemContextMenu isOpen={isOpen} open={open} close={close} position={position} anchorRef={anchorRef}>
            {hasPreviewAvailable && (
                <PreviewButton selectedItems={selectedItems} type="context" close={close} onClick={showPreviewModal} />
            )}
            {isOnlyOneFileItem && permissions.canOpenInDocs && (
                <OpenInDocsButton type="context" selectedItems={selectedItems} close={close} />
            )}
            {(hasPreviewAvailable || (isOnlyOneFileItem && openInDocs.canOpen && permissions.canOpenInDocs)) && (
                <ContextSeparator />
            )}
            <DownloadButton type="context" selectedItems={selectedItems} onClick={downloadItems} close={close} />
            {canCopyPublicLink && <CopyLinkContextButton getPublicLinkInfo={getPublicLinkInfo} close={close} />}
            {canShareSelectedItem && <ShareLinkButton type="context" onClick={showSharingModal} close={close} />}
            <ContextSeparator />
            {permissions.canMove ? (
                <MoveButton type="context" selectedItems={selectedItems} close={close} onClick={showMoveModal} />
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
                        nodeUid={selectedItem.uid}
                        rootShareId={selectedItem.rootShareId}
                        mediaType={selectedItem.mimeType}
                        showRevisionsModal={showRevisionsModal}
                        close={close}
                    />
                    <ContextSeparator />
                </>
            )}
            {permissions.canTrash && <TrashButton type="context" selectedItems={selectedItems} close={close} />}
            {children}
        </ItemContextMenu>
    );
}
