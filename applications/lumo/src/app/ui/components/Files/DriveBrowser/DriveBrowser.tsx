import React, { useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import Loader from '@proton/components/components/loader/Loader';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcArrowUpLine, IcCheckmarkCircle, IcPlusCircle } from '@proton/icons';
import { BRAND_NAME } from '@proton/shared/lib/constants';
// Import extracted components
import lumoDrive from '@proton/styles/assets/img/lumo/lumo-drive.svg';

import type { DriveNode } from '../../../../hooks/useDriveSDK';
import { useDriveSDK } from '../../../../hooks/useDriveSDK';
import { getAcceptAttributeString, isFileTypeSupported } from '../../../../util/filetypes';
import { CircularProgress } from './CircularProgress';
import { type BreadcrumbItem, DriveBreadcrumbs } from './DriveBreadcrumbs';
import { DriveBrowserHeader } from './DriveBrowserHeader';
import { DriveErrorState } from './DriveErrorState';
import { FileItemCard, type FileItemData } from './FileItemCard';
import { type UploadProgress, UploadProgressOverlay } from './UploadProgressOverlay';

interface DriveBrowserProps {
    onFileSelect: (file: DriveNode, content: Uint8Array) => void;
    onError?: (error: Error) => void;
    onClose?: () => void; // Close the entire panel
    onBack?: () => void; // Go back to FilesPanel
    isModal?: boolean;
    initialShowDriveBrowser?: boolean;
    autoRefreshInterval?: number; // Auto-refresh interval in milliseconds (0 = disabled)
    existingFiles?: { filename: string; rawBytes?: number }[]; // Files already in knowledge base
}

export const DriveBrowser: React.FC<DriveBrowserProps> = ({
    onFileSelect,
    onError,
    onClose,
    onBack,
    isModal = false,
    initialShowDriveBrowser = true,
    existingFiles = [],
}) => {
    const { isInitialized, error, getRootFolder, browseFolderChildren, downloadFile, uploadFile } = useDriveSDK();
    const { createNotification } = useNotifications();
    const [currentFolder, setCurrentFolder] = useState<DriveNode | null>(null);
    const [children, setChildren] = useState<DriveNode[]>([]);

    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
    const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const initializedRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (error) {
            initializedRef.current = false;
            setLocalError(null);
        }
    }, [error]);

    const handleRefresh = useCallback(async () => {
        if (!currentFolder) {
            return;
        }

        try {
            setIsRefreshing(true);

            // Add a small delay to allow any pending operations to complete
            await new Promise((resolve) => setTimeout(resolve, 100));

            const folderChildren = await browseFolderChildren(currentFolder.nodeId, true);
            setChildren(folderChildren);
        } catch (error) {
            console.error('Failed to refresh folder:', error);
            onError?.(error instanceof Error ? error : new Error('Failed to refresh folder'));
        } finally {
            setIsRefreshing(false);
        }
    }, [browseFolderChildren, currentFolder, onError]);

    // Refresh when window regains focus (user comes back to the tab)
    useEffect(() => {
        const handleFocus = () => {
            if (currentFolder && !loading && !isRefreshing) {
                handleRefresh();
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [currentFolder, loading, isRefreshing, handleRefresh]);

    // Initialize with root folder
    const initializeRoot = useCallback(async () => {
        try {
            setLoading(true);
            setLocalError(null); // Clear any previous local errors
            initializedRef.current = true;
            const rootFolder = await getRootFolder();
            setCurrentFolder(rootFolder);
            setBreadcrumbs([{ node: rootFolder, index: 0 }]);

            const rootChildren = await browseFolderChildren(rootFolder.nodeId);
            setChildren(rootChildren);
        } catch (err) {
            console.error('Failed to initialize Drive browser:', err);
            initializedRef.current = false; // Reset on error so we can try again

            // Check if this is the Drive not initialized error
            if (err instanceof Error && err.message === 'DRIVE_NOT_INITIALIZED') {
                console.log('Setting localError to DRIVE_NOT_INITIALIZED');
                setLocalError('DRIVE_NOT_INITIALIZED');
            } else {
                console.log(
                    'Setting localError to:',
                    err instanceof Error ? err.message : 'Failed to initialize Drive browser'
                );
                setLocalError(err instanceof Error ? err.message : 'Failed to initialize Drive browser');
            }

            onError?.(err instanceof Error ? err : new Error('Failed to initialize Drive browser'));
        } finally {
            setLoading(false);
        }
    }, [getRootFolder, browseFolderChildren, onError]);

    useEffect(() => {
        if (!isInitialized || error || initializedRef.current) {
            return;
        }

        void initializeRoot();
    }, [isInitialized, error, initializeRoot]);

    const handleFolderClick = useCallback(
        async (folder: DriveNode) => {
            if (folder.type !== 'folder') {
                return;
            }

            try {
                setLoading(true);
                const folderChildren = await browseFolderChildren(folder.nodeId);
                setChildren(folderChildren);
                setCurrentFolder(folder);

                // Add to breadcrumbs
                const newBreadcrumb: BreadcrumbItem = {
                    node: folder,
                    index: breadcrumbs.length,
                };
                setBreadcrumbs([...breadcrumbs, newBreadcrumb]);
            } catch (error) {
                console.error('Failed to browse folder:', error);
                onError?.(error instanceof Error ? error : new Error('Failed to browse folder'));
            } finally {
                setLoading(false);
            }
        },
        [browseFolderChildren, breadcrumbs, onError]
    );

    const handleFileClick = useCallback(
        async (file: DriveNode) => {
            if (file.type !== 'file') {
                return;
            }

            try {
                setDownloadingFile(file.nodeId);
                setDownloadProgress(0);

                const data = await downloadFile(file.nodeId, (progress) => {
                    setDownloadProgress(progress);
                });

                onFileSelect(file, new Uint8Array(data));
            } catch (error) {
                console.error('Failed to download file:', error);
                onError?.(error instanceof Error ? error : new Error('Failed to download file'));
            } finally {
                setDownloadingFile(null);
                setDownloadProgress(null);
            }
        },
        [downloadFile, onFileSelect, onError]
    );

    const handleBreadcrumbClick = useCallback(
        async (breadcrumb: BreadcrumbItem) => {
            if (breadcrumb.node.nodeId === currentFolder?.nodeId) {
                return;
            }

            try {
                setLoading(true);
                const folderChildren = await browseFolderChildren(breadcrumb.node.nodeId);
                setChildren(folderChildren);
                setCurrentFolder(breadcrumb.node);

                // Update breadcrumbs to remove items after the clicked one
                setBreadcrumbs(breadcrumbs.slice(0, breadcrumb.index + 1));
            } catch (error) {
                console.error('Failed to navigate to folder:', error);
                onError?.(error instanceof Error ? error : new Error('Failed to navigate to folder'));
            } finally {
                setLoading(false);
            }
        },
        [browseFolderChildren, breadcrumbs, currentFolder, onError]
    );

    // Upload functionality
    const handleFileUpload = useCallback(
        async (files: FileList) => {
            if (!currentFolder) {
                return;
            }

            const fileArray = Array.from(files);

            for (const file of fileArray) {
                try {
                    setUploadProgress({ fileName: file.name, progress: 0 });

                    // Upload the file to Drive
                    const nodeUid = await uploadFile(currentFolder.nodeId, file, (progress) => {
                        setUploadProgress({ fileName: file.name, progress });
                    });

                    console.log(`Successfully uploaded ${file.name}`);

                    // Automatically download and process the uploaded file for knowledge base
                    try {
                        console.log(`Auto-processing uploaded file: ${file.name}`);

                        // Update progress to show processing state
                        setUploadProgress({ fileName: file.name, progress: 100, isProcessing: true });

                        // Create a DriveNode object for the uploaded file
                        const uploadedFileNode: DriveNode = {
                            nodeId: nodeUid,
                            name: file.name,
                            type: 'file',
                            size: file.size,
                            mimeType: file.type,
                            modifiedTime: Date.now(),
                            // Add other properties as needed
                        };

                        // Read the file content directly from the uploaded file
                        const fileContent = new Uint8Array(await file.arrayBuffer());

                        // Process the file through the same pipeline as manual selection
                        onFileSelect(uploadedFileNode, fileContent);

                        // Show success notification
                        createNotification({
                            text: c('collider_2025: Success').t`File uploaded and added to knowledge base`,
                            type: 'success',
                        });

                        console.log(`Auto-processed uploaded file: ${file.name}`);
                    } catch (processingError) {
                        console.error(`Failed to auto-process uploaded file ${file.name}:`, processingError);
                        // Show error notification for processing failure
                        createNotification({
                            text: c('collider_2025: Error').t`File uploaded but failed to add to knowledge base`,
                            type: 'error',
                        });
                    }
                } catch (error) {
                    console.error(`Failed to upload ${file.name}:`, error);
                    onError?.(error instanceof Error ? error : new Error(`Failed to upload ${file.name}`));
                }
            }

            setUploadProgress(null);

            // Refresh the folder contents to show the new files
            try {
                await handleRefresh();
            } catch (error) {
                console.error('Failed to refresh after upload:', error);
            }
        },
        [currentFolder, uploadFile, onError, handleRefresh, onFileSelect, createNotification]
    );

    const handleFileInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                handleFileUpload(files);
            }
            // Reset the input value so the same file can be selected again
            if (e.target) {
                e.target.value = '';
            }
        },
        [handleFileUpload]
    );

    const handleUploadButtonClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    // Check for errors from both SDK and local initialization
    let displayError = error || localError;
    console.log('DriveBrowser render - SDK error:', error, 'localError:', localError, 'displayError:', displayError);

    return (
        <div className={'flex flex-column flex-nowrap h-full relative' + (isModal ? '' : ' p-4')}>
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
                accept={getAcceptAttributeString()}
            />

            <DriveBrowserHeader
                onBack={onBack}
                onClose={onClose}
                onRefresh={handleRefresh}
                onUpload={handleUploadButtonClick}
                initialShowDriveBrowser={initialShowDriveBrowser}
                displayError={!!displayError}
                loading={loading}
                isRefreshing={isRefreshing}
                hasCurrentFolder={!!currentFolder}
            />

            {displayError && (
                <DriveErrorState
                    onRetry={() => {
                        initializedRef.current = false;
                        void initializeRoot();
                    }}
                    loading={loading}
                />
            )}

            {/* Upload progress overlay */}
            {uploadProgress && <UploadProgressOverlay uploadProgress={uploadProgress} />}

            {(!isInitialized || !currentFolder) && !displayError && (
                <div className="flex items-center justify-center p-8 h-full">
                    <div className="text-center">
                        <Loader size={'medium'} />
                        <p>Initializing Drive...</p>
                    </div>
                </div>
            )}

            {isInitialized && currentFolder && !uploadProgress && (
                <>
                    <DriveBreadcrumbs
                        breadcrumbs={breadcrumbs}
                        currentFolder={currentFolder}
                        onBreadcrumbClick={handleBreadcrumbClick}
                    />

                    <div className="flex-1 overflow-auto h-full" style={{ minHeight: '40vh' }}>
                        {loading ? (
                            <div className="flex-1 items-center justify-center h-full">
                                <Loader size={'medium'} />
                                <p className={'text-center'}>{c('collider_2025: Info').t`Loading`}...</p>
                            </div>
                        ) : children.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <img
                                    className="w-custom h-custom mx-auto mt-6 mb-6"
                                    src={lumoDrive}
                                    alt="Lumo + Proton Drive"
                                    style={{ '--w-custom': '11.5rem' }}
                                />
                                <p>{c('collider_2025: Info').t`This folder is empty`}</p>

                                <Button
                                    onClick={handleUploadButtonClick}
                                    size="medium"
                                    color="norm"
                                    disabled={loading || isRefreshing || !currentFolder}
                                    title={c('collider_2025: Action').t`Upload file and add to knowledge base`}
                                >
                                    <IcArrowUpLine /> {c('collider_2025: Action').t`Upload a file`}
                                </Button>
                            </div>
                        ) : (
                            <>
                                {(() => {
                                    const filteredChildren = children.filter((child) => {
                                        if (child.type === 'folder') {
                                            return true;
                                        }

                                        // Filter out all Proton files (docs, sheets, etc.) as they can't be processed yet
                                        if (
                                            child.type === 'file' &&
                                            child.mediaType?.startsWith('application/vnd.proton')
                                        ) {
                                            return false;
                                        }

                                        // Filter out unsupported file types using centralized function
                                        if (!isFileTypeSupported(child.name, child.mimeType)) {
                                            return false;
                                        }

                                        return true;
                                    });

                                    const hiddenProtonDocsCount = children.filter(
                                        (child) =>
                                            child.type === 'file' &&
                                            child.mediaType?.startsWith('application/vnd.proton')
                                    ).length;

                                    const hiddenUnsupportedCount = children.filter(
                                        (child) =>
                                            child.type === 'file' &&
                                            !child.mediaType?.startsWith('application/vnd.proton') &&
                                            !isFileTypeSupported(child.name, child.mimeType)
                                    ).length;

                                    return (
                                        <>
                                            {(hiddenProtonDocsCount > 0 || hiddenUnsupportedCount > 0) && (
                                                <div className="mb-3 p-3 bg-weak rounded border border-weak">
                                                    <div className="flex items-center gap-2 text-sm color-weak">
                                                        <Icon name="info-circle" size={4} />
                                                        <div className="flex flex-col">
                                                            {hiddenProtonDocsCount > 0 && (
                                                                <span>
                                                                    {hiddenProtonDocsCount}{' '}
                                                                    {hiddenProtonDocsCount > 1
                                                                        ? c('collider_2025: Info')
                                                                              .t` ${BRAND_NAME} files are hidden (not supported yet)`
                                                                        : c('collider_2025: Info')
                                                                              .t` ${BRAND_NAME} file is hidden (not supported yet)`}
                                                                </span>
                                                            )}
                                                            {hiddenUnsupportedCount > 0 && (
                                                                <span>
                                                                    {hiddenUnsupportedCount}{' '}
                                                                    {hiddenUnsupportedCount > 1
                                                                        ? c('collider_2025: Info')
                                                                              .t` files are hidden (unsupported file types)`
                                                                        : c('collider_2025: Info')
                                                                              .t` file is hidden (unsupported file type)`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {filteredChildren.length === 0 &&
                                            (hiddenProtonDocsCount > 0 || hiddenUnsupportedCount > 0) ? (
                                                <div className="text-center py-8 text-gray-500">
                                                    <p>No supported files in this folder</p>
                                                </div>
                                            ) : (
                                                filteredChildren
                                                    .sort((a, b) => {
                                                        // Sort folders first, then files
                                                        if (a.type === 'folder' && b.type !== 'folder') {
                                                            return -1;
                                                        }
                                                        if (a.type !== 'folder' && b.type === 'folder') {
                                                            return 1;
                                                        }
                                                        // Within the same type, sort alphabetically by name (case-insensitive)
                                                        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
                                                    })
                                                    .map((child) => {
                                                        const fileData: FileItemData = {
                                                            id: child.nodeId,
                                                            name: child.name,
                                                            mimeType: child.mimeType,
                                                            size: child.size,
                                                            type: child.type,
                                                            downloadProgress:
                                                                downloadingFile === child.nodeId
                                                                    ? downloadProgress || undefined
                                                                    : undefined,
                                                        };

                                                        // Check if file already exists in knowledge base
                                                        const fileExists = existingFiles.some(
                                                            (existing) => existing.filename === child.name
                                                        );

                                                        // Estimate if file is too large for preview (roughly 150k tokens ≈ 600-750KB)
                                                        const estimatedTooLargeForPreview =
                                                            child.size && child.size > 750 * 1024; // 750KB threshold

                                                        const getActionIcon = () => {
                                                            if (fileExists) {
                                                                return () => <IcCheckmarkCircle />;
                                                            }
                                                            if (estimatedTooLargeForPreview) {
                                                                return () => (
                                                                    <Icon
                                                                        name="exclamation-triangle-filled"
                                                                        className="color-warning"
                                                                        size={4}
                                                                    />
                                                                );
                                                            }
                                                            if (downloadingFile === child.nodeId) {
                                                                return () => (
                                                                    <CircularProgress
                                                                        progress={fileData.downloadProgress || 0}
                                                                        size={16}
                                                                        className="text-primary"
                                                                    />
                                                                );
                                                            }
                                                            return () => <IcPlusCircle />;
                                                        };

                                                        const actions: any[] =
                                                            child.type === 'file'
                                                                ? [
                                                                      {
                                                                          icon: getActionIcon(),
                                                                          label: fileExists
                                                                              ? 'Already in KB'
                                                                              : estimatedTooLargeForPreview
                                                                                ? 'File too large'
                                                                                : downloadingFile === child.nodeId
                                                                                  ? `Downloading (${Math.round(fileData.downloadProgress || 0)}%)`
                                                                                  : 'Add to active',
                                                                          onClick: (e: React.MouseEvent) => {
                                                                              e.stopPropagation();
                                                                              if (
                                                                                  !fileExists &&
                                                                                  !estimatedTooLargeForPreview
                                                                              ) {
                                                                                  void handleFileClick(child);
                                                                              }
                                                                          },
                                                                          disabled:
                                                                              downloadingFile === child.nodeId ||
                                                                              fileExists ||
                                                                              estimatedTooLargeForPreview,
                                                                          loading: downloadingFile === child.nodeId,
                                                                          variant: fileExists
                                                                              ? 'secondary'
                                                                              : estimatedTooLargeForPreview
                                                                                ? 'secondary'
                                                                                : 'primary',
                                                                      },
                                                                  ]
                                                                : [];
                                                        return (
                                                            <FileItemCard
                                                                key={child.nodeId}
                                                                file={fileData}
                                                                actions={actions}
                                                                onClick={
                                                                    child.type === 'folder'
                                                                        ? () => handleFolderClick(child)
                                                                        : child.type === 'file' &&
                                                                            !fileExists &&
                                                                            !estimatedTooLargeForPreview
                                                                          ? () => handleFileClick(child)
                                                                          : undefined
                                                                }
                                                                variant="simple"
                                                            />
                                                        );
                                                    })
                                            )}
                                        </>
                                    );
                                })()}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
