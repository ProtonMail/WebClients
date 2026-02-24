import React from 'react';

import { c } from 'ttag';

import Loader from '@proton/components/components/loader/Loader';
import { NodeType } from '@proton/drive';

import type { DriveNode } from '../../../hooks/useDriveSDK';
import { isFileTypeSupported } from '../../../util/filetypes';
import type { BreadcrumbItem } from './DriveBreadcrumbs';
import { DriveBreadcrumbs } from './DriveBreadcrumbs';
import { DriveEmptyState } from './DriveEmptyState';
import { DriveFileList } from './DriveFileList';
import { DriveHiddenFilesNotice } from './DriveHiddenFilesNotice';

interface DriveContentProps {
    loading: boolean;
    isRefreshing: boolean;
    children: DriveNode[];
    currentFolder: DriveNode;
    breadcrumbs: BreadcrumbItem[];
    existingFiles: { filename: string; rawBytes?: number }[];
    downloadingFile: string | null;
    downloadProgress: number | null;
    onFileClick: (file: DriveNode) => void;
    onFolderClick: (folder: DriveNode) => void;
    onUpload: () => void;
    onCreateFolder?: () => void;
    isLinkedFolder?: boolean;
    folderSelectionMode?: boolean;
    handleBreadcrumbClick: (breadcrumb: BreadcrumbItem) => void;
    showBreadcrumbs: boolean;
}

export const DriveContent: React.FC<DriveContentProps> = ({
    loading,
    isRefreshing,
    children,
    currentFolder,
    breadcrumbs,
    existingFiles,
    downloadingFile,
    downloadProgress,
    onFileClick,
    onFolderClick,
    onUpload,
    onCreateFolder,
    isLinkedFolder = false,
    folderSelectionMode = false,
    handleBreadcrumbClick,
    showBreadcrumbs,
}) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 h-full">
                <div className="text-center">
                    <Loader size={'medium'} />
                    <p className={'text-center'}>{c('collider_2025: Info').t`Loading`}...</p>
                </div>
            </div>
        );
    }

    const filteredChildren = children.filter((child) => {
        if (child.type === NodeType.Folder) return true;
        if (child.type === NodeType.File && child.mediaType?.startsWith('application/vnd.proton')) return false;
        if (!isFileTypeSupported(child.name, child.mediaType)) return false;
        return true;
    });

    const hiddenProtonDocsCount = children.filter(
        (child) => child.type === NodeType.File && child.mediaType?.startsWith('application/vnd.proton')
    ).length;
    const hiddenUnsupportedCount = children.filter(
        (child) =>
            child.type === NodeType.File &&
            !child.mediaType?.startsWith('application/vnd.proton') &&
            !isFileTypeSupported(child.name, child.mediaType)
    ).length;

    const isEmpty = children.length === 0 || filteredChildren.length === 0;

    return (
        <>
            {showBreadcrumbs && (
                <DriveBreadcrumbs
                    breadcrumbs={breadcrumbs}
                    currentFolder={currentFolder}
                    onBreadcrumbClick={handleBreadcrumbClick}
                />
            )}

            <div className="drive-content-container overflow-auto" style={{ minHeight: '200px' }}>
                <DriveHiddenFilesNotice
                    hiddenProtonDocsCount={hiddenProtonDocsCount}
                    hiddenUnsupportedCount={hiddenUnsupportedCount}
                />

                {isEmpty ? (
                    <DriveEmptyState
                        onUpload={onUpload}
                        onCreateFolder={onCreateFolder}
                        loading={loading}
                        isRefreshing={isRefreshing}
                        disabled={!currentFolder}
                    />
                ) : (
                    <DriveFileList
                        children={filteredChildren}
                        existingFiles={existingFiles}
                        downloadingFile={downloadingFile}
                        downloadProgress={downloadProgress}
                        onFileClick={onFileClick}
                        onFolderClick={onFolderClick}
                        isLinkedFolder={isLinkedFolder}
                        folderSelectionMode={folderSelectionMode}
                    />
                )}
            </div>
        </>
    );
};
