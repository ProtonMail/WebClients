import { useEffect } from 'react';
import * as React from 'react';

import { useShallow } from 'zustand/react/shallow';

import { ContextMenu, ContextSeparator } from '@proton/components';

import { ShareFileButton, ShareLinkButton } from '../../../components/sections/ContextMenu';
import useIsEditEnabled from '../../../components/sections/useIsEditEnabled';
import { useActiveShare } from '../../../hooks/drive/useActiveShare';
import type { ContextMenuPosition } from '../../../modules/contextMenu';
import { CreateNewDocumentButton } from '../buttons/CreateNewDocumentButton';
import { CreateNewFileButton } from '../buttons/CreateNewFileButton';
import { CreateNewFolderButton } from '../buttons/CreateNewFolderButton';
import { CreateNewSheetButton } from '../buttons/CreateNewSheetButton';
import { UploadFileButton } from '../buttons/UploadFileButton';
import { UploadFolderButton } from '../buttons/UploadFolderButton';
import { useFolderStore } from '../useFolder.store';
import type { FolderActions, FolderUploadFile, FolderUploadFolder } from '../useFolderActions';

export function FolderContextMenu({
    anchorRef,
    isOpen,
    position,
    open,
    close,
    actions,
    uploadFile,
    uploadFolder,
}: {
    anchorRef: React.RefObject<HTMLElement>;
    isOpen: boolean;
    position: ContextMenuPosition | undefined;
    open: () => void;
    close: () => void;
    actions: FolderActions;
    uploadFile: FolderUploadFile;
    uploadFolder: FolderUploadFolder;
}) {
    useEffect(() => {
        if (position) {
            open();
        }
    }, [open, position]);

    const isEditEnabled = useIsEditEnabled();
    const { activeFolder } = useActiveShare();

    const {
        showCreateFolderModal,
        showCreateFileModal,
        showFileSharingModal,
        showSharingModal,
        createNewDocument,
        createNewSheet,
    } = actions;

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

    return (
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
                    <UploadFileButton close={close} type="context" onClick={uploadFile.handleFileClick} />
                    <UploadFolderButton close={close} type="context" onClick={uploadFolder.handleFolderClick} />
                </>
            ) : null}
            {shouldShowShareButton && (
                <>
                    {/* // Device only have one entry in context menu */}
                    {permissions.canCreateNode && <ContextSeparator />}
                    <ShareFileButton
                        close={close}
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
    );
}
