import React from 'react';

import { c } from 'ttag';

import { Icon } from '@proton/components';
import { IcCheckmarkCircle } from '@proton/icons/icons/IcCheckmarkCircle';
import { IcPlusCircle } from '@proton/icons/icons/IcPlusCircle';

import { MAX_FILE_SIZE } from '../../../../constants';
import type { DriveNode } from '../../../../hooks/useDriveSDK';
import { CircularProgress } from './CircularProgress';
import { FileItemCard, type FileItemData } from './FileItemCard';

interface DriveFileListProps {
    children: DriveNode[];
    existingFiles: { filename: string; rawBytes?: number }[];
    downloadingFile: string | null;
    downloadProgress: number | null;
    onFileClick: (file: DriveNode) => void;
    onFolderClick: (folder: DriveNode) => void;
    isLinkedFolder?: boolean;
    folderSelectionMode?: boolean;
}

export const DriveFileList: React.FC<DriveFileListProps> = ({
    children,
    existingFiles,
    downloadingFile,
    downloadProgress,
    onFileClick,
    onFolderClick,
    isLinkedFolder = false,
    folderSelectionMode = false,
}) => {
    if (children.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>{c('collider_2025: Info').t`No supported files in this folder`}</p>
            </div>
        );
    }

    const sortedChildren = children.sort((a, b) => {
        // Sort folders first, then files
        if (a.type === 'folder' && b.type !== 'folder') {
            return -1;
        }
        if (a.type !== 'folder' && b.type === 'folder') {
            return 1;
        }
        // Within the same type, sort alphabetically by name (case-insensitive)
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

    return (
        <>
            {sortedChildren.map((child) => {
                const fileData: FileItemData = {
                    id: child.nodeId,
                    name: child.name,
                    mimeType: child.mimeType,
                    size: child.size,
                    type: child.type,
                    downloadProgress: downloadingFile === child.nodeId ? downloadProgress || undefined : undefined,
                };

                const fileExists = existingFiles.some((existing) => existing.filename === child.name);
                const estimatedTooLargeForPreview = child.size && child.size > 750 * 1024; // 750KB threshold
                const exceedsFileSizeLimit = child.size && child.size > MAX_FILE_SIZE;

                const getActionIcon = () => {
                    if (fileExists) return () => <IcCheckmarkCircle />;
                    if (exceedsFileSizeLimit)
                        return () => <Icon name="exclamation-triangle-filled" className="color-danger" size={4} />;
                    if (estimatedTooLargeForPreview)
                        return () => <Icon name="exclamation-triangle-filled" className="color-warning" size={4} />;
                    if (downloadingFile === child.nodeId)
                        return () => (
                            <CircularProgress
                                progress={fileData.downloadProgress || 0}
                                size={16}
                                className="text-primary"
                            />
                        );
                    return () => <IcPlusCircle />;
                };

                const actions: any[] =
                    child.type === 'file' && !isLinkedFolder && !folderSelectionMode
                        ? [
                              {
                                  icon: getActionIcon(),
                                  label: fileExists
                                      ? c('collider_2025: Action').t`Already in KB`
                                      : exceedsFileSizeLimit
                                        ? c('collider_2025: Info').t`Exceeds 10MB limit`
                                        : estimatedTooLargeForPreview
                                          ? c('collider_2025: Info').t`File too large`
                                          : downloadingFile === child.nodeId
                                            ? c('collider_2025: Info').t`Downloading (${Math.round(fileData.downloadProgress || 0)}%)`
                                            : c('collider_2025: Action').t`Add to active`,
                                  onClick: (e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      if (!fileExists && !exceedsFileSizeLimit && !estimatedTooLargeForPreview) {
                                          onFileClick(child);
                                      }
                                  },
                                  disabled:
                                      downloadingFile === child.nodeId ||
                                      fileExists ||
                                      exceedsFileSizeLimit ||
                                      estimatedTooLargeForPreview,
                                  loading: downloadingFile === child.nodeId,
                                  variant: fileExists
                                      ? 'secondary'
                                      : exceedsFileSizeLimit
                                        ? 'danger'
                                        : estimatedTooLargeForPreview
                                          ? 'secondary'
                                          : 'primary',
                              },
                          ]
                        : [];

                const handleClick = () => {
                    if (child.type === 'folder') {
                        onFolderClick(child);
                        return;
                    }

                    if (
                        child.type === 'file' &&
                        !fileExists &&
                        !exceedsFileSizeLimit &&
                        !estimatedTooLargeForPreview &&
                        !folderSelectionMode
                    ) {
                        onFileClick(child);
                    }
                };

                return (
                    <FileItemCard
                        key={child.nodeId}
                        file={fileData}
                        actions={actions}
                        onClick={handleClick}
                        variant="simple"
                    />
                );
            })}
        </>
    );
};
