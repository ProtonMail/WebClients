import { useEffect, useMemo } from 'react';
import * as React from 'react';

import { ContextMenu, ContextSeparator } from '@proton/components';
import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';
import { getCanAdmin, getCanWrite } from '@proton/shared/lib/drive/permissions';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import { useDriveSharingFlags, useFileUploadInput, useFolderUploadInput } from '../../../store';
import { useDocumentActions, useDriveDocsFeatureFlag } from '../../../store/_documents';
import type { ContextMenuProps } from '../../FileBrowser/interface';
import { useCreateFileModal } from '../../modals/CreateFileModal';
import { useCreateFolderModal } from '../../modals/CreateFolderModal';
import { useFileSharingModal } from '../../modals/SelectLinkToShareModal/SelectLinkToShareModal';
import { useLinkSharingModal } from '../../modals/ShareLinkModal/ShareLinkModal';
import { ShareFileButton } from '../ContextMenu/buttons';
import ShareFileButtonLEGACY from '../ContextMenu/buttons/_legacy/ShareFileButtonLEGACY';
import useIsEditEnabled from '../useIsEditEnabled';
import { CreateNewFileButton, CreateNewFolderButton, UploadFileButton, UploadFolderButton } from './ContextMenuButtons';
import CreateNewDocumentButton from './ContextMenuButtons/CreateNewDocumentButton';

export function FolderContextMenu({
    shareId,
    anchorRef,
    isOpen,
    position,
    open,
    close,
    permissions,
    isActiveLinkReadOnly,
}: ContextMenuProps & {
    shareId: string;
    permissions: SHARE_MEMBER_PERMISSIONS;
    isActiveLinkReadOnly?: boolean;
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
    const { isSharingInviteAvailable } = useDriveSharingFlags();

    const isEditor = useMemo(() => getCanWrite(permissions), [permissions]);
    const isAdmin = useMemo(() => getCanAdmin(permissions), [permissions]);

    const ShareFileButtonComponent = isSharingInviteAvailable ? ShareFileButton : ShareFileButtonLEGACY;

    const { createDocument } = useDocumentActions();
    const { isDocsEnabled } = useDriveDocsFeatureFlag();

    // All actions in this context menu needs editor permissions
    if (!isEditor) {
        return null;
    }

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
                {!isActiveLinkReadOnly && (
                    <CreateNewFolderButton close={close} action={() => showCreateFolderModal({})} />
                )}
                {isDocsEnabled && !isActiveLinkReadOnly && (
                    <CreateNewDocumentButton
                        close={close}
                        action={() => {
                            void createDocument({
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
                {isAdmin && !isActiveLinkReadOnly && <ContextSeparator />}
                {isAdmin && (
                    <ShareFileButtonComponent
                        close={close}
                        shareId={shareId}
                        showFileSharingModal={showFileSharingModal}
                        showLinkSharingModal={showLinkSharingModal}
                    />
                )}
            </ContextMenu>
        </>
    );
}
