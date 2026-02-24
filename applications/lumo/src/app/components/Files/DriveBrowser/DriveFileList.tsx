import React from 'react';

import { c } from 'ttag';

import { Icon } from '@proton/components';
import { NodeType } from '@proton/drive';
import { IcCheckmarkCircle } from '@proton/icons/icons/IcCheckmarkCircle';
import { IcPlusCircle } from '@proton/icons/icons/IcPlusCircle';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { MAX_ASSET_SIZE } from '../../../constants';
import type { DriveNode } from '../../../hooks/useDriveSDK';
import { CircularProgress } from './CircularProgress';
import { DriveFileItemCard, type FileItemData } from './DriveFileItemCard';

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
        if (a.type === NodeType.Folder && b.type !== NodeType.Folder) {
            return -1;
        }
        if (a.type !== NodeType.Folder && b.type === NodeType.Folder) {
            return 1;
        }
        // Within the same type, sort alphabetically by name (case-insensitive)
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

    return (
        <>
            {sortedChildren.map((child) => {
                const fileData: FileItemData = {
                    id: child.nodeUid,
                    name: child.name,
                    mediaType: child.mediaType,
                    size: child.size,
                    type: child.type,
                    downloadProgress: downloadingFile === child.nodeUid ? downloadProgress || undefined : undefined,
                };

                const fileExists = existingFiles.some((existing) => existing.filename === child.name);
                const estimatedTooLargeForPreview = child.size && child.size > 750 * 1024; // 750KB threshold
                const exceedsFileSizeLimit = child.size && child.size > MAX_ASSET_SIZE;

                const CheckmarkIcon = () => <IcCheckmarkCircle />;
                const ErrorIcon = () => <Icon name="exclamation-triangle-filled" className="color-danger" size={4} />;
                const WarningIcon = () => (
                    <Icon name="exclamation-triangle-filled" className="color-warning" size={4} />
                );
                const ProgressIcon = () => (
                    <CircularProgress progress={fileData.downloadProgress || 0} size={16} className="text-primary" />
                );
                const AddIcon = () => <IcPlusCircle />;

                const getActionIcon = () => {
                    if (fileExists) {
                        return CheckmarkIcon;
                    }
                    if (exceedsFileSizeLimit) {
                        return ErrorIcon;
                    }
                    if (estimatedTooLargeForPreview) {
                        return WarningIcon;
                    }
                    if (downloadingFile === child.nodeUid) {
                        return ProgressIcon;
                    }
                    return AddIcon;
                };

                const actions: any[] =
                    child.type === NodeType.File && !isLinkedFolder && !folderSelectionMode
                        ? [
                              {
                                  icon: getActionIcon(),
                                  label: (() => {
                                      if (fileExists) return c('collider_2025: Action').t`Already in KB`;
                                      if (exceedsFileSizeLimit) {
                                          const maxSize = humanSize({ bytes: MAX_ASSET_SIZE, unit: 'MB', fraction: 0 });
                                          return c('collider_2025: Info').t`Exceeds ${maxSize} limit`;
                                      }
                                      if (estimatedTooLargeForPreview) {
                                          return c('collider_2025: Info').t`File too large`;
                                      }
                                      if (downloadingFile === child.nodeUid) {
                                          const progressPct = Math.round(fileData.downloadProgress || 0);
                                          return c('collider_2025: Info').t`Downloading (${progressPct}%)`;
                                      }
                                      return c('collider_2025: Action').t`Add to active`;
                                  })(),
                                  onClick: (e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      if (!fileExists && !exceedsFileSizeLimit && !estimatedTooLargeForPreview) {
                                          onFileClick(child);
                                      }
                                  },
                                  disabled:
                                      downloadingFile === child.nodeUid ||
                                      fileExists ||
                                      exceedsFileSizeLimit ||
                                      estimatedTooLargeForPreview,
                                  loading: downloadingFile === child.nodeUid,
                                  // eslint-disable-next-line no-nested-ternary
                                  variant: fileExists
                                      ? 'secondary'
                                      : // eslint-disable-next-line no-nested-ternary
                                        exceedsFileSizeLimit
                                        ? 'danger'
                                        : estimatedTooLargeForPreview
                                          ? 'secondary'
                                          : 'primary',
                              },
                          ]
                        : [];

                const handleClick = () => {
                    if (child.type === NodeType.Folder) {
                        onFolderClick(child);
                        return;
                    }

                    if (
                        child.type === NodeType.File &&
                        !fileExists &&
                        !exceedsFileSizeLimit &&
                        !estimatedTooLargeForPreview &&
                        !folderSelectionMode
                    ) {
                        onFileClick(child);
                    }
                };

                return (
                    <DriveFileItemCard
                        key={child.nodeUid}
                        file={fileData}
                        actions={actions as any}
                        onClick={handleClick}
                        variant="simple"
                    />
                );
            })}
        </>
    );
};
