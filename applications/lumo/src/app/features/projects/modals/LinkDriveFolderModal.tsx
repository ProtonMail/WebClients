import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, useNotifications } from '@proton/components';
import type { ModalStateProps } from '@proton/components';
import { DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { MAX_INDEXABLE_FILES, useDriveFolderIndexing } from '../../../hooks/useDriveFolderIndexing';
import { useDriveSDK } from '../../../hooks/useDriveSDK';
import type { DriveNode } from '../../../hooks/useDriveSDK';
import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { selectAttachmentsBySpaceId, selectSpaceById } from '../../../redux/selectors';
import { deleteAttachment } from '../../../redux/slices/core/attachments';
import { addSpace, pushSpaceRequest } from '../../../redux/slices/core/spaces';
import { getProjectInfo } from '../../../types';
import { sendProjectDriveFolderLinkEvent, sendProjectDriveFolderUnlinkEvent } from '../../../util/telemetry';
import { DriveBrowser } from '../../../components/Files';

interface LinkDriveFolderModalProps extends ModalStateProps {
    projectId: string;
}

export const LinkDriveFolderModal = ({ projectId, ...modalProps }: LinkDriveFolderModalProps) => {
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const space = useLumoSelector(selectSpaceById(projectId));
    const spaceAttachments = useLumoSelector(selectAttachmentsBySpaceId(projectId));
    // Filter out auto-retrieved files - they're from Drive indexing, not user uploads
    // Also require filename to match ProjectFilesPanel filter (excludes incomplete/syncing attachments)
    const files = Object.values(spaceAttachments).filter(
        (attachment) => !attachment.error && !attachment.autoRetrieved && attachment.filename
    );
    const hasExistingFiles = files.length > 0;
    const { isInitialized, getRootFolder } = useDriveSDK();
    const { indexFolder, removeIndexedFolder } = useDriveFolderIndexing();
    const [currentBrowsedFolder, setCurrentBrowsedFolder] = useState<DriveNode | null>(null);
    const [rootFolderId, setRootFolderId] = useState<string | null>(null);
    const [folderPath, setFolderPath] = useState<string[]>([]);

    // Project variables
    const { linkedDriveFolder } = getProjectInfo(space);
    const isLinkedToDrive = linkedDriveFolder !== undefined;

    // Initialize root folder ID when Drive is ready
    useEffect(() => {
        if (isInitialized && !rootFolderId) {
            void (async () => {
                try {
                    const root = await getRootFolder();
                    setRootFolderId(root.nodeUid);
                    setCurrentBrowsedFolder(root);
                    setFolderPath([root.name]);
                } catch (error) {
                    console.error('Failed to get root folder:', error);
                }
            })();
        }
    }, [isInitialized, rootFolderId, getRootFolder]);

    const handleFolderNavigate = useCallback((folder: DriveNode) => {
        setCurrentBrowsedFolder(folder);
        setFolderPath((prev) => [...prev, folder.name]);
    }, []);

    const isAtRoot = !currentBrowsedFolder || currentBrowsedFolder.nodeUid === rootFolderId;

    const handleLinkFolder = useCallback(async () => {
        if (!currentBrowsedFolder || !space || isAtRoot) {
            return;
        }

        try {
            // Update the space with linked folder info
            const updatedSpace = {
                ...space,
                linkedDriveFolder: {
                    folderId: currentBrowsedFolder.nodeUid,
                    folderName: currentBrowsedFolder.name,
                    folderPath: folderPath.join(' / '),
                },
            };

            dispatch(addSpace(updatedSpace));
            dispatch(pushSpaceRequest({ id: projectId }));

            // Kick off indexing for this folder, associated to the project space
            void indexFolder(currentBrowsedFolder.nodeUid, currentBrowsedFolder.name, folderPath.join(' / '), {
                spaceId: projectId,
            })
                .then((result) => {
                    if (result.limitExceeded) {
                        createNotification({
                            text: c('collider_2025:Warning')
                                .t`This folder contains ${result.totalFiles} indexable files. Only the first ${MAX_INDEXABLE_FILES} files were indexed. ${result.skippedFiles} files were skipped.`,
                            type: 'warning',
                        });
                    }
                })
                .catch((error) => {
                    console.error('Drive folder indexing failed:', error);
                    createNotification({
                        text: c('collider_2025:Error').t`Failed to index Drive folder for search`,
                        type: 'error',
                    });
                });

            sendProjectDriveFolderLinkEvent();

            createNotification({
                text: c('collider_2025:Success').t`Drive folder linked successfully`,
                type: 'success',
            });

            modalProps.onClose?.();
        } catch (error) {
            console.error('Failed to link Drive folder:', error);
            createNotification({
                text: c('collider_2025:Error').t`Failed to link Drive folder`,
                type: 'error',
            });
        }
    }, [
        currentBrowsedFolder,
        space,
        folderPath,
        dispatch,
        projectId,
        createNotification,
        modalProps,
        isAtRoot,
        indexFolder,
    ]);

    const handleUnlinkFolder = useCallback(() => {
        if (!space) {
            return;
        }

        try {
            const updatedSpace = {
                ...space,
                linkedDriveFolder: undefined,
            };

            dispatch(addSpace(updatedSpace));
            dispatch(pushSpaceRequest({ id: projectId }));

            const folderId = linkedDriveFolder?.folderId;
            if (folderId) {
                void removeIndexedFolder(folderId);
            }

            // Clean up auto-retrieved attachments from this space
            // These are Drive files that were indexed but shouldn't be persisted
            const autoRetrievedAttachments = Object.values(spaceAttachments).filter(
                (attachment) => attachment.autoRetrieved || attachment.driveNodeId
            );
            for (const attachment of autoRetrievedAttachments) {
                dispatch(deleteAttachment(attachment.id));
            }

            sendProjectDriveFolderUnlinkEvent();

            createNotification({
                text: c('collider_2025:Success').t`Drive folder unlinked`,
                type: 'success',
            });

            modalProps.onClose?.();
        } catch (error) {
            console.error('Failed to unlink Drive folder:', error);
            createNotification({
                text: c('collider_2025:Error').t`Failed to unlink Drive folder`,
                type: 'error',
            });
        }
    }, [space, dispatch, projectId, createNotification, modalProps, removeIndexedFolder, spaceAttachments]);

    return (
        <ModalTwo {...modalProps} size="large" className="link-drive-folder-modal">
            <ModalTwoHeader
                title={
                    isLinkedToDrive
                        ? c('collider_2025:Title').t`Linked Drive Folder`
                        : c('collider_2025:Title').t`Link Drive Folder`
                }
            />
            <ModalTwoContent>
                {/* eslint-disable no-nested-ternary */}
                {!isInitialized ? (
                    <div className="flex items-center justify-center p-8">
                        <Icon name="brand-proton-drive-filled" className="mr-2" />
                        <span>{c('collider_2025:Info').t`Initializing Drive...`}</span>
                    </div>
                ) : isLinkedToDrive ? (
                    <div className="p-4">
                        <div className="mb-4 p-4 bg-weak rounded border border-weak">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon name="folder" size={5} className="color-primary" />
                                <span className="text-bold">{linkedDriveFolder.folderName}</span>
                            </div>
                            <div className="text-sm color-weak">{linkedDriveFolder.folderPath}</div>
                        </div>
                        <p className="text-sm color-weak mb-4">
                            {c('collider_2025:Info')
                                .t`Files uploaded to this project will be saved to the linked Drive folder.`}
                        </p>
                        <Button color="danger" onClick={handleUnlinkFolder}>
                            {c('collider_2025:Action').t`Unlink Folder`}
                        </Button>
                    </div>
                ) : (
                    <div className="link-drive-folder-content">
                        {hasExistingFiles ? (
                            <div className="p-4 bg-warning-weak rounded border border-warning">
                                <div className="flex items-center gap-2 mb-2">
                                    <Icon name="exclamation-triangle-filled" className="color-warning" />
                                    <span className="text-bold">{c('collider_2025:Warning')
                                        .t`Cannot Link Drive Folder`}</span>
                                </div>
                                <p className="text-sm mb-0">
                                    {c('collider_2025:Info')
                                        .t`This project already has files. Please remove all files before linking a Drive folder.`}
                                </p>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm color-weak mb-4">
                                    {c('collider_2025:Info')
                                        .jt`Browse to the ${DRIVE_SHORT_APP_NAME} folder you want to link to this project, then click "Link this folder".`}
                                </p>
                                <DriveBrowser
                                    onFileSelect={() => {
                                        // Ignore file selection in folder browsing mode
                                    }}
                                    onFolderSelect={handleFolderNavigate}
                                    folderSelectionMode={true}
                                    initialShowDriveBrowser={true}
                                    hideHeader={true}
                                />
                                {currentBrowsedFolder && !isAtRoot && (
                                    <div className="mt-4 p-4 bg-weak rounded border border-weak">
                                        <div className="flex items-center gap-2">
                                            <Icon name="folder" className="color-norm" />
                                            <span className="text-sm">
                                                {c('collider_2025:Label').t`Current folder:`}{' '}
                                                <span className="text-bold">{currentBrowsedFolder.name}</span>
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </ModalTwoContent>
            {!isLinkedToDrive && !hasExistingFiles && (
                <ModalTwoFooter>
                    <Button onClick={modalProps.onClose} color="weak">
                        {c('collider_2025:Button').t`Cancel`}
                    </Button>
                    <Button onClick={handleLinkFolder} color="norm" disabled={isAtRoot}>
                        <span>{c('collider_2025:Button').t`Link this folder`}</span>
                    </Button>
                </ModalTwoFooter>
            )}
        </ModalTwo>
    );
};
