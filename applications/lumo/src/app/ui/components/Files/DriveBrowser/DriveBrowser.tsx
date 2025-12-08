import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { c } from 'ttag';

import Loader from '@proton/components/components/loader/Loader';
import useNotifications from '@proton/components/hooks/useNotifications';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { MAX_FILE_SIZE } from '../../../../constants';
import type { DriveNode } from '../../../../hooks/useDriveSDK';
import { useDriveSDK } from '../../../../hooks/useDriveSDK';
import { getAcceptAttributeString } from '../../../../util/filetypes';
import { type BreadcrumbItem } from './DriveBreadcrumbs';
import { DriveBrowserHeader } from './DriveBrowserHeader';
import { DriveContent } from './DriveContent';
import { DriveErrorState } from './DriveErrorState';
import { type UploadProgress, UploadProgressOverlay } from './UploadProgressOverlay';

export interface DriveBrowserHandle {
    triggerUpload: () => void;
    triggerRefresh: () => void;
}

interface DriveBrowserProps {
    onFileSelect: (file: DriveNode, content: Uint8Array<ArrayBuffer>) => void;
    onError?: (error: Error) => void;
    onClose?: () => void; // Close the entire panel
    onBack?: () => void; // Go back to FilesPanel
    isModal?: boolean;
    initialShowDriveBrowser?: boolean;
    autoRefreshInterval?: number; // Auto-refresh interval in milliseconds (0 = disabled)
    existingFiles?: { filename: string; rawBytes?: number }[]; // Files already in knowledge base
    // Folder selection mode - when provided, clicking folders calls this instead of navigating
    onFolderSelect?: (folder: DriveNode) => void;
    folderSelectionMode?: boolean; // When true, shows "Select this folder" button in header
    initialFolderId?: string; // Optional folder ID to navigate to on initialization
    initialFolderName?: string; // Optional folder name for initialFolderId
    isLinkedFolder?: boolean; // When true, folder is linked to project - files are automatically active
    hideHeader?: boolean; // When true, hides the header (for project view)
}

export const DriveBrowser = forwardRef<DriveBrowserHandle, DriveBrowserProps>(({
    onFileSelect,
    onError,
    onClose,
    onBack,
    isModal = false,
    initialShowDriveBrowser = true,
    existingFiles = [],
    onFolderSelect,
    folderSelectionMode = false,
    initialFolderId,
    initialFolderName,
    isLinkedFolder = false,
    hideHeader = false,
}, ref) => {
    const { isInitialized, error, getRootFolder, browseFolderChildren, downloadFile, uploadFile } = useDriveSDK();
    const { createNotification } = useNotifications();
    const [currentFolder, setCurrentFolder] = useState<DriveNode | null>(null);
    const [children, setChildren] = useState<DriveNode[]>([]);
    const [rootFolderId, setRootFolderId] = useState<string | null>(null);

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

    // Initialize with root folder or specific folder
    const initializeRoot = useCallback(async () => {
        try {
            setLoading(true);
            setLocalError(null); // Clear any previous local errors
            initializedRef.current = true;

            const rootFolder = await getRootFolder();
            setRootFolderId(rootFolder.nodeId);

            if (initialFolderId && initialFolderId !== rootFolder.nodeId) {
                // Navigate to specific folder - this is the base/root for this browser
                // Browse the folder to get its children
                const folderChildren = await browseFolderChildren(initialFolderId);
                setChildren(folderChildren);

                // Create a DriveNode for the target folder
                // Use the provided name if available, otherwise use a default
                const targetFolder: DriveNode = {
                    nodeId: initialFolderId,
                    name: initialFolderName || 'Folder',
                    type: 'folder',
                    parentNodeId: rootFolder.nodeId, // Store parent for reference, but don't show in breadcrumbs
                };
                setCurrentFolder(targetFolder);

                // Set breadcrumbs starting from the linked folder (not root)
                // This prevents users from navigating back to root
                setBreadcrumbs([
                    { node: targetFolder, index: 0 },
                ]);
            } else {
                // Start at root folder
                setCurrentFolder(rootFolder);
                setBreadcrumbs([{ node: rootFolder, index: 0 }]);
                const rootChildren = await browseFolderChildren(rootFolder.nodeId);
                setChildren(rootChildren);
            }
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
    }, [getRootFolder, browseFolderChildren, onError, initialFolderId]);

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

            // Always navigate into folders (even in folder selection mode)
            try {
                setLoading(true);
                const folderChildren = await browseFolderChildren(folder.nodeId);
                setChildren(folderChildren);
                setCurrentFolder(folder);

                // Add to breadcrumbs
                // If we have an initialFolderId, start breadcrumbs from that folder (not root)
                const newBreadcrumb: BreadcrumbItem = {
                    node: folder,
                    index: breadcrumbs.length,
                };

                // If this is the first navigation and we have initialFolderId, replace root with initial folder
                if (initialFolderId && breadcrumbs.length === 0 && folder.nodeId === initialFolderId) {
                    setBreadcrumbs([newBreadcrumb]);
                } else {
                    setBreadcrumbs([...breadcrumbs, newBreadcrumb]);
                }

                // In folder selection mode, notify parent of current folder for potential linking
                if (folderSelectionMode && onFolderSelect) {
                    onFolderSelect(folder);
                }
            } catch (error) {
                console.error('Failed to browse folder:', error);
                onError?.(error instanceof Error ? error : new Error('Failed to browse folder'));
            } finally {
                setLoading(false);
            }
        },
        [browseFolderChildren, breadcrumbs, onError, initialFolderId, folderSelectionMode, onFolderSelect]
    );

    const handleFileClick = useCallback(
        async (file: DriveNode) => {
            if (file.type !== 'file') {
                return;
            }

            // Check file size limit before downloading
            if (file.size && file.size > MAX_FILE_SIZE) {
                const maxSizeFormatted = humanSize({ bytes: MAX_FILE_SIZE, unit: 'MB', fraction: 0 });
                const fileSizeFormatted = humanSize({ bytes: file.size, unit: 'MB', fraction: 1 });
                createNotification({
                    text: c('collider_2025: Error')
                        .t`File "${file.name}" is too large (${fileSizeFormatted}). Maximum allowed size is ${maxSizeFormatted}.`,
                    type: 'error',
                });
                return;
            }

            try {
                setDownloadingFile(file.nodeId);
                setDownloadProgress(0);

                const data = await downloadFile(file.nodeId, (progress) => {
                    setDownloadProgress(progress);
                });

                // Final size check after download (fallback validation)
                if (data.byteLength > MAX_FILE_SIZE) {
                    const maxSizeFormatted = humanSize({ bytes: MAX_FILE_SIZE, unit: 'MB', fraction: 0 });
                    const fileSizeFormatted = humanSize({ bytes: data.byteLength, unit: 'MB', fraction: 1 });
                    createNotification({
                        text: c('collider_2025: Error')
                            .t`File "${file.name}" is too large (${fileSizeFormatted}). Maximum allowed size is ${maxSizeFormatted}.`,
                        type: 'error',
                    });
                    return;
                }

                onFileSelect(file, new Uint8Array(data));
            } catch (error) {
                console.error('Failed to download file:', error);
                onError?.(error instanceof Error ? error : new Error('Failed to download file'));
            } finally {
                setDownloadingFile(null);
                setDownloadProgress(null);
            }
        },
        [downloadFile, onFileSelect, onError, createNotification]
    );

    const handleBreadcrumbClick = useCallback(
        async (breadcrumb: BreadcrumbItem) => {
            if (breadcrumb.node.nodeId === currentFolder?.nodeId) {
                return;
            }

            // Prevent navigating back to root if we have an initialFolderId
            if (initialFolderId && breadcrumb.index === 0 && breadcrumb.node.nodeId === rootFolderId) {
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
        [browseFolderChildren, breadcrumbs, currentFolder, onError, initialFolderId, rootFolderId]
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
                    // Check file size limit first
                    if (file.size > MAX_FILE_SIZE) {
                        const maxSizeFormatted = humanSize({ bytes: MAX_FILE_SIZE, unit: 'MB', fraction: 0 });
                        const fileSizeFormatted = humanSize({ bytes: file.size, unit: 'MB', fraction: 1 });
                        createNotification({
                            text: c('collider_2025: Error')
                                .t`File "${file.name}" is too large (${fileSizeFormatted}). Maximum allowed size is ${maxSizeFormatted}.`,
                            type: 'error',
                        });
                        continue; // Skip this file and continue with the next one
                    }

                    setUploadProgress({ fileName: file.name, progress: 0 });

                    // Upload the file to Drive
                    const nodeUid = await uploadFile(currentFolder.nodeId, file, (progress) => {
                        setUploadProgress({ fileName: file.name, progress });
                    });

                    console.log(`Successfully uploaded ${file.name}`);

                    // If folder is linked, files are automatically active - don't process as assets
                    if (!isLinkedFolder) {
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
                    } else {
                        // Just show success notification - file is in Drive and will be available automatically
                        createNotification({
                            text: c('collider_2025: Success').t`File uploaded to Drive folder`,
                            type: 'success',
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

    // Expose imperative methods via ref
    useImperativeHandle(ref, () => ({
        triggerUpload: handleUploadButtonClick,
        triggerRefresh: handleRefresh,
    }), [handleUploadButtonClick, handleRefresh]);

    // Check if we can show the "Link Current Folder" option
    const canLinkCurrentFolder = (() => {
        const hasCurrentFolder = !!currentFolder;
        const isInFolderSelectionMode = folderSelectionMode;
        const hasSelectionCallback = !!onFolderSelect;
        const hasRootFolderId = !!rootFolderId;
        const isNotRootFolder = currentFolder?.nodeId !== rootFolderId;
        
        return hasCurrentFolder && 
               isInFolderSelectionMode && 
               hasSelectionCallback && 
               hasRootFolderId && 
               isNotRootFolder;
    })();

    const handleLinkCurrentFolder = useCallback(() => {
        if (!currentFolder) return;
        
        // Prevent selecting the root folder
        if (currentFolder.nodeId === rootFolderId) {
            createNotification({
                text: c('collider_2025:Error').t`Cannot link the root folder. Please select a subfolder.`,
                type: 'error',
            });
            return;
        }
        
        onFolderSelect?.(currentFolder);
    }, [currentFolder, rootFolderId, onFolderSelect, createNotification]);

    // Check for errors from both SDK and local initialization
    const displayError = error || localError;
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

            {!hideHeader && (
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
                    folderSelectionMode={folderSelectionMode}
                    onLinkCurrentFolder={canLinkCurrentFolder ? handleLinkCurrentFolder : undefined}
                    currentFolderName={currentFolder?.name}
                />
            )}

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
                <DriveContent
                    loading={loading}
                    isRefreshing={isRefreshing}
                    children={children}
                    currentFolder={currentFolder}
                    breadcrumbs={breadcrumbs}
                    existingFiles={existingFiles}
                    downloadingFile={downloadingFile}
                    downloadProgress={downloadProgress}
                    onFileClick={handleFileClick}
                    onFolderClick={handleFolderClick}
                    onUpload={handleUploadButtonClick}
                    isLinkedFolder={isLinkedFolder}
                    folderSelectionMode={folderSelectionMode}
                    handleBreadcrumbClick={handleBreadcrumbClick}
                />
            )}
        </div>
    );
});

DriveBrowser.displayName = 'DriveBrowser';
