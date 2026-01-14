import React, { useCallback, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import {
    Icon,
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useNotifications,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import { DRIVE_APP_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { MAX_ASSET_SIZE } from '../../constants';
import { useDriveSDK } from '../../hooks/useDriveSDK';
import { useFileProcessing } from '../../hooks/useFileProcessing';
import { useSearchService } from '../../hooks/useSearchService';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import { selectAttachmentsBySpaceId, selectSpaceById } from '../../redux/selectors';
import { locallyDeleteAttachmentFromLocalRequest } from '../../redux/slices/core/attachments';
import { handleSpaceAttachmentFileAsync } from '../../services/files';
import type { Attachment, ProjectSpace } from '../../types';
import type { BreadcrumbItem } from '../components/Files/DriveBrowser/DriveBreadcrumbs';
import type { DriveBrowserHandle } from '../components/Files/DriveBrowser/DriveBrowser';
import type { UploadProgress } from '../components/Files/DriveBrowser/UploadProgressOverlay';
import { FileContentModal } from '../components/Files/KnowledgeBase/FileContentModal';
import { ProjectKnowledgeSection } from './ProjectKnowledgeSection';

import './ProjectFilesPanel.scss';

interface ProjectFilesPanelProps {
    projectId: string;
    instructions?: string;
    onEditInstructions: () => void;
    modal?: boolean;
}

export const ProjectFilesPanel = ({
    projectId,
    instructions,
    onEditInstructions,
    modal = false,
}: ProjectFilesPanelProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const driveBrowserRef = useRef<DriveBrowserHandle>(null);
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const [fileToView, setFileToView] = useState<Attachment | null>(null);
    const [createFolderModal, setCreateFolderModalOpen] = useState(false);
    const [removeAllModal, setRemoveAllModalOpen] = useState(false);
    const { createFolder } = useDriveSDK();
    const [folderName, setFolderName] = useState('');
    const [loading, withLoading] = useLoading();
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
    const searchService = useSearchService();
    const fileProcessingService = useFileProcessing();

    const space = useLumoSelector(selectSpaceById(projectId));
    const spaceProject = space?.isProject ? (space satisfies ProjectSpace) : undefined;
    const linkedDriveFolder = spaceProject?.linkedDriveFolder;
    const isRootFolder = breadcrumbs.length === 1;

    const spaceAttachments = useLumoSelector(selectAttachmentsBySpaceId(projectId));
    const files = Object.values(spaceAttachments).filter(
        (attachment) => !attachment.error && !attachment.autoRetrieved && attachment.filename
    );

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

        for (const file of selectedFiles) {
            try {
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

                console.log('Processing file as space attachment:', file.name, projectId);

                setUploadProgress({ fileName: file.name, progress: 0, isProcessing: true });

                const result = await dispatch(handleSpaceAttachmentFileAsync(file, projectId, fileProcessingService));

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

        setUploadProgress(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDriveFileSelect = useCallback(
        async (file: any, content: Uint8Array<ArrayBuffer>) => {
            if (linkedDriveFolder) {
                return;
            }

            try {
                const blob = new Blob([content]);
                const fileObj = new File([blob], file.name, { type: file.mimeType || 'application/octet-stream' });
                const result = await dispatch(
                    handleSpaceAttachmentFileAsync(fileObj, projectId, fileProcessingService)
                );

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

    // Handle breadcrumb changes from DriveBrowser
    const handleBreadcrumbsChange = useCallback((newBreadcrumbs: BreadcrumbItem[]) => {
        setBreadcrumbs(newBreadcrumbs);
    }, []);

    const handleBreadcrumbClick = useCallback((breadcrumb: BreadcrumbItem) => {
        // Navigate using DriveBrowser's navigation method
        if (driveBrowserRef.current) {
            driveBrowserRef.current.navigateToBreadcrumb(breadcrumb);
        }
    }, []);

    const handleViewFile = (attachment: Attachment) => {
        setFileToView(attachment);
    };

    const handleCloseFileView = () => {
        setFileToView(null);
    };

    const handleRemoveFile = (id: string) => {
        dispatch(locallyDeleteAttachmentFromLocalRequest(id));
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
            dispatch(locallyDeleteAttachmentFromLocalRequest(file.id));
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
        <div
            className={clsx('project-files-panel md:w-1/3', {
                'has-drive-browser': linkedDriveFolder,
                'modal p-0 sm:p-1': modal,
            })}
        >
            <div className="project-files-panel-content">
                {/* Instructions Section */}
                <div className="project-files-section flex-none md:flex-1 flex flex-column flex-nowrap">
                    <div className="project-files-section-header">
                        <h3 className="project-files-section-title flex flex-nowrap items-center gap-1">
                            {c('collider_2025:Title').t`Instructions`}{' '}
                            <Tooltip title={c('collider_2025:Info').t`Tips on how to write useful instructions`}>
                                <ButtonLike
                                    as={Href}
                                    href={getKnowledgeBaseUrl('/lumo-projects')}
                                    icon
                                    shape="ghost"
                                    size="small"
                                >
                                    <Icon name="info-circle" size={4} />
                                </ButtonLike>
                            </Tooltip>
                        </h3>
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
                    <div className="project-files-section-content flex-auto">
                        {instructions ? (
                            <p className="project-instructions-text h-full">{instructions}</p>
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
                <ProjectKnowledgeSection
                    projectId={projectId}
                    linkedDriveFolder={linkedDriveFolder}
                    files={files}
                    uploadProgress={uploadProgress}
                    breadcrumbs={breadcrumbs}
                    isRootFolder={isRootFolder}
                    driveBrowserRef={driveBrowserRef}
                    onAddFiles={handleAddFiles}
                    onBreadcrumbClick={handleBreadcrumbClick}
                    onDriveFileSelect={handleDriveFileSelect}
                    onBreadcrumbsChange={handleBreadcrumbsChange}
                    onViewFile={handleViewFile}
                    onRemoveFile={handleRemoveFile}
                    onRemoveAllFiles={handleRemoveAllFilesClick}
                    onCreateFolder={() => {
                        setFolderName('');
                        setCreateFolderModalOpen(true);
                    }}
                />

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
                    <ModalTwo onClose={() => setRemoveAllModalOpen(false)} size="small" open={removeAllModal}>
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
