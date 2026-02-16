import { useEffect } from 'react';
import * as React from 'react';

import { useShallow } from 'zustand/react/shallow';

import { ContextMenu, ContextSeparator } from '@proton/components';

import type { ContextMenuProps } from '../../../components/FileBrowser';
import { ShareFileButton, ShareLinkButton } from '../../../components/sections/ContextMenu';
import useIsEditEnabled from '../../../components/sections/useIsEditEnabled';
import { useActiveShare } from '../../../hooks/drive/useActiveShare';
import { CreateNewDocumentButton } from '../buttons/CreateNewDocumentButton';
import { CreateNewFileButton } from '../buttons/CreateNewFileButton';
import { CreateNewFolderButton } from '../buttons/CreateNewFolderButton';
import { CreateNewSheetButton } from '../buttons/CreateNewSheetButton';
import { UploadFileButton } from '../buttons/UploadFileButton';
import { UploadFolderButton } from '../buttons/UploadFolderButton';
import { useFolderActions } from '../hooks/useFolderActions';
import { useFolderStore } from '../useFolder.store';

export function FolderContextMenu({
    shareId,
    linkId,
    volumeId,
    anchorRef,
    isOpen,
    position,
    open,
    close,
}: ContextMenuProps & {
    shareId: string;
    linkId: string;
    volumeId: string;
}) {
    useEffect(() => {
        if (position) {
            open();
        }
    }, [open, position]);

    const isEditEnabled = useIsEditEnabled();
    const { activeFolder } = useActiveShare();

    const {
        actions: {
            showCreateFolderModal,
            showCreateFileModal,
            showFileSharingModal,
            showSharingModal,
            createNewDocument,
            createNewSheet,
        },
        uploadFile: { fileInputRef, handleFileClick, handleFileChange },
        uploadFolder: { folderInputRef, handleFolderClick, handleFolderChange },
        modals,
    } = useFolderActions({ allSortedItems: [], selectedItems: [], shareId, linkId, volumeId });

    const { permissions } = useFolderStore(
        useShallow((state) => ({
            permissions: state.permissions,
        }))
    );

    // All actions in this context menu needs editor permissions
    if (!permissions.canEdit) {
        return null;
    }

    const shouldShowShareButton = permissions.canShare;
    const shouldShowShareLinkButton = permissions.canShareNode;

    // ContextMenu is removed from DOM when any action is executed but inputs
    // need to stay rendered so onChange handler can work.
    return (
        <>
            <input multiple type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            <input type="file" ref={folderInputRef} className="hidden" onChange={handleFolderChange} />
            {modals.createFolderModal}
            {modals.createFileModal}
            {modals.fileSharingModal}
            {modals.sharingModal}
            <ContextMenu isOpen={isOpen} close={close} position={position} anchorRef={anchorRef}>
                {permissions.canCreateNode && (
                    <CreateNewFolderButton type="context" close={close} onClick={showCreateFolderModal} />
                )}
                {permissions.canCreateDocs && (
                    <CreateNewDocumentButton type="context" close={close} onClick={createNewDocument} />
                )}
                {permissions.canCreateSheets && (
                    <CreateNewSheetButton type="context" close={close} onClick={createNewSheet} />
                )}
                {isEditEnabled && permissions.canCreateNode && (
                    <CreateNewFileButton type="context" close={close} onClick={() => showCreateFileModal({})} />
                )}
                {permissions.canCreateNode && <ContextSeparator />}
                {permissions.canCreateNode ? (
                    <>
                        <UploadFileButton close={close} type="context" onClick={handleFileClick} />
                        <UploadFolderButton close={close} type="context" onClick={handleFolderClick} />
                    </>
                ) : null}
                {shouldShowShareButton && (
                    <>
                        {/* // Device only have one entry in context menu */}
                        {permissions.canCreateNode && <ContextSeparator />}
                        <ShareFileButton
                            close={close}
                            shareId={shareId}
                            showFileSharingModal={showFileSharingModal}
                            showSharingModal={showSharingModal}
                        />
                    </>
                )}
                {shouldShowShareLinkButton && (
                    <>
                        <ContextSeparator />
                        <ShareLinkButton
                            volumeId={activeFolder.volumeId}
                            close={close}
                            linkId={activeFolder.linkId}
                            showSharingModal={showSharingModal}
                        />
                    </>
                )}
            </ContextMenu>
        </>
    );
}
