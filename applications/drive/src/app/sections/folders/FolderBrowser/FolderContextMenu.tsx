import { useEffect } from 'react';
import * as React from 'react';

import { useShallow } from 'zustand/react/shallow';

import { ContextMenu, ContextSeparator } from '@proton/components';

import type { ContextMenuProps } from '../../../components/FileBrowser';
import { useCreateFileModal } from '../../../components/modals/CreateFileModal';
import { useCreateFolderModal } from '../../../components/modals/CreateFolderModal';
import { useFileSharingModal } from '../../../components/modals/SelectLinkToShareModal/SelectLinkToShareModal';
import { useLinkSharingModal } from '../../../components/modals/ShareLinkModal/ShareLinkModal';
import { ShareFileButton, ShareLinkButton } from '../../../components/sections/ContextMenu';
import useIsEditEnabled from '../../../components/sections/useIsEditEnabled';
import { useActiveShare } from '../../../hooks/drive/useActiveShare';
import { useActions, useDocumentActions, useFileUploadInput, useFolderUploadInput } from '../../../store';
import {
    CreateNewFileButton,
    CreateNewFolderButton,
    UploadFileButton,
    UploadFolderButton,
} from '../ContextMenuButtons';
import CreateNewDocumentButton from '../ContextMenuButtons/CreateNewDocumentButton';
import CreateNewSheetButton from '../ContextMenuButtons/CreateNewSheetButton';
import { useFolderStore } from '../useFolder.store';

export function FolderContextMenu({
    shareId,
    anchorRef,
    isOpen,
    position,
    open,
    close,
}: ContextMenuProps & {
    shareId: string;
}) {
    useEffect(() => {
        if (position) {
            open();
        }
    }, [position]);

    const isEditEnabled = useIsEditEnabled();

    const { activeFolder } = useActiveShare();
    const { createFolder } = useActions();
    const {
        inputRef: fileInput,
        handleClick: fileClick,
        handleChange: fileChange,
    } = useFileUploadInput(activeFolder.shareId, activeFolder.linkId);
    const {
        inputRef: folderInput,
        handleClick: folderClick,
        handleChange: folderChange,
    } = useFolderUploadInput(activeFolder.shareId, activeFolder.linkId);
    const [createFolderModal, showCreateFolderModal] = useCreateFolderModal();
    const [createFileModal, showCreateFileModal] = useCreateFileModal();
    const [fileSharingModal, showFileSharingModal] = useFileSharingModal();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    const { permissions } = useFolderStore(
        useShallow((state) => ({
            permissions: state.permissions,
        }))
    );

    const { createDocument } = useDocumentActions();

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
            <input multiple type="file" ref={fileInput} className="hidden" onChange={fileChange} />
            <input type="file" ref={folderInput} className="hidden" onChange={folderChange} />
            {createFolderModal}
            {createFileModal}
            {fileSharingModal}
            {linkSharingModal}
            <ContextMenu isOpen={isOpen} close={close} position={position} anchorRef={anchorRef}>
                {permissions.canCreateNode && (
                    <CreateNewFolderButton
                        close={close}
                        action={() => showCreateFolderModal({ folder: activeFolder, createFolder })}
                    />
                )}
                {permissions.canCreateDocs && (
                    <CreateNewDocumentButton
                        close={close}
                        action={() => {
                            void createDocument({
                                type: 'doc',
                                shareId: activeFolder.shareId,
                                parentLinkId: activeFolder.linkId,
                            });
                        }}
                    />
                )}
                {permissions.canCreateSheets && (
                    <CreateNewSheetButton
                        close={close}
                        action={() => {
                            void createDocument({
                                type: 'sheet',
                                shareId: activeFolder.shareId,
                                parentLinkId: activeFolder.linkId,
                            });
                        }}
                    />
                )}
                {isEditEnabled && permissions.canCreateNode && (
                    <CreateNewFileButton close={close} action={() => showCreateFileModal({})} />
                )}
                {permissions.canCreateNode && <ContextSeparator />}
                {permissions.canCreateNode ? (
                    <>
                        <UploadFileButton close={close} onClick={fileClick} />
                        <UploadFolderButton close={close} onClick={folderClick} />
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
                            showLinkSharingModal={showLinkSharingModal}
                        />
                    </>
                )}
                {shouldShowShareLinkButton && (
                    <>
                        <ContextSeparator />
                        <ShareLinkButton
                            volumeId={activeFolder.volumeId}
                            close={close}
                            shareId={activeFolder.shareId}
                            linkId={activeFolder.linkId}
                            showLinkSharingModal={showLinkSharingModal}
                        />
                    </>
                )}
            </ContextMenu>
        </>
    );
}
