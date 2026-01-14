import React from 'react';

import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Icon, useModalStateObject } from '@proton/components';
import { DRIVE_APP_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import type { Attachment, LinkedDriveFolder } from '../../types';
import type { BreadcrumbItem } from '../components/Files/DriveBrowser/DriveBreadcrumbs';
import type { DriveBrowserHandle } from '../components/Files/DriveBrowser/DriveBrowser';
import { DriveBrowser } from '../components/Files/DriveBrowser/DriveBrowser';
import { type UploadProgress, UploadProgressOverlay } from '../components/Files/DriveBrowser/UploadProgressOverlay';
import { KnowledgeFileItem } from '../components/Files/KnowledgeBase/KnowledgeFileItem';
import { ProjectDriveFolderInfo } from './components/ProjectDriveFolderInfo';
import { LinkDriveFolderModal } from './modals/LinkDriveFolderModal';

interface ProjectKnowledgeSectionProps {
    projectId: string;
    linkedDriveFolder?: LinkedDriveFolder;
    files: Attachment[];
    uploadProgress: UploadProgress | null;
    breadcrumbs: BreadcrumbItem[];
    isRootFolder: boolean;
    driveBrowserRef: React.RefObject<DriveBrowserHandle>;
    onAddFiles: () => void;
    onBreadcrumbClick: (breadcrumb: BreadcrumbItem) => void;
    onDriveFileSelect: (file: any, content: Uint8Array<ArrayBuffer>) => Promise<void>;
    onBreadcrumbsChange: (newBreadcrumbs: BreadcrumbItem[]) => void;
    onViewFile: (attachment: Attachment) => void;
    onRemoveFile: (id: string) => void;
    onRemoveAllFiles: () => void;
    onCreateFolder: () => void;
}

export const ProjectKnowledgeSection: React.FC<ProjectKnowledgeSectionProps> = ({
    projectId,
    linkedDriveFolder,
    files,
    uploadProgress,
    breadcrumbs,
    isRootFolder,
    driveBrowserRef,
    onAddFiles,
    onBreadcrumbClick,
    onDriveFileSelect,
    onBreadcrumbsChange,
    onViewFile,
    onRemoveFile,
    onRemoveAllFiles,
    onCreateFolder,
}) => {
    const linkDriveFolderModal = useModalStateObject();

    return (
        <div className="project-files-section flex flex-column flex-nowrap flex-1">
            <div className="project-files-section-header">
                <h3 className="project-files-section-title flex flex-nowrap items-center gap-1">
                    {c('collider_2025:Title').t`Project knowledge`}
                    <Tooltip title={c('collider_2025:Info').t`Learn more about how project knowledge works`}>
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
                <div className="flex items-center gap-1">
                    {/* Show upload and trash buttons when files exist and no Drive folder */}
                    {!linkedDriveFolder && files.length > 0 && (
                        <>
                            <Button
                                icon
                                shape="ghost"
                                size="small"
                                onClick={onAddFiles}
                                title={c('collider_2025:Action').t`Upload files`}
                            >
                                <Icon name="arrow-up-line" size={4} />
                            </Button>
                            <Button
                                icon
                                shape="ghost"
                                size="small"
                                onClick={onRemoveAllFiles}
                                className="project-files-remove-all-button"
                                title={c('collider_2025:Action').t`Remove all files`}
                            >
                                <Icon name="trash" size={4} />
                            </Button>
                        </>
                    )}
                    {/* Settings button for linked Drive folder */}
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
            {(linkedDriveFolder !== undefined || files.length > 0) && (
                <div className="flex items-center gap-1 text-sm hidden md:flex">
                    <Banner
                        className="mb-1 color-weak border-none"
                        variant="norm-outline"
                        icon={<Icon name="light-lightbulb" size={3.5} />}
                    >
                        {c('collider_2025:Info').t`Type @filename to ask questions about a specific file`}
                    </Banner>
                </div>
            )}
            <div
                className={`project-files-section-content bg-weak files-section flex-1 ${files.length > 0 || linkedDriveFolder ? 'has-files' : ''}`}
            >
                {/* Upload progress overlay */}
                {uploadProgress && (
                    <div className="project-files-progress-overlay">
                        <UploadProgressOverlay uploadProgress={uploadProgress} />
                    </div>
                )}
                {/* eslint-disable no-nested-ternary */}
                {linkedDriveFolder ? (
                    <div className="project-drive-browser">
                        <ProjectDriveFolderInfo
                            breadcrumbs={breadcrumbs}
                            isRootFolder={isRootFolder}
                            onBreadcrumbClick={onBreadcrumbClick}
                            onCreateFolder={onCreateFolder}
                            onUpload={onAddFiles}
                        />
                        <hr className="my-2 border-bottom" />
                        <DriveBrowser
                            key={linkedDriveFolder.folderId}
                            ref={driveBrowserRef}
                            onFileSelect={onDriveFileSelect}
                            onBreadcrumbsChange={onBreadcrumbsChange}
                            initialShowDriveBrowser={true}
                            initialFolderId={linkedDriveFolder.folderId}
                            initialFolderName={linkedDriveFolder.folderName}
                            isLinkedFolder={true}
                            hideHeader={true}
                            showBreadcrumbs={false}
                        />
                    </div>
                ) : files.length === 0 ? (
                    /* Empty state with upload options */
                    <div className="project-files-empty-zone">
                        <h4 className="project-files-empty-title text-xl">
                            {c('collider_2025:Title').t`Nothing here yet`}
                        </h4>
                        <p className="project-files-empty-subtitle color-weak">
                            {c('collider_2025:Info').t`Link files from ${DRIVE_APP_NAME} or upload from your computer.`}
                        </p>
                        <p className="project-files-empty-hint color-weak text-sm">
                            {c('collider_2025:Info')
                                .t`Using ${DRIVE_APP_NAME} lets ${LUMO_SHORT_APP_NAME} work with larger files.`}
                        </p>
                        <div className="project-files-empty-actions">
                            <Button
                                shape="outline"
                                onClick={() => linkDriveFolderModal.openModal(true)}
                                className="project-files-action-button"
                            >
                                {c('collider_2025:Button').t`Link with ${DRIVE_APP_NAME} folder`}
                            </Button>
                            <Button shape="outline" onClick={onAddFiles} className="project-files-action-button">
                                {c('collider_2025:Button').t`Upload from computer`}
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* Files exist - show list only (upload button is in header) */
                    <div className="project-files-list">
                        {files.map((file) => (
                            <KnowledgeFileItem
                                key={file.id}
                                file={file}
                                onView={(_file, fullAttachment) => onViewFile(fullAttachment)}
                                onRemove={onRemoveFile}
                                isActive={true}
                                showToggle={false}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Link Drive Folder Modal */}
            {linkDriveFolderModal.render && (
                <LinkDriveFolderModal key={projectId} {...linkDriveFolderModal.modalProps} projectId={projectId} />
            )}
        </div>
    );
};
