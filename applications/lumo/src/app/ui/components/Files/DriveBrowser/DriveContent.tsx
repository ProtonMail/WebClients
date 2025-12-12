import React from 'react';

import { c } from 'ttag';

import Loader from '@proton/components/components/loader/Loader';
import { NodeType } from '@proton/drive';

import type { DriveNode } from '../../../../hooks/useDriveSDK';
import { isFileTypeSupported } from '../../../../util/filetypes';
import { DriveBreadcrumbs, type BreadcrumbItem } from './DriveBreadcrumbs';
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
    isLinkedFolder?: boolean;
    folderSelectionMode?: boolean;
    handleBreadcrumbClick: (breadcrumb: BreadcrumbItem) => void;
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
    isLinkedFolder = false,
    folderSelectionMode = false,
    handleBreadcrumbClick,
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

    if (children.length === 0) {
        return (
            <>
                <DriveBreadcrumbs
                    breadcrumbs={breadcrumbs}
                    currentFolder={currentFolder}
                    onBreadcrumbClick={handleBreadcrumbClick}
                />
                <div className="flex-1 overflow-auto h-full" style={{ minHeight: '40vh' }}>
                    <DriveEmptyState
                        onUpload={onUpload}
                        loading={loading}
                        isRefreshing={isRefreshing}
                        disabled={!currentFolder}
                    />
                </div>
            </>
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

    return (
        <>
            <DriveBreadcrumbs
                breadcrumbs={breadcrumbs}
                currentFolder={currentFolder}
                onBreadcrumbClick={handleBreadcrumbClick}
            />

            <div className="flex-1 overflow-auto h-full" style={{ minHeight: '40vh' }}>
                <DriveHiddenFilesNotice
                    hiddenProtonDocsCount={hiddenProtonDocsCount}
                    hiddenUnsupportedCount={hiddenUnsupportedCount}
                />

                {filteredChildren.length === 0 && (hiddenProtonDocsCount > 0 || hiddenUnsupportedCount > 0) ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>{c('collider_2025: Info').t`No supported files in this folder`}</p>
                    </div>
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
