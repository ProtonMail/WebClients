import React, { useCallback, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Icon, useModalStateObject, useNotifications } from '@proton/components';
import { DRIVE_APP_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { FileContentModal } from '../../components/Files';
import type { BreadcrumbItem } from '../../components/Files/DriveBrowser/DriveBreadcrumbs';
import type { DriveBrowserHandle } from '../../components/Files/DriveBrowser/DriveBrowser';
import type { UploadProgress } from '../../components/Files/DriveBrowser/UploadProgressOverlay';
import { MAX_ASSET_SIZE } from '../../constants';
import { useFileProcessing } from '../../hooks';
import { useSearchService } from '../../hooks/useSearchService';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import { selectAttachmentsBySpaceId, selectSpaceById } from '../../redux/selectors';
import { locallyDeleteAttachmentFromLocalRequest } from '../../redux/slices/core/attachments';
import { handleSpaceAttachmentFileAsync } from '../../services/files';
import type { Attachment, ProjectSpace } from '../../types';
import { ProjectKnowledgeSection } from './ProjectKnowledgeSection';
import { ConfirmRemoveAllFilesModal } from './modals/ConfirmRemoveAllFilesModal';
import { CreateFolderModal } from './modals/CreateFolderModal';
import { LinkDriveFolderModal } from './modals/LinkDriveFolderModal';

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
    const linkDriveFolderModal = useModalStateObject();
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

    // ---------------------------------------------------------------------------
    // Upload handlers — Drive and local paths are kept explicit and separate
    // ---------------------------------------------------------------------------

    const handleDriveUpload = () => {
        driveBrowserRef.current?.triggerUpload();
    };

    const handleLocalUpload = () => {
        fileInputRef.current?.click();
    };

    const handleAddFiles = () => (linkedDriveFolder ? handleDriveUpload() : handleLocalUpload());

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        if (selectedFiles.length === 0) return;

        for (const file of selectedFiles) {
            try {
                if (file.size > MAX_ASSET_SIZE) {
                    const maxSizeFormatted = humanSize({ bytes: MAX_ASSET_SIZE, unit: 'MB', fraction: 0 });
                    const fileSizeFormatted = humanSize({ bytes: file.size, unit: 'MB', fraction: 1 });
                    createNotification({
                        text: c('collider_2025:Error')
                            .t`File "${file.name}" (${fileSizeFormatted}) exceeds the ${maxSizeFormatted} limit. Link a ${DRIVE_APP_NAME} folder to upload larger files.`,
                        type: 'error',
                        expiration: 8000,
                    });
                    continue;
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

    // ---------------------------------------------------------------------------
    // Drive navigation
    // ---------------------------------------------------------------------------

    const handleBreadcrumbsChange = useCallback((newBreadcrumbs: BreadcrumbItem[]) => {
        setBreadcrumbs(newBreadcrumbs);
    }, []);

    const handleBreadcrumbClick = useCallback((breadcrumb: BreadcrumbItem) => {
        driveBrowserRef.current?.navigateToBreadcrumb(breadcrumb);
    }, []);

    // ---------------------------------------------------------------------------
    // File management
    // ---------------------------------------------------------------------------

    const handleRemoveFile = (id: string) => {
        dispatch(locallyDeleteAttachmentFromLocalRequest(id));
        if (searchService) {
            searchService.removeDocument(id);
        }
        createNotification({
            text: c('collider_2025:Success').t`File removed from project`,
            type: 'success',
        });
    };

    const handleConfirmRemoveAllFiles = () => {
        for (const file of files) {
            dispatch(locallyDeleteAttachmentFromLocalRequest(file.id));
        }
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

                {/* Knowledge Section */}
                <ProjectKnowledgeSection
                    files={files}
                    uploadProgress={uploadProgress}
                    onAddFiles={handleAddFiles}
                    onViewFile={(attachment) => setFileToView(attachment)}
                    onRemoveFile={handleRemoveFile}
                    onRemoveAllFiles={() => setRemoveAllModalOpen(true)}
                    onLinkDriveFolder={() => linkDriveFolderModal.openModal(true)}
                    driveProps={
                        linkedDriveFolder
                            ? {
                                  linkedDriveFolder,
                                  breadcrumbs,
                                  isRootFolder,
                                  driveBrowserRef,
                                  onBreadcrumbClick: handleBreadcrumbClick,
                                  onBreadcrumbsChange: handleBreadcrumbsChange,
                                  onCreateFolder: () => setCreateFolderModalOpen(true),
                              }
                            : undefined
                    }
                />

                {/* Hidden file input for local uploads */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept="*/*"
                />

                {/* Modals */}
                {fileToView && (
                    <FileContentModal attachment={fileToView} onClose={() => setFileToView(null)} open={!!fileToView} />
                )}

                {linkDriveFolderModal.render && (
                    <LinkDriveFolderModal key={projectId} {...linkDriveFolderModal.modalProps} projectId={projectId} />
                )}

                {linkedDriveFolder && (
                    <CreateFolderModal
                        open={createFolderModal}
                        folderId={linkedDriveFolder.folderId}
                        driveBrowserRef={driveBrowserRef}
                        onClose={() => setCreateFolderModalOpen(false)}
                    />
                )}

                <ConfirmRemoveAllFilesModal
                    open={removeAllModal}
                    fileCount={files.length}
                    onClose={() => setRemoveAllModalOpen(false)}
                    onConfirm={handleConfirmRemoveAllFiles}
                />
            </div>
        </div>
    );
};
