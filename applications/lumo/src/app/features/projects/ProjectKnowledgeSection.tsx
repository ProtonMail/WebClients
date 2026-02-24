import React from 'react';

import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Icon } from '@proton/components';
import { DRIVE_APP_NAME, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { DriveBrowser } from '../../components/Files';
import type { BreadcrumbItem } from '../../components/Files/DriveBrowser/DriveBreadcrumbs';
import type { DriveBrowserHandle } from '../../components/Files/DriveBrowser/DriveBrowser';
import { type UploadProgress, UploadProgressOverlay } from '../../components/Files/DriveBrowser/UploadProgressOverlay';
import { KnowledgeBaseFileItem } from '../../components/Files/KnowledgeBase/KnowledgeBaseFileItem';
import type { Attachment, LinkedDriveFolder } from '../../types';
import { ProjectDriveFolderInfo } from './components/ProjectDriveFolderInfo';

// ---------------------------------------------------------------------------
// Drive-specific props — only present when a Drive folder is linked
// ---------------------------------------------------------------------------

export interface DriveKnowledgeProps {
    linkedDriveFolder: LinkedDriveFolder;
    breadcrumbs: BreadcrumbItem[];
    isRootFolder: boolean;
    driveBrowserRef: React.RefObject<DriveBrowserHandle>;
    onBreadcrumbClick: (breadcrumb: BreadcrumbItem) => void;
    onBreadcrumbsChange: (newBreadcrumbs: BreadcrumbItem[]) => void;
    onCreateFolder: () => void;
}

// ---------------------------------------------------------------------------
// Section props
// ---------------------------------------------------------------------------

export interface ProjectKnowledgeSectionProps {
    files: Attachment[];
    uploadProgress: UploadProgress | null;
    onAddFiles: () => void;
    onViewFile: (attachment: Attachment) => void;
    onRemoveFile: (id: string) => void;
    onRemoveAllFiles: () => void;
    onLinkDriveFolder: () => void;
    driveProps?: DriveKnowledgeProps;
}

// ---------------------------------------------------------------------------
// Content sub-components
// ---------------------------------------------------------------------------

interface DriveFolderContentProps {
    driveProps: DriveKnowledgeProps;
    onUpload: () => void;
}

const DriveFolderContent = ({ driveProps, onUpload }: DriveFolderContentProps) => (
    <div className="project-drive-browser">
        <ProjectDriveFolderInfo
            breadcrumbs={driveProps.breadcrumbs}
            isRootFolder={driveProps.isRootFolder}
            onBreadcrumbClick={driveProps.onBreadcrumbClick}
            onCreateFolder={driveProps.onCreateFolder}
            onUpload={onUpload}
        />
        <hr className="my-2 border-bottom" />
        <DriveBrowser
            key={driveProps.linkedDriveFolder.folderId}
            ref={driveProps.driveBrowserRef}
            onFileSelect={() => {
                // File selection is a no-op in linked-folder mode — files are managed
                // directly in Drive and indexed for RAG; they are not imported into Redux.
            }}
            onBreadcrumbsChange={driveProps.onBreadcrumbsChange}
            initialShowDriveBrowser={true}
            initialFolderId={driveProps.linkedDriveFolder.folderId}
            initialFolderName={driveProps.linkedDriveFolder.folderName}
            isLinkedFolder={true}
            hideHeader={true}
            showBreadcrumbs={false}
        />
    </div>
);

interface EmptyKnowledgeStateProps {
    onAddFiles: () => void;
    onLinkDriveFolder: () => void;
}

const EmptyKnowledgeState = ({ onAddFiles, onLinkDriveFolder }: EmptyKnowledgeStateProps) => (
    <div className="project-files-empty-zone">
        <h4 className="project-files-empty-title text-xl">{c('collider_2025:Title').t`Nothing here yet`}</h4>
        <p className="project-files-empty-subtitle color-weak">
            {c('collider_2025:Info').t`Link files from ${DRIVE_APP_NAME} or upload from your computer.`}
        </p>
        <p className="project-files-empty-hint color-weak text-sm">
            {c('collider_2025:Info').t`Using ${DRIVE_APP_NAME} lets ${LUMO_SHORT_APP_NAME} work with larger files.`}
        </p>
        <div className="project-files-empty-actions">
            <Button shape="outline" onClick={onLinkDriveFolder} className="project-files-action-button">
                {c('collider_2025:Button').t`Link with ${DRIVE_APP_NAME} folder`}
            </Button>
            <Button shape="outline" onClick={onAddFiles} className="project-files-action-button">
                {c('collider_2025:Button').t`Upload from computer`}
            </Button>
        </div>
    </div>
);

interface LocalFileListProps {
    files: Attachment[];
    onViewFile: (attachment: Attachment) => void;
    onRemoveFile: (id: string) => void;
}

const LocalFileList = ({ files, onViewFile, onRemoveFile }: LocalFileListProps) => (
    <div className="project-files-list">
        {files.map((file) => (
            <KnowledgeBaseFileItem
                key={file.id}
                file={file}
                onView={(_file, fullAttachment) => onViewFile(fullAttachment)}
                onRemove={onRemoveFile}
                isActive={true}
                showToggle={false}
            />
        ))}
    </div>
);

// ---------------------------------------------------------------------------
// ProjectKnowledgeSection
// ---------------------------------------------------------------------------

export const ProjectKnowledgeSection: React.FC<ProjectKnowledgeSectionProps> = ({
    files,
    uploadProgress,
    onAddFiles,
    onViewFile,
    onRemoveFile,
    onRemoveAllFiles,
    onLinkDriveFolder,
    driveProps,
}) => {
    const isDriveMode = driveProps !== undefined;

    return (
        <div className="project-files-section flex flex-column flex-nowrap flex-1">
            {/* Header */}
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
                    {/* Local mode: upload and remove-all buttons */}
                    {!isDriveMode && files.length > 0 && (
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
                    {/* Drive mode: manage linked folder button */}
                    {isDriveMode && (
                        <Button
                            icon
                            shape="ghost"
                            size="small"
                            onClick={onLinkDriveFolder}
                            title={c('collider_2025:Action').t`Manage Drive folder link`}
                        >
                            <Icon name="meet-settings" size={4} />
                        </Button>
                    )}
                </div>
            </div>

            {/* @filename tip — shown whenever there are files to reference */}
            {(isDriveMode || files.length > 0) && (
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

            {/* Content area */}
            <div
                className={`project-files-section-content bg-weak files-section flex-1 ${isDriveMode || files.length > 0 ? 'has-files' : ''}`}
            >
                {uploadProgress && (
                    <div className="project-files-progress-overlay">
                        <UploadProgressOverlay uploadProgress={uploadProgress} />
                    </div>
                )}
                {/* eslint-disable-next-line no-nested-ternary */}
                {isDriveMode ? (
                    <DriveFolderContent driveProps={driveProps} onUpload={onAddFiles} />
                ) : files.length === 0 ? (
                    <EmptyKnowledgeState onAddFiles={onAddFiles} onLinkDriveFolder={onLinkDriveFolder} />
                ) : (
                    <LocalFileList files={files} onViewFile={onViewFile} onRemoveFile={onRemoveFile} />
                )}
            </div>
        </div>
    );
};
