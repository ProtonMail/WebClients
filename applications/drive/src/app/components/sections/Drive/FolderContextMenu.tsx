import { useEffect, useMemo } from 'react';
import * as React from 'react';

import { ContextMenu, ContextSeparator } from '@proton/components';
import { generateNodeUid } from '@proton/drive/index';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions';
import { getCanAdmin, getCanWrite } from '@proton/shared/lib/drive/permissions';

import { useActiveShare } from '../../../hooks/drive/useActiveShare';
import { useCreateFileModal } from '../../../modals/CreateFileModal';
import { useCreateFolderModal } from '../../../modals/CreateFolderModal';
import { useSharingModal } from '../../../modals/SharingModal/SharingModal';
import { useDocumentActions, useFileUploadInput, useFolderUploadInput } from '../../../store';
import { useDriveDocsFeatureFlag, useIsSheetsEnabled } from '../../../store/_documents';
import type { ContextMenuProps } from '../../FileBrowser/interface';
import { useFileSharingModal } from '../../modals/SelectLinkToShareModal/SelectLinkToShareModal';
import { ShareFileButton, ShareLinkButton } from '../ContextMenu/buttons';
import useIsEditEnabled from '../useIsEditEnabled';
import { CreateNewFileButton, CreateNewFolderButton, UploadFileButton, UploadFolderButton } from './ContextMenuButtons';
import CreateNewDocumentButton from './ContextMenuButtons/CreateNewDocumentButton';
import CreateNewSheetButton from './ContextMenuButtons/CreateNewSheetButton';

export function FolderContextMenu({
    shareId,
    anchorRef,
    isOpen,
    position,
    open,
    close,
    permissions,
    isActiveLinkReadOnly,
    isActiveLinkRoot,
    isActiveLinkInDeviceShare,
}: ContextMenuProps & {
    shareId: string;
    permissions: SHARE_MEMBER_PERMISSIONS;
    isActiveLinkReadOnly?: boolean;
    isActiveLinkRoot?: boolean;
    isActiveLinkInDeviceShare?: boolean;
}) {
    useEffect(() => {
        if (position) {
            open();
        }
    }, [position]);

    const isEditEnabled = useIsEditEnabled();

    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick: fileClick,
        handleChange: fileChange,
    } = useFileUploadInput(activeFolder.volumeId, activeFolder.shareId, activeFolder.linkId);
    const {
        inputRef: folderInput,
        handleClick: folderClick,
        handleChange: folderChange,
    } = useFolderUploadInput(activeFolder.volumeId, activeFolder.shareId, activeFolder.linkId);
    const { createFolderModal, showCreateFolderModal } = useCreateFolderModal();
    const { createFileModal, showCreateFileModal } = useCreateFileModal();
    const [fileSharingModal, showFileSharingModal] = useFileSharingModal();
    const { sharingModal, showSharingModal } = useSharingModal();

    const isEditor = useMemo(() => getCanWrite(permissions), [permissions]);
    const isAdmin = useMemo(() => getCanAdmin(permissions), [permissions]);

    const { createDocument } = useDocumentActions();
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const isSheetsEnabled = useIsSheetsEnabled();

    // All actions in this context menu needs editor permissions
    if (!isEditor) {
        return null;
    }

    const shouldShowShareButton = isAdmin && (isActiveLinkReadOnly || isActiveLinkRoot);
    const shouldShowShareLinkButton = isAdmin && !isActiveLinkReadOnly && !isActiveLinkRoot;
    const activeFolderUid = generateNodeUid(activeFolder.volumeId, activeFolder.linkId);
    // ContextMenu is removed from DOM when any action is executed but inputs
    // need to stay rendered so onChange handler can work.
    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={fileChange} />
            <input type="file" ref={folderInput} className="hidden" onChange={folderChange} />
            {createFolderModal}
            {createFileModal}
            {fileSharingModal}
            {sharingModal}
            <ContextMenu isOpen={isOpen} close={close} position={position} anchorRef={anchorRef}>
                {!isActiveLinkReadOnly && (
                    <CreateNewFolderButton
                        close={close}
                        action={() => showCreateFolderModal({ parentFolderUid: activeFolderUid })}
                    />
                )}
                {isDocsEnabled && !isActiveLinkReadOnly && !isActiveLinkInDeviceShare && (
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
                {isSheetsEnabled && !isActiveLinkReadOnly && !isActiveLinkInDeviceShare && (
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
                {isEditEnabled && !isActiveLinkReadOnly && (
                    <CreateNewFileButton close={close} action={() => showCreateFileModal({})} />
                )}
                {!isActiveLinkReadOnly && <ContextSeparator />}
                {!isActiveLinkReadOnly ? (
                    <>
                        <UploadFileButton close={close} onClick={fileClick} />
                        <UploadFolderButton close={close} onClick={folderClick} />
                    </>
                ) : null}
                {shouldShowShareButton && (
                    <>
                        {/* // Device only have one entry in context menu */}
                        {!isActiveLinkReadOnly && <ContextSeparator />}
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
