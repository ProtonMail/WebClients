import { useRef, useState, useCallback } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Icon, useNotifications, InputFieldTwo, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { useModalStateObject } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { IcBrandProtonDrive } from '@proton/icons/icons/IcBrandProtonDrive';
import { DRIVE_APP_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import type { Asset } from '../../types';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import { selectAssetsBySpaceId, selectSpaceById } from '../../redux/selectors';
import { handleSpaceAssetFileAsync } from '../../services/files';
import { locallyDeleteAssetFromLocalRequest } from '../../redux/slices/core/assets';
import { KnowledgeFileItem } from '../components/Files/KnowledgeBase/KnowledgeFileItem';
import { FileContentModal } from '../components/Files/KnowledgeBase/FileContentModal';
import { DriveBrowser } from '../components/Files/DriveBrowser/DriveBrowser';
import { LinkDriveFolderModal } from './modals/LinkDriveFolderModal';
import { useDriveSDK } from '../../hooks/useDriveSDK';

import './ProjectFilesPanel.scss';

interface ProjectFilesPanelProps {
    projectId: string;
    instructions?: string;
    onEditInstructions: () => void;
}

export const ProjectFilesPanel = ({ projectId, instructions, onEditInstructions }: ProjectFilesPanelProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const driveBrowserUploadRef = useRef<(() => void) | null>(null);
    const driveBrowserRefreshRef = useRef<(() => void) | null>(null);
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const [fileToView, setFileToView] = useState<Asset | null>(null);
    const linkDriveFolderModal = useModalStateObject();
    const [createFolderModal, setCreateFolderModalOpen] = useState(false);
    const { createFolder } = useDriveSDK();
    const [folderName, setFolderName] = useState('');
    const [loading, withLoading] = useLoading();

    // Get space and check if Drive folder is linked
    const space = useLumoSelector((state) => selectSpaceById(projectId)(state));
    const linkedDriveFolder = space?.linkedDriveFolder;

    // Get space assets (persistent files) - only if no Drive folder is linked
    const spaceAssets = useLumoSelector((state) => selectAssetsBySpaceId(projectId)(state));
    const files = Object.values(spaceAssets).filter((asset) => !asset.error);

    // Check if we should prevent linking (files already exist)
    const hasExistingFiles = files.length > 0;

    const handleCreateFolder = useCallback(async () => {
        if (!linkedDriveFolder || !folderName.trim()) {
            return;
        }

        try {
            const trimmedFolderName = folderName.trim();
            await createFolder(linkedDriveFolder.folderId, trimmedFolderName);
            createNotification({
                text: c('collider_2025:Success').t`Folder "${trimmedFolderName}" created successfully`,
                type: 'success',
            });
            setFolderName('');
            setCreateFolderModalOpen(false);
            // Refresh the DriveBrowser to show the new folder
            if (driveBrowserRefreshRef.current) {
                driveBrowserRefreshRef.current();
            }
        } catch (error) {
            console.error('Failed to create folder:', error);
            createNotification({
                text: error instanceof Error ? error.message : c('collider_2025:Error').t`Failed to create folder`,
                type: 'error',
            });
        }
    }, [linkedDriveFolder, folderName, createFolder, createNotification]);

    const handleAddFiles = () => {
        // If Drive folder is linked, use DriveBrowser's upload handler
        if (linkedDriveFolder && driveBrowserUploadRef.current) {
            driveBrowserUploadRef.current();
            return;
        }
        // Otherwise use the regular file input
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        if (selectedFiles.length === 0) return;

        // If Drive folder is linked, uploads are handled by DriveBrowser via the ref
        // This should not be called when a folder is linked, but handle it gracefully
        if (linkedDriveFolder) {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        // Process each file as a space asset (when no Drive folder is linked)
        for (const file of selectedFiles) {
            try {
                console.log('Processing file as space asset:', file.name, projectId);

                const result = await dispatch(handleSpaceAssetFileAsync(file, projectId));

                if (result.success) {
                    createNotification({
                        text: c('collider_2025:Success').t`File "${file.name}" added to project`,
                        type: 'success',
                    });
                } else if (result.isDuplicate) {
                    createNotification({
                        text: c('collider_2025:Info').t`File "${file.name}" is already in this project`,
                        type: 'info',
                    });
                } else if (result.isUnsupported) {
                    createNotification({
                        text: c('collider_2025:Error').t`File type not supported: ${file.name}`,
                        type: 'error',
                    });
                } else {
                    createNotification({
                        text: c('collider_2025:Error').t`Failed to process file: ${file.name}`,
                        type: 'error',
                    });
                }
            } catch (error) {
                console.error('Error uploading file:', error);
                createNotification({
                    text: c('collider_2025:Error').t`Error uploading file: ${file.name}`,
                    type: 'error',
                });
            }
        }

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDriveFileSelect = useCallback(
        async (file: any, content: Uint8Array<ArrayBuffer>) => {
            // When folder is linked, files are automatically available - don't create assets
            if (linkedDriveFolder) {
                // Files in linked folder are automatically active, no need to process
                return;
            }

            // When a file is selected from Drive (and folder is not linked), process it as a space asset
            try {
                const blob = new Blob([content]);
                const fileObj = new File([blob], file.name, { type: file.mimeType || 'application/octet-stream' });
                const result = await dispatch(handleSpaceAssetFileAsync(fileObj, projectId));

                if (result.success) {
                    createNotification({
                        text: c('collider_2025:Success').t`File "${file.name}" added to project`,
                        type: 'success',
                    });
                }
            } catch (error) {
                console.error('Error processing Drive file:', error);
                createNotification({
                    text: c('collider_2025:Error').t`Error processing file: ${file.name}`,
                    type: 'error',
                });
            }
        },
        [dispatch, projectId, createNotification, linkedDriveFolder]
    );

    const handleViewFile = (asset: Asset) => {
        setFileToView(asset);
    };

    const handleCloseFileView = () => {
        setFileToView(null);
    };

    const handleRemoveFile = (id: string) => {
        dispatch(locallyDeleteAssetFromLocalRequest(id));
        createNotification({
            text: c('collider_2025:Success').t`File removed from project`,
            type: 'success',
        });
    };

    return (
        <div className="project-files-panel">
            <div className="project-files-panel-content">
                {/* Instructions Section */}
                <div className="project-files-section">
                <div className="project-files-section-header">
                    <h3 className="project-files-section-title">{c('collider_2025:Title').t`Instructions`}</h3>
                    <Button
                        icon
                        shape="ghost"
                        size="small"
                        onClick={onEditInstructions}
                        title={c('collider_2025:Action').t`Edit instructions`}
                    >
                        <Icon name="pen" size={4} />
                    </Button>
                </div>
                <div className="project-files-section-content">
                    {instructions ? (
                        <p className="project-instructions-text">{instructions}</p>
                    ) : (
                        <button className="project-instructions-add" onClick={onEditInstructions}>
                            <Icon name="plus" size={4} />
                            <span>{c('collider_2025:Button').t`Add instructions to tailor ${LUMO_SHORT_APP_NAME}'s responses`}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Files Section */}
            <div className="project-files-section">
                <div className="project-files-section-header">
                    <h3 className="project-files-section-title">{c('collider_2025:Title').t`Project knowledge`}</h3>
                    <div className="flex items-center gap-1">
                        {linkedDriveFolder && (
                            <Button
                                icon
                                shape="ghost"
                                size="small"
                                onClick={() => linkDriveFolderModal.openModal(true)}
                                title={c('collider_2025:Action').t`Manage Drive folder link`}
                            >
                                <Icon name="meet-settings" size={4} />
                            </Button>
                        )}
                    </div>
                </div>
                <div className="project-files-section-content files-section">
                    {linkedDriveFolder ? (
                        <div className="project-drive-browser">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <IcBrandProtonDrive size={4} className="color-primary flex-shrink-0" />
                                        <span className="text-sm font-semibold">{linkedDriveFolder.folderName}</span>
                                    </div>
                                    <div className="text-xs color-weak">/{linkedDriveFolder.folderPath}</div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button
                                        icon
                                        shape="ghost"
                                        size="small"
                                        onClick={() => {
                                            setFolderName('');
                                            setCreateFolderModalOpen(true);
                                        }}
                                        title={c('collider_2025:Action').t`Create folder`}
                                    >
                                        <Icon name="folder-plus" size={4} />
                                    </Button>
                                    <Button
                                        icon
                                        shape="ghost"
                                        size="small"
                                        onClick={handleAddFiles}
                                        title={c('collider_2025:Action').t`Upload file`}
                                    >
                                        <Icon name="arrow-up-line" size={4} />
                                    </Button>
                                </div>
                            </div>
                            <DriveBrowser
                                onFileSelect={handleDriveFileSelect}
                                initialShowDriveBrowser={true}
                                isModal={false}
                                initialFolderId={linkedDriveFolder.folderId}
                                initialFolderName={linkedDriveFolder.folderName}
                                isLinkedFolder={true}
                                hideHeader={true}
                                onUploadTriggerRef={driveBrowserUploadRef}
                                onRefreshTriggerRef={driveBrowserRefreshRef}
                            />
                        </div>
                    ) : files.length === 0 ? (
                        <div className="project-files-empty">
                            <div className="project-files-options">
                                <button className="project-files-option" onClick={handleAddFiles}>
                                    <Icon name="paper-clip" size={5} />
                                    <div className="project-files-option-content">
                                        <span className="project-files-option-text">
                                            {c('collider_2025:Button').t`Add files`}
                                        </span>
                                        <span className="project-files-option-subtext">
                                            {c('collider_2025:Info').t`Load files to be used by ${LUMO_SHORT_APP_NAME} in answering all your questions`}
                                        </span>
                                    </div>
                                </button>
                                <button
                                    className="project-files-option"
                                    onClick={() => linkDriveFolderModal.openModal(true)}
                                >
                                    <IcBrandProtonDrive size={5} />
                                    <div className="project-files-option-content">
                                        <span className="project-files-option-text">
                                            {c('collider_2025:Button').t`Link ${DRIVE_APP_NAME}`}
                                        </span>
                                        <span className="project-files-option-subtext">
                                            {c('collider_2025:Info').t`Link a folder in your ${DRIVE_APP_NAME} which will be indexed locally and usable by ${LUMO_SHORT_APP_NAME} when generating answers`}
                                        </span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="project-files-list">
                            {files.map((file) => (
                                <KnowledgeFileItem
                                    key={file.id}
                                    file={file}
                                    onView={(file, fullAttachment) => handleViewFile(fullAttachment)}
                                    onRemove={handleRemoveFile}
                                    isActive={true}
                                    showToggle={false}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="*/*"
            />

            {/* File preview modal */}
            {fileToView && (
                <FileContentModal attachment={fileToView} onClose={handleCloseFileView} open={!!fileToView} />
            )}

            {/* Link Drive Folder Modal */}
            {linkDriveFolderModal.render && (
                <LinkDriveFolderModal
                    {...linkDriveFolderModal.modalProps}
                    projectId={projectId}
                />
            )}

            {/* Create Folder Modal */}
            {createFolderModal && (
                <ModalTwo
                    as="form"
                    disableCloseOnEscape={loading}
                    onClose={() => {
                        setCreateFolderModalOpen(false);
                        setFolderName('');
                    }}
                    onSubmit={(e: React.FormEvent) => {
                        e.preventDefault();
                        if (folderName.trim()) {
                            void withLoading(handleCreateFolder());
                        }
                    }}
                    size="large"
                    open={createFolderModal}
                >
                    <ModalTwoHeader
                        closeButtonProps={{ disabled: loading }}
                        title={c('Title').t`Create a new folder`}
                    />
                    <ModalTwoContent>
                        <InputFieldTwo
                            id="folder-name"
                            autoFocus
                            value={folderName}
                            label={c('Label').t`Folder name`}
                            placeholder={c('Placeholder').t`Enter a new folder name`}
                            onChange={(e) => setFolderName(e.target.value)}
                            required
                        />
                    </ModalTwoContent>
                    <ModalTwoFooter>
                        <Button
                            type="button"
                            onClick={() => {
                                setCreateFolderModalOpen(false);
                                setFolderName('');
                            }}
                            disabled={loading}
                        >
                            {c('Action').t`Cancel`}
                        </Button>
                        <Button color="norm" type="submit" loading={loading} disabled={!folderName.trim()}>
                            {c('Action').t`Create`}
                        </Button>
                    </ModalTwoFooter>
                </ModalTwo>
            )}
        </div>
        </div>
    );
};

