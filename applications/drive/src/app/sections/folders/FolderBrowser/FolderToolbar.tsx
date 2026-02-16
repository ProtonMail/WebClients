import { useShallow } from 'zustand/react/shallow';

import { Vr } from '@proton/atoms/Vr/Vr';
import { Toolbar, useActiveBreakpoint } from '@proton/components';
import { MemberRole } from '@proton/drive/index';
import { getDevice } from '@proton/shared/lib/helpers/browser';

import { useSelection } from '../../../components/FileBrowser';
import { isMultiSelect, noSelection } from '../../../components/sections/ToolbarButtons/utils';
import useIsEditEnabled from '../../../components/sections/useIsEditEnabled';
import { RenameActionButton } from '../../buttons/RenameActionButton';
import { ActionsDropdown } from '../buttons/ActionsDropdown';
import { CopyButton } from '../buttons/CopyButton';
import { CreateNewDocumentButton } from '../buttons/CreateNewDocumentButton';
import { CreateNewFileButton } from '../buttons/CreateNewFileButton';
import { CreateNewFolderButton } from '../buttons/CreateNewFolderButton';
import { CreateNewSheetButton } from '../buttons/CreateNewSheetButton';
import { DetailsButton } from '../buttons/DetailsButton';
import { DownloadButton } from '../buttons/DownloadButton';
import { LayoutToolbarButton } from '../buttons/LayoutButton';
import { MoveButton } from '../buttons/MoveButton';
import { OpenInDocsButton } from '../buttons/OpenInDocsButton';
import { PreviewButton } from '../buttons/PreviewButton';
import { ShareLinkButton } from '../buttons/ShareLinkButton';
import { ShareToolbarButton } from '../buttons/ShareToolbarButton';
import { TrashButton } from '../buttons/TrashButton';
import { UploadFileButton } from '../buttons/UploadFileButton';
import { UploadFolderButton } from '../buttons/UploadFolderButton';
import { getSelectedItems } from '../getSelectedItems';
import { useDownloadActions } from '../hooks/useDownloadActions';
import { useFolderActions } from '../hooks/useFolderActions';
import { useFolderStore } from '../useFolder.store';

interface Props {
    volumeId: string;
    shareId: string;
    linkId: string;
    allSortedItems: { nodeUid: string; mimeType?: string; storageSize: number }[];
    showOptionsForNoSelection?: boolean;
}

export const FolderToolbar = ({
    volumeId,
    shareId,
    linkId,
    allSortedItems,
    showOptionsForNoSelection = true,
}: Props) => {
    const isDesktop = !getDevice()?.type;
    const { viewportWidth } = useActiveBreakpoint();
    const selectionControls = useSelection();
    const isEditEnabled = useIsEditEnabled();
    const { items, permissions, role } = useFolderStore(
        useShallow((state) => ({
            permissions: state.permissions,
            items: state.getFolderItems(),
            role: state.role,
        }))
    );
    const selectedItems = getSelectedItems(items, selectionControls?.selectedItemIds || []);
    const {
        actions: {
            showPreviewModal,
            showRenameModal,
            showMoveModal,
            showCopyModal,
            showCreateFileModal,
            showCreateFolderModal,
            createNewDocument,
            createNewSheet,
            showDetailsModal,
            showSharingModal,
            showFileSharingModal,
        },
        uploadFile: { fileInputRef, handleFileClick, handleFileChange },
        uploadFolder: { folderInputRef, handleFolderClick, handleFolderChange },
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

    const isAdmin = role === MemberRole.Admin;
    const shouldShowShareButton = permissions.canShare && selectedItems.length === 0 && items.length > 0;
    const shouldShowShareLinkButton = isAdmin && (selectedItems.length > 0 || permissions.canShareNode);
    const selectedItem = selectedItems.length === 1 ? selectedItems[0] : undefined;
    const { downloadItems } = useDownloadActions({ selectedItems });

    const renderSelectionActions = () => {
        if (!selectedItems.length) {
            if (!showOptionsForNoSelection) {
                return null;
            }
            return (
                <>
                    {permissions.canCreateNode ? (
                        <>
                            <CreateNewFolderButton type="toolbar" onClick={showCreateFolderModal} />
                            {isEditEnabled && (
                                <CreateNewFileButton type="toolbar" onClick={() => showCreateFileModal({})} />
                            )}
                            {permissions.canCreateDocs && (
                                <CreateNewDocumentButton type="toolbar" onClick={createNewDocument} />
                            )}
                            {permissions.canCreateSheets && (
                                <CreateNewSheetButton type="toolbar" onClick={createNewSheet} />
                            )}
                            <Vr />
                            {isDesktop && <UploadFolderButton type="toolbar" onClick={handleFolderClick} />}
                            <UploadFileButton type="toolbar" onClick={handleFileClick} />
                            <Vr />
                        </>
                    ) : null}

                    {shouldShowShareButton && <ShareToolbarButton onClick={showFileSharingModal} />}
                    {shouldShowShareLinkButton && <ShareLinkButton type="toolbar" onClick={showSharingModal} />}
                </>
            );
        }

        return (
            <>
                <PreviewButton selectedItems={selectedItems} type="toolbar" onClick={showPreviewModal} />
                <OpenInDocsButton type="toolbar" selectedItems={selectedItems} />
                <DownloadButton type="toolbar" selectedItems={selectedItems} onClick={downloadItems} />
                {viewportWidth['<=small'] ? (
                    <ActionsDropdown volumeId={volumeId} shareId={shareId} selectedItems={selectedItems} role={role} />
                ) : (
                    <>
                        {shouldShowShareLinkButton && selectedItem && (
                            <>
                                <ShareLinkButton type="toolbar" onClick={showSharingModal} />
                                <Vr />
                            </>
                        )}

                        {permissions.canMove && (
                            <MoveButton
                                type="toolbar"
                                selectedItems={selectedItems}
                                onClick={() => showMoveModal(shareId)}
                            />
                        )}
                        {permissions.canCopy && <CopyButton type="toolbar" onClick={showCopyModal} />}
                        {permissions.canRename && !noSelection(selectedItems) && !isMultiSelect(selectedItems) && (
                            <RenameActionButton type="toolbar" onClick={showRenameModal} />
                        )}
                        <DetailsButton type="toolbar" selectedItems={selectedItems} onClick={showDetailsModal} />

                        {permissions.canTrash && (
                            <>
                                <Vr />
                                <TrashButton type="toolbar" selectedItems={selectedItems} />
                            </>
                        )}
                    </>
                )}
            </>
        );
    };

    return (
        <Toolbar className="py-1 px-2 toolbar--heavy toolbar--in-container">
            <div className="gap-2 flex flex-nowrap shrink-0">{renderSelectionActions()}</div>
            <span className="ml-auto flex flex-nowrap shrink-0">
                {selectedItems.length > 0 && <Vr className="hidden md:flex mx-2" />}
                <LayoutToolbarButton />
            </span>
            <input multiple type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            <input type="file" ref={folderInputRef} className="hidden" onChange={handleFolderChange} />
            {modals.previewModal}
            {modals.renameModal}
            {modals.moveModal}
            {modals.copyModal}
            {modals.createFileModal}
            {modals.createFolderModal}
            {modals.detailsModal}
            {modals.filesDetailsModal}
            {modals.sharingModal}
            {modals.fileSharingModal}
        </Toolbar>
    );
};
