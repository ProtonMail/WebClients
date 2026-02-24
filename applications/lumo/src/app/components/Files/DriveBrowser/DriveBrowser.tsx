// TODO: Remove disable and fix the file
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { InputFieldTwo, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import Loader from '@proton/components/components/loader/Loader';
import useNotifications from '@proton/components/hooks/useNotifications';
import { NodeType } from '@proton/drive';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import { MAX_ASSET_SIZE, MAX_FILE_SIZE } from '../../../constants';
import { useDriveFolderIndexing } from '../../../hooks/useDriveFolderIndexing';
import type { DriveNode } from '../../../hooks/useDriveSDK';
import { useDriveSDK } from '../../../hooks/useDriveSDK';
import { useFileProcessing } from '../../../hooks';
import { useDriveIndexing } from '../../../providers/DriveIndexingProvider';
import { SearchService } from '../../../services/search/searchService';
import type { DriveDocument } from '../../../types/documents';
import { getAcceptAttributeString, getMimeTypeFromExtension } from '../../../util/filetypes';
import type { BreadcrumbItem } from './DriveBreadcrumbs';
import { DriveBrowserHeader } from './DriveBrowserHeader';
import { DriveContent } from './DriveContent';
import { DriveErrorState } from './DriveErrorState';
import { IndexingStatusBanner } from './IndexingStatusBanner';
import { type UploadProgress, UploadProgressOverlay } from './UploadProgressOverlay';

export interface DriveBrowserHandle {
    triggerUpload: () => void;
    triggerRefresh: () => void;
    navigateToBreadcrumb: (breadcrumb: BreadcrumbItem) => void;
}

interface DriveBrowserProps {
    onFileSelect: (file: DriveNode, content: Uint8Array<ArrayBuffer>) => void;
    onError?: (error: Error) => void;
    onClose?: () => void; // Close the entire panel
    onBack?: () => void; // Go back to FilesPanel
    // isModal?: boolean;
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
    onBreadcrumbsChange?: (breadcrumbs: BreadcrumbItem[]) => void; // Called when breadcrumbs change
    showBreadcrumbs?: boolean;
}

export const DriveBrowser = forwardRef<DriveBrowserHandle, DriveBrowserProps>(
    (
        {
            onFileSelect,
            onError,
            onClose,
            onBack,
            // isModal = false,
            initialShowDriveBrowser = true,
            existingFiles = [],
            onFolderSelect,
            folderSelectionMode = false,
            initialFolderId,
            initialFolderName,
            isLinkedFolder = false,
            hideHeader = false,
            onBreadcrumbsChange,
            showBreadcrumbs = true,
        },
        ref
    ) => {
        const { isInitialized, error, getRootFolder, browseFolderChildren, downloadFile, uploadFile, createFolder } =
            useDriveSDK();
        const { indexingStatus, isIndexing, indexedFolders } = useDriveFolderIndexing();
        const { setIndexingFile } = useDriveIndexing();
        const { createNotification } = useNotifications();
        const fileProcessingService = useFileProcessing();
        const [user] = useUser();
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
        const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
        const [newFolderName, setNewFolderName] = useState('');
        const [isCreatingFolder, setIsCreatingFolder] = useState(false);
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

                const folderChildren = await browseFolderChildren(currentFolder.nodeUid, true);
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
                    handleRefresh().catch(console.error);
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
                setRootFolderId(rootFolder.nodeUid);

                if (initialFolderId && initialFolderId !== rootFolder.nodeUid) {
                    // Navigate to specific folder - this is the base/root for this browser
                    // Browse the folder to get its children
                    const folderChildren = await browseFolderChildren(initialFolderId);
                    setChildren(folderChildren);

                    // Create a DriveNode for the target folder
                    // Use the provided name if available, otherwise use a default
                    const targetFolder: DriveNode = {
                        nodeUid: initialFolderId,
                        name: initialFolderName || c('Title').t`Folder`,
                        type: NodeType.Folder,
                        parentUid: rootFolder.nodeUid, // Store parent for reference, but don't show in breadcrumbs
                    };
                    setCurrentFolder(targetFolder);

                    // Set breadcrumbs starting from the linked folder (not root)
                    // This prevents users from navigating back to root
                    const initialBreadcrumbs = [{ node: targetFolder, index: 0 }];
                    setBreadcrumbs(initialBreadcrumbs);
                    onBreadcrumbsChange?.(initialBreadcrumbs);
                } else {
                    // Start at root folder
                    setCurrentFolder(rootFolder);
                    const rootBreadcrumbs = [{ node: rootFolder, index: 0 }];
                    setBreadcrumbs(rootBreadcrumbs);
                    onBreadcrumbsChange?.(rootBreadcrumbs);
                    const rootChildren = await browseFolderChildren(rootFolder.nodeUid);
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
        }, [getRootFolder, browseFolderChildren, onError, initialFolderId, initialFolderName]);

        useEffect(() => {
            if (!isInitialized || error || initializedRef.current) {
                return;
            }

            void initializeRoot();
        }, [isInitialized, error, initializeRoot]);

        const handleFolderClick = useCallback(
            async (folder: DriveNode) => {
                if (folder.type !== NodeType.Folder) {
                    return;
                }

                // Always navigate into folders (even in folder selection mode)
                try {
                    setLoading(true);
                    const folderChildren = await browseFolderChildren(folder.nodeUid);
                    setChildren(folderChildren);
                    setCurrentFolder(folder);

                    // Add to breadcrumbs
                    // If we have an initialFolderId, start breadcrumbs from that folder (not root)
                    const newBreadcrumb: BreadcrumbItem = {
                        node: folder,
                        index: breadcrumbs.length,
                    };

                    // If this is the first navigation and we have initialFolderId, replace root with initial folder
                    if (initialFolderId && breadcrumbs.length === 0 && folder.nodeUid === initialFolderId) {
                        setBreadcrumbs([newBreadcrumb]);
                        onBreadcrumbsChange?.([newBreadcrumb]);
                    } else {
                        const updatedBreadcrumbs = [...breadcrumbs, newBreadcrumb];
                        setBreadcrumbs(updatedBreadcrumbs);
                        onBreadcrumbsChange?.(updatedBreadcrumbs);
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
                if (file.type !== NodeType.File) {
                    return;
                }

                // For adding files to KB (not linked folder mode), use asset size limit
                // Linked folders can handle larger files since they're indexed directly
                const sizeLimit = isLinkedFolder ? MAX_FILE_SIZE : MAX_ASSET_SIZE;

                // Check file size limit before downloading
                if (file.size && file.size > sizeLimit) {
                    const maxSizeFormatted = humanSize({ bytes: sizeLimit, unit: 'MB', fraction: 0 });
                    const fileSizeFormatted = humanSize({ bytes: file.size, unit: 'MB', fraction: 1 });

                    if (!isLinkedFolder) {
                        // Suggest linking a Drive folder for large files
                        createNotification({
                            text: c('collider_2025: Error')
                                .t`File "${file.name}" (${fileSizeFormatted}) exceeds the ${maxSizeFormatted} limit. Link a Drive folder to your project to work with larger files.`,
                            type: 'error',
                            expiration: 8000,
                        });
                    } else {
                        createNotification({
                            text: c('collider_2025: Error')
                                .t`File "${file.name}" is too large (${fileSizeFormatted}). Maximum allowed size is ${maxSizeFormatted}.`,
                            type: 'error',
                        });
                    }
                    return;
                }

                try {
                    setDownloadingFile(file.nodeUid);
                    setDownloadProgress(0);

                    const data = await downloadFile(file.nodeUid, (progress) => {
                        setDownloadProgress(progress);
                    });

                    // Final size check after download (fallback validation)
                    if (data.byteLength > sizeLimit) {
                        const maxSizeFormatted = humanSize({ bytes: sizeLimit, unit: 'MB', fraction: 0 });
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
            [downloadFile, onFileSelect, onError, createNotification, isLinkedFolder]
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
                        const nodeUid = await uploadFile(currentFolder.nodeUid, file, (progress) => {
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
                                    nodeUid: nodeUid,
                                    name: file.name,
                                    type: NodeType.File,
                                    size: file.size,
                                    mediaType: file.type,
                                    modifiedTime: new Date(),
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
                                    text: c('collider_2025: Error')
                                        .t`File uploaded but failed to add to knowledge base`,
                                    type: 'error',
                                });
                            }
                        } else {
                            // Linked folder - index the file immediately (no need to re-download)
                            try {
                                console.log(`[DriveBrowser] Indexing uploaded file immediately: ${file.name}`);
                                setUploadProgress({ fileName: file.name, progress: 100, isProcessing: true });
                                setIndexingFile(file.name); // Show indexing banner

                                // Yield to event loop to allow React to render the banner
                                await new Promise((resolve) => setTimeout(resolve, 0));

                                // Process the file we already have in memory
                                const result = await fileProcessingService.processFile(file);

                                if (result.type === 'text' && user?.ID) {
                                    // Find the indexed folder for this upload
                                    const indexedFolder = indexedFolders.find(
                                        (f) => f.nodeUid === currentFolder.nodeUid || f.nodeUid === initialFolderId
                                    );

                                    const document: DriveDocument = {
                                        id: nodeUid,
                                        name: file.name,
                                        content: result.content,
                                        mimeType:
                                            file.type ||
                                            getMimeTypeFromExtension(file.name) ||
                                            'application/octet-stream',
                                        size: file.size,
                                        modifiedTime: Date.now(),
                                        folderId: currentFolder.nodeUid,
                                        folderPath: currentFolder.name || '',
                                        spaceId: indexedFolder?.spaceId,
                                    };

                                    if (document.content && document.content.length > 0) {
                                        const searchService = SearchService.get(user.ID);
                                        const indexResult = await searchService.indexDocuments([document]);

                                        if (indexResult.success) {
                                            console.log(
                                                `[DriveBrowser] Successfully indexed uploaded file: ${file.name}`
                                            );
                                            createNotification({
                                                text: c('collider_2025: Success')
                                                    .t`File uploaded and indexed for search`,
                                                type: 'success',
                                            });
                                        } else {
                                            console.error(
                                                '[DriveBrowser] Failed to index uploaded file:',
                                                indexResult.error
                                            );
                                            createNotification({
                                                text: c('collider_2025: Success').t`File uploaded to Drive folder`,
                                                type: 'success',
                                            });
                                        }
                                    } else {
                                        createNotification({
                                            text: c('collider_2025: Success').t`File uploaded to Drive folder`,
                                            type: 'success',
                                        });
                                    }
                                } else if (result.type === 'error') {
                                    const processingResult = result;
                                    console.warn(
                                        `[DriveBrowser] File processing failed for ${file.name}: ${result.message}`
                                    );
                                    createNotification({
                                        text: c('collider_2025: Success').t`File uploaded to Drive folder`,
                                        type: 'success',
                                    });
                                    createNotification({
                                        text: c('collider_2025: Warning')
                                            .t`Failed to index file for search: ${processingResult.message}`,
                                        type: 'warning',
                                    });
                                } else {
                                    console.log(
                                        `[DriveBrowser] Skipping indexing for ${file.name} (type '${result.type}')`
                                    );
                                    createNotification({
                                        text: c('collider_2025: Success').t`File uploaded to Drive folder`,
                                        type: 'success',
                                    });
                                }
                                setIndexingFile(null); // Clear indexing banner
                            } catch (indexError) {
                                console.error(`[DriveBrowser] Failed to index uploaded file:`, indexError);
                                setIndexingFile(null); // Clear indexing banner
                                // Still show success for upload, indexing will happen via event
                                createNotification({
                                    text: c('collider_2025: Success').t`File uploaded to Drive folder`,
                                    type: 'success',
                                });
                            }
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
            [
                currentFolder,
                uploadFile,
                onError,
                handleRefresh,
                onFileSelect,
                createNotification,
                isLinkedFolder,
                user?.ID,
                indexedFolders,
                initialFolderId,
                setIndexingFile,
            ]
        );

        const handleFileInputChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                    void handleFileUpload(files);
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

        const handleCreateFolderClick = useCallback(() => {
            setNewFolderName('');
            setCreateFolderModalOpen(true);
        }, []);

        const handleCreateFolder = useCallback(async () => {
            if (!currentFolder || !newFolderName.trim()) {
                return;
            }

            try {
                setIsCreatingFolder(true);
                await createFolder(currentFolder.nodeUid, newFolderName.trim());

                createNotification({
                    text: c('collider_2025:Success').t`Folder created successfully`,
                    type: 'success',
                });

                setCreateFolderModalOpen(false);
                setNewFolderName('');

                // Refresh to show the new folder
                await handleRefresh();
            } catch (error) {
                console.error('Failed to create folder:', error);
                createNotification({
                    text: c('collider_2025:Error').t`Failed to create folder`,
                    type: 'error',
                });
            } finally {
                setIsCreatingFolder(false);
            }
        }, [currentFolder, newFolderName, createFolder, createNotification, handleRefresh]);

        // Extract breadcrumb navigation logic for external use
        const navigateToBreadcrumb = useCallback(
            async (breadcrumb: BreadcrumbItem) => {
                if (breadcrumb.node.nodeUid === currentFolder?.nodeUid) {
                    return;
                }

                // Prevent navigating back to root if we have an initialFolderId
                if (initialFolderId && breadcrumb.index === 0 && breadcrumb.node.nodeUid === rootFolderId) {
                    return;
                }

                try {
                    setLoading(true);
                    const folderChildren = await browseFolderChildren(breadcrumb.node.nodeUid);
                    setChildren(folderChildren);
                    setCurrentFolder(breadcrumb.node);

                    // Update breadcrumbs to remove items after the clicked one
                    const updatedBreadcrumbs = breadcrumbs.slice(0, breadcrumb.index + 1);
                    setBreadcrumbs(updatedBreadcrumbs);
                    onBreadcrumbsChange?.(updatedBreadcrumbs);
                } catch (error) {
                    console.error('Failed to navigate to folder:', error);
                    onError?.(error instanceof Error ? error : new Error('Failed to navigate to folder'));
                } finally {
                    setLoading(false);
                }
            },
            [
                currentFolder,
                initialFolderId,
                rootFolderId,
                browseFolderChildren,
                breadcrumbs,
                onBreadcrumbsChange,
                onError,
            ]
        );

        const handleBreadcrumbClick = useCallback(
            (breadcrumb: BreadcrumbItem) => {
                void navigateToBreadcrumb(breadcrumb);
            },
            [navigateToBreadcrumb]
        );

        // Expose imperative methods via ref
        useImperativeHandle(
            ref,
            () => ({
                triggerUpload: handleUploadButtonClick,
                triggerRefresh: handleRefresh,
                navigateToBreadcrumb,
            }),
            [handleUploadButtonClick, handleRefresh, navigateToBreadcrumb]
        );

        // Check if we can show the "Link Current Folder" option
        const canLinkCurrentFolder = (() => {
            const hasCurrentFolder = !!currentFolder;
            const isInFolderSelectionMode = folderSelectionMode;
            const hasSelectionCallback = !!onFolderSelect;
            const hasRootFolderId = !!rootFolderId;
            const isNotRootFolder = currentFolder?.nodeUid !== rootFolderId;

            return (
                hasCurrentFolder &&
                isInFolderSelectionMode &&
                hasSelectionCallback &&
                hasRootFolderId &&
                isNotRootFolder
            );
        })();

        const handleLinkCurrentFolder = useCallback(() => {
            if (!currentFolder) return;

            // Prevent selecting the root folder
            if (currentFolder.nodeUid === rootFolderId) {
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
        console.log(
            'DriveBrowser render - SDK error:',
            error,
            'localError:',
            localError,
            'displayError:',
            displayError
        );

        return (
            <div className={'drive-browser-container flex flex-column flex-nowrap h-full relative overflow-y-auto'}>
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

                {/* Indexing status banner (state is now shared via context) */}
                <IndexingStatusBanner indexingStatus={indexingStatus} isIndexing={isIndexing} />

                {displayError && (
                    <DriveErrorState
                        onRetry={() => {
                            void initializeRoot();
                        }}
                        loading={loading}
                    />
                )}

                {/* Upload progress banner */}
                {uploadProgress && <UploadProgressOverlay uploadProgress={uploadProgress} />}

                {!currentFolder && !displayError && (
                    <div className="flex items-center justify-center p-8 h-full">
                        <div className="text-center">
                            <Loader size={'medium'} />
                            <p>Initializing Drive...</p>
                        </div>
                    </div>
                )}

                {currentFolder && (
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
                        onCreateFolder={handleCreateFolderClick}
                        isLinkedFolder={isLinkedFolder}
                        folderSelectionMode={folderSelectionMode}
                        handleBreadcrumbClick={handleBreadcrumbClick}
                        showBreadcrumbs={showBreadcrumbs}
                    />
                )}

                {/* Create Folder Modal */}
                <ModalTwo open={createFolderModalOpen} onClose={() => setCreateFolderModalOpen(false)} size="small">
                    <ModalTwoHeader title={c('collider_2025:Title').t`Create folder`} />
                    <ModalTwoContent>
                        <InputFieldTwo
                            label={c('collider_2025:Label').t`Folder name`}
                            placeholder={c('collider_2025:Placeholder').t`Enter folder name`}
                            value={newFolderName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFolderName(e.target.value)}
                            autoFocus
                            onKeyDown={(e: React.KeyboardEvent) => {
                                if (e.key === 'Enter' && newFolderName.trim()) {
                                    void handleCreateFolder();
                                }
                            }}
                        />
                    </ModalTwoContent>
                    <ModalTwoFooter>
                        <Button onClick={() => setCreateFolderModalOpen(false)} color="weak">
                            {c('collider_2025:Action').t`Cancel`}
                        </Button>
                        <Button
                            onClick={handleCreateFolder}
                            color="norm"
                            loading={isCreatingFolder}
                            disabled={!newFolderName.trim()}
                        >
                            {c('collider_2025:Action').t`Create`}
                        </Button>
                    </ModalTwoFooter>
                </ModalTwo>
            </div>
        );
    }
);

DriveBrowser.displayName = 'DriveBrowser';
