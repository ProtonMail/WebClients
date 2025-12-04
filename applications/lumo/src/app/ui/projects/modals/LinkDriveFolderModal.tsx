import { useState, useCallback } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, useNotifications } from '@proton/components';
import type { ModalStateProps } from '@proton/components';

import { useDriveSDK } from '../../../hooks/useDriveSDK';
import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { selectSpaceById, selectAssetsBySpaceId } from '../../../redux/selectors';
import { addSpace, pushSpaceRequest } from '../../../redux/slices/core/spaces';
import type { DriveNode } from '../../../hooks/useDriveSDK';
import { DriveBrowser } from '../../components/Files/DriveBrowser/DriveBrowser';

interface LinkDriveFolderModalProps extends ModalStateProps {
    projectId: string;
}

export const LinkDriveFolderModal = ({ projectId, ...modalProps }: LinkDriveFolderModalProps) => {
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const space = useLumoSelector((state) => selectSpaceById(projectId)(state));
    const spaceAssets = useLumoSelector((state) => selectAssetsBySpaceId(projectId)(state));
    const files = Object.values(spaceAssets).filter((asset) => !asset.error);
    const hasExistingFiles = files.length > 0;
    const { isInitialized, browseFolderChildren, getRootFolder } = useDriveSDK();
    const [selectedFolder, setSelectedFolder] = useState<DriveNode | null>(null);
    const [folderPath, setFolderPath] = useState<string>('');

    const handleFolderSelect = useCallback((folder: DriveNode) => {
        if (folder.type === 'folder') {
            setSelectedFolder(folder);
            // Build path from folder name - in a real implementation, we'd track breadcrumbs
            setFolderPath(folder.name);
        }
    }, []);

    const handleLinkFolder = useCallback(async () => {
        if (!selectedFolder || !space) {
            return;
        }

        try {
            // Update the space with linked folder info
            const updatedSpace = {
                ...space,
                linkedDriveFolder: {
                    folderId: selectedFolder.nodeId,
                    folderName: selectedFolder.name,
                    folderPath: folderPath || selectedFolder.name,
                },
            };

            dispatch(addSpace(updatedSpace));
            dispatch(pushSpaceRequest({ id: projectId }));

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
    }, [selectedFolder, space, folderPath, dispatch, projectId, createNotification, modalProps]);

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
    }, [space, dispatch, projectId, createNotification, modalProps]);

    const isLinked = !!space?.linkedDriveFolder;

    return (
        <ModalTwo {...modalProps} size="large" className="link-drive-folder-modal">
            <ModalTwoHeader
                title={
                    isLinked
                        ? c('collider_2025:Title').t`Linked Drive Folder`
                        : c('collider_2025:Title').t`Link Drive Folder`
                }
            />
            <ModalTwoContent>
                {!isInitialized ? (
                    <div className="flex items-center justify-center p-8">
                        <Icon name="circle-notch" className="mr-2" />
                        <span>{c('collider_2025:Info').t`Initializing Drive...`}</span>
                    </div>
                ) : isLinked ? (
                    <div className="p-4">
                        <div className="mb-4 p-4 bg-weak rounded border border-weak">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon name="folder" size={5} className="color-primary" />
                                <span className="text-bold">{space.linkedDriveFolder?.folderName}</span>
                            </div>
                            <div className="text-sm color-weak">{space.linkedDriveFolder?.folderPath}</div>
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
                                    <span className="text-bold">{c('collider_2025:Warning').t`Cannot Link Drive Folder`}</span>
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
                                        .t`Select a Drive folder to link to this project. Files uploaded to this project will be saved to the linked folder.`}
                                </p>
                                <DriveBrowser
                                    onFileSelect={() => {
                                        // Ignore file selection in folder selection mode
                                    }}
                                    onFolderSelect={handleFolderSelect}
                                    folderSelectionMode={true}
                                    initialShowDriveBrowser={true}
                                    isModal={true}
                                />
                                {selectedFolder && (
                                    <div className="mt-4 p-4 bg-weak rounded border border-weak">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Icon name="checkmark-circle" className="color-success" />
                                            <span className="text-bold">{c('collider_2025:Label').t`Selected Folder`}</span>
                                        </div>
                                        <div className="text-sm">{selectedFolder.name}</div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </ModalTwoContent>
            {!isLinked && !hasExistingFiles && (
                <ModalTwoFooter>
                    <Button onClick={modalProps.onClose} color="weak">
                        {c('collider_2025:Button').t`Cancel`}
                    </Button>
                    <Button onClick={handleLinkFolder} color="norm" disabled={!selectedFolder}>
                        {c('collider_2025:Button').t`Link this folder`}
                    </Button>
                </ModalTwoFooter>
            )}
        </ModalTwo>
    );
};

