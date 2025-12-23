import { useCallback, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import {
    Icon,
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useModalStateObject,
    useNotifications,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import { IcBrandProtonDrive } from '@proton/icons/icons/IcBrandProtonDrive';
import { DRIVE_APP_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { MAX_ASSET_SIZE } from '../../constants';
import { useDriveSDK } from '../../hooks/useDriveSDK';
import { useSearchService } from '../../hooks/useSearchService';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import { selectAssetsBySpaceId, selectSpaceById } from '../../redux/selectors';
import { locallyDeleteAssetFromLocalRequest } from '../../redux/sagas/assets';
import { handleSpaceAssetFileAsync } from '../../services/files';
import type { Attachment } from '../../types';

// Type alias for backwards compatibility
type Asset = Attachment;
import { DriveBrowser, type DriveBrowserHandle } from '../components/Files/DriveBrowser/DriveBrowser';
import { type UploadProgress, UploadProgressOverlay } from '../components/Files/DriveBrowser/UploadProgressOverlay';
import { FileContentModal } from '../components/Files/KnowledgeBase/FileContentModal';
import { KnowledgeFileItem } from '../components/Files/KnowledgeBase/KnowledgeFileItem';
import { LinkDriveFolderModal } from './modals/LinkDriveFolderModal';

import './ProjectFilesPanel.scss';

interface ProjectFilesPanelProps {
    projectId: string;
    instructions?: string;
    onEditInstructions: () => void;
}

export const ProjectFilesPanel = ({ projectId, instructions, onEditInstructions }: ProjectFilesPanelProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const driveBrowserRef = useRef<DriveBrowserHandle>(null);
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const [fileToView, setFileToView] = useState<Asset | null>(null);
    const linkDriveFolderModal = useModalStateObject();
    const [createFolderModal, setCreateFolderModalOpen] = useState(false);
    const [removeAllModal, setRemoveAllModalOpen] = useState(false);
    const { createFolder } = useDriveSDK();
    const [folderName, setFolderName] = useState('');
    const [loading, withLoading] = useLoading();
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
    const searchService = useSearchService();

    // Get space and check if Drive folder is linked
    const space = useLumoSelector((state) => selectSpaceById(projectId)(state));
    const linkedDriveFolder = space?.linkedDriveFolder;

    // Get space assets (persistent files) - only if no Drive folder is linked
    // Filter out auto-retrieved Drive files - those are indexed, not uploaded
    const spaceAssets = useLumoSelector((state) => selectAssetsBySpaceId(projectId)(state));
    const files = Object.values(spaceAssets).filter((asset) => !asset.error && !asset.autoRetrieved);

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
            if (driveBrowserRef.current) {
                driveBrowserRef.current.triggerRefresh();
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
        if (linkedDriveFolder && driveBrowserRef.current) {
            driveBrowserRef.current.triggerUpload();
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
                // Check file size limit for direct uploads
                if (file.size > MAX_ASSET_SIZE) {
                    const maxSizeFormatted = humanSize({ bytes: MAX_ASSET_SIZE, unit: 'MB', fraction: 0 });
                    const fileSizeFormatted = humanSize({ bytes: file.size, unit: 'MB', fraction: 1 });
                    createNotification({
                        text: c('collider_2025:Error')
                            .t`File "${file.name}" (${fileSizeFormatted}) exceeds the ${maxSizeFormatted} limit. Link a ${DRIVE_APP_NAME} folder to upload larger files.`,
                        type: 'error',
                        expiration: 8000, // Show longer so user can read the guidance
                    });
                    continue; // Skip this file and continue with the next one
                }

                console.log('Processing file as space asset:', file.name, projectId);

                // Show processing indicator
                setUploadProgress({ fileName: file.name, progress: 0, isProcessing: true });

                const result = await dispatch(handleSpaceAssetFileAsync(file, projectId));

                // Clear progress indicator
                setUploadProgress(null);

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
                setUploadProgress(null);
                createNotification({
                    text: c('collider_2025:Error').t`Error uploading file: ${file.name}`,
                    type: 'error',
                });
            }
        }

        // Clear progress indicator after all files are processed
        setUploadProgress(null);

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
        // Also remove from search index
        if (searchService) {
            searchService.removeDocument(id);
        }
        createNotification({
            text: c('collider_2025:Success').t`File removed from project`,
            type: 'success',
        });
    };

    const handleRemoveAllFilesClick = () => {
        setRemoveAllModalOpen(true);
    };

    const handleConfirmRemoveAllFiles = () => {
        // Remove each file individually to trigger proper cleanup
        for (const file of files) {
            dispatch(locallyDeleteAssetFromLocalRequest(file.id));
        }
        // Also clear from search index
        if (searchService) {
            searchService.removeDocumentsBySpace(projectId);
        }
        setRemoveAllModalOpen(false);
        createNotification({
            text: c('collider_2025:Success').t`All files removed from project`,
            type: 'success',
        });
    };

    return (
        <div className={`project-files-panel md:w-1/3 ${linkedDriveFolder ? 'has-drive-browser' : ''}`}>
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
                                <span>{c('collider_2025:Button')
                                    .t`Add instructions to tailor ${LUMO_SHORT_APP_NAME}'s responses`}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Files Section */}
                <div className="project-files-section flex flex-column flex-nowrap flex-1">
                    <div className="project-files-section-header">
                        <h3 className="project-files-section-title">{c('collider_2025:Title').t`Project knowledge`}</h3>
                        <div className="flex items-center gap-1">
                            {!linkedDriveFolder && files.length !== 0 && (
                                <>
                                    <Button
                                        shape="ghost"
                                        size="small"
                                        onClick={handleRemoveAllFilesClick}
                                        className="project-files-remove-all-button"
                                        title={c('collider_2025:Action').t`Remove all files`}
                                    >
                                        <Icon name="trash" size={4} />
                                    </Button>
                                    <Button
                                        shape="ghost"
                                        size="small"
                                        onClick={handleAddFiles}
                                        className="project-files-add-header-button"
                                        title={c('collider_2025:Action').t`Add files`}
                                    >
                                        <Icon name="arrow-up-line" size={4} />
                                    </Button>
                                </>
                            )}
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
                    <div className="project-files-section-content files-section flex-1">
                        {/* Upload progress overlay */}
                        {uploadProgress && (
                            <div className="project-files-progress-overlay">
                                <UploadProgressOverlay uploadProgress={uploadProgress} />
                            </div>
                        )}
                        {/* eslint-disable no-nested-ternary */}
                        {linkedDriveFolder ? (
                            <div className="project-drive-browser">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Icon
                                                name="brand-proton-drive-filled"
                                                size={4}
                                                className="color-norm flex-shrink-0"
                                            />
                                            <span className="text-sm font-semibold">{c('collider_2025:Info')
                                                .t`Linked with folder in ${DRIVE_APP_NAME}`}</span>
                                            <div className="drive-connection-indicator"></div>
                                        </div>
                                        <div className="text-xs color-weak">{linkedDriveFolder.folderPath}</div>
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
                                    ref={driveBrowserRef}
                                    onFileSelect={handleDriveFileSelect}
                                    initialShowDriveBrowser={true}
                                    isModal={false}
                                    initialFolderId={linkedDriveFolder.folderId}
                                    initialFolderName={linkedDriveFolder.folderName}
                                    isLinkedFolder={true}
                                    hideHeader={true}
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
                                                {c('collider_2025:Info')
                                                    .t`Load files to be used by ${LUMO_SHORT_APP_NAME} in answering all your questions`}
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
                                                {c('collider_2025:Info')
                                                    .t`Link a folder in your ${DRIVE_APP_NAME} which will be indexed locally and usable by ${LUMO_SHORT_APP_NAME} when generating answers`}
                                            </span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
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
                            </>
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
                    <LinkDriveFolderModal {...linkDriveFolderModal.modalProps} projectId={projectId} />
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

                {/* Remove All Files Confirmation Modal */}
                {removeAllModal && (
                    <ModalTwo
                        onClose={() => setRemoveAllModalOpen(false)}
                        size="small"
                        open={removeAllModal}
                    >
                        <ModalTwoHeader title={c('collider_2025:Title').t`Remove all files?`} />
                        <ModalTwoContent>
                            <p className="m-0">
                                {c('collider_2025:Info')
                                    .t`This will remove all ${files.length} files from this project. This action cannot be undone.`}
                            </p>
                        </ModalTwoContent>
                        <ModalTwoFooter>
                            <Button type="button" onClick={() => setRemoveAllModalOpen(false)}>
                                {c('Action').t`Cancel`}
                            </Button>
                            <Button color="danger" onClick={handleConfirmRemoveAllFiles}>
                                {c('collider_2025:Action').t`Remove all`}
                            </Button>
                        </ModalTwoFooter>
                    </ModalTwo>
                )}
            </div>
        </div>
    );
};
