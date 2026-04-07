import { useShallow } from 'zustand/react/shallow';

import { Vr } from '@proton/atoms/Vr/Vr';
import { Toolbar, useActiveBreakpoint } from '@proton/components';
import { getDevice } from '@proton/shared/lib/helpers/browser';

import { isMultiSelect, noSelection } from '../../../components/sections/ToolbarButtons/utils';
import useIsEditEnabled from '../../../components/sections/useIsEditEnabled';
import { useSelectionStore } from '../../../modules/selection';
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
import { useDownloadActions } from '../useDownloadActions';
import { useFolderStore } from '../useFolder.store';
import type { FolderActions, FolderUploadFile, FolderUploadFolder } from '../useFolderActions';

interface Props {
    volumeId: string;
    actions: FolderActions;
    uploadFile: FolderUploadFile;
    uploadFolder: FolderUploadFolder;
    showOptionsForNoSelection?: boolean;
    canShareSingleItem: boolean;
}

export const FolderToolbar = ({
    volumeId,
    actions,
    uploadFile,
    uploadFolder,
    showOptionsForNoSelection = true,
    canShareSingleItem,
}: Props) => {
    const isDesktop = !getDevice()?.type;
    const { viewportWidth } = useActiveBreakpoint();
    const isEditEnabled = useIsEditEnabled();
    const selectedItemIds = useSelectionStore(useShallow((state) => state.selectedItemIds));
    const { items, permissions, role } = useFolderStore(
        useShallow((state) => ({
            permissions: state.permissions,
            items: state.items,
            role: state.role,
        }))
    );
    const itemsList = Array.from(items.values());
    const selectedItems = getSelectedItems(itemsList, Array.from(selectedItemIds));

    const {
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
    } = actions;

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
                            {isDesktop && (
                                <UploadFolderButton type="toolbar" onClick={uploadFolder.handleFolderClick} />
                            )}
                            <UploadFileButton type="toolbar" onClick={uploadFile.handleFileClick} />
                            <Vr />
                        </>
                    ) : null}

                    {canShareSingleItem && <ShareToolbarButton onClick={showFileSharingModal} />}
                    {canShareSingleItem && <ShareLinkButton type="toolbar" onClick={showSharingModal} />}
                </>
            );
        }

        return (
            <>
                <PreviewButton selectedItems={selectedItems} type="toolbar" onClick={showPreviewModal} />
                {permissions.canOpenInDocs && <OpenInDocsButton type="toolbar" selectedItems={selectedItems} />}
                <DownloadButton type="toolbar" selectedItems={selectedItems} onClick={downloadItems} />
                {/* CAREFUL separate menu for small viewport - same problem with sharing... */}
                {viewportWidth['<=small'] ? (
                    <ActionsDropdown
                        volumeId={volumeId}
                        selectedItems={selectedItems}
                        role={role}
                        canShareSingleItem={canShareSingleItem}
                    />
                ) : (
                    <>
                        {canShareSingleItem && (
                            <>
                                <ShareLinkButton type="toolbar" onClick={showSharingModal} />
                                <Vr />
                            </>
                        )}

                        {permissions.canMove && (
                            <MoveButton type="toolbar" selectedItems={selectedItems} onClick={showMoveModal} />
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
        </Toolbar>
    );
};
