import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { NodeType, useDrive } from '@proton/drive';
import { generateThumbnail } from '@proton/drive/modules/thumbnails';
import { isPaid } from '@proton/shared/lib/user/helpers';

import config from '../config';
import { useIsGuest } from '../providers/IsGuestProvider';
import { getNodeEntity, logging } from '../util/driveSdk';

let hasInitialized = false;

export interface DriveNode {
    nodeUid: string;
    name: string;
    type: NodeType;
    size?: number;
    mediaType?: string;
    modifiedTime?: Date;
    parentUid?: string;
    treeEventScopeId?: string;
}

export interface DriveSDKState {
    isLoading: boolean;
    error: string | null;
    currentFolder: DriveNode | null;
    folderContents: DriveNode[];
    breadcrumbs: DriveNode[];
    downloadProgress: { [nodeId: string]: number };
    lastRefreshTime: number;
}

export interface DriveEvent {
    eventId: string;
    treeEventScopeId: string;
    type?: string;
    action?: string;
    nodeUid?: string;
    parentNodeUid?: string;
    name?: string;
    nodeType?: string;
    isTrashed?: boolean;
    isShared?: boolean;
}

export interface EventSubscription {
    dispose: () => void;
}

export interface DriveSDKMethods {
    browseFolderChildren: (folderUid?: string, forceRefresh?: boolean) => Promise<DriveNode[]>;
    downloadFile: (nodeUid: string, onProgress?: (progress: number) => void) => Promise<ArrayBuffer>;
    uploadFile: (folderUid: string, file: File, onProgress?: (progress: number) => void) => Promise<string>;
    createFolder: (parentFolderUid: string, folderName: string) => Promise<string>;
    navigateToFolder: (folderUid: string) => void;
    navigateUp: () => void;
    getRootFolder: () => Promise<DriveNode>;
    subscribeToDriveEvents: (callback: (event: DriveEvent) => Promise<void>) => Promise<EventSubscription>;
    subscribeToTreeEvents: (
        treeEventScopeId: string,
        callback: (event: DriveEvent) => Promise<void>
    ) => Promise<EventSubscription>;
}

export function useDriveSDK(): DriveSDKState & DriveSDKMethods & { isInitialized: boolean } {
    const {
        drive,
        init: initDrive,
        internal: { clearCache },
    } = useDrive();
    const [user] = useUser();
    const isGuest = useIsGuest();
    const [state, setState] = useState<DriveSDKState>({
        isLoading: false,
        error: null,
        currentFolder: null,
        folderContents: [],
        breadcrumbs: [],
        downloadProgress: {},
        lastRefreshTime: Date.now(),
    });

    const getRootFolder = useCallback(async (): Promise<DriveNode> => {
        try {
            const rootFolderResponse = await drive.getMyFilesRootFolder();
            const { node: rootFolderNode } = getNodeEntity(rootFolderResponse);
            return {
                nodeUid: rootFolderNode.uid,
                name: c('Title').t`My Files`,
                type: NodeType.Folder,
                parentUid: undefined,
            };
        } catch (error) {
            console.error('Failed to get root folder:', error);

            // Check if this is the "Unprocessable Content" error that occurs when Drive hasn't been initialized
            if (error && typeof error === 'object' && 'message' in error) {
                const errorMessage = (error as Error).message || '';
                const errorName = (error as Error).name || '';

                // Check for StatusCodeError with Unprocessable Content (422)
                if (
                    errorName === 'StatusCodeError' ||
                    errorMessage.includes('Unprocessable Content') ||
                    (error as { status?: number }).status === 422
                ) {
                    throw new Error('DRIVE_NOT_INITIALIZED');
                }
            }

            throw error;
        }
    }, [drive]);

    const browseFolderChildren = useCallback(
        async (folderUid?: string, forceRefresh?: boolean): Promise<DriveNode[]> => {
            // Prevent Drive API calls for guest users
            if (isGuest) {
                throw new Error('Drive is not available for guest users');
            }

            try {
                setState((prev) => ({ ...prev, isLoading: true, error: null }));

                // Clear cache if force refresh is requested to get fresh data from server
                if (forceRefresh && clearCache) {
                    console.log('[DriveSDK] Force refresh - clearing cache');
                    await clearCache();
                }

                const maybeRootFolderNode = await drive.getMyFilesRootFolder();
                const { node: rootFolderNode } = getNodeEntity(maybeRootFolderNode);

                const children: DriveNode[] = [];

                // Create a new AbortController for each request
                const abortController = new AbortController();

                // Use the drive.iterateFolderChildren method
                for await (const maybeNode of drive.iterateFolderChildren(
                    folderUid || rootFolderNode.uid,
                    undefined,
                    abortController.signal
                )) {
                    const { node } = getNodeEntity(maybeNode);

                    children.push({
                        nodeUid: node.uid,
                        name: node.name,
                        type: node.type,
                        size: node.activeRevision?.storageSize || node.totalStorageSize,
                        mediaType: node.mediaType,
                        modifiedTime: node.activeRevision?.claimedModificationTime || node.creationTime,
                        parentUid: node.parentUid,
                        treeEventScopeId: node.treeEventScopeId,
                    });
                }

                const currentFolder: DriveNode = {
                    nodeUid: folderUid || rootFolderNode.uid,
                    name: folderUid ? c('Title').t`Folder` : c('Title').t`My Files`,
                    type: NodeType.Folder,
                    parentUid: undefined,
                };

                setState((prev) => ({
                    ...prev,
                    currentFolder,
                    folderContents: children,
                    isLoading: false,
                    lastRefreshTime: forceRefresh ? Date.now() : prev.lastRefreshTime,
                }));

                return children;
            } catch (error) {
                console.error('Failed to browse folder children:', error);

                let errorMessage = 'Failed to browse folder';

                // Check if this is the "Unprocessable Content" error that occurs when Drive hasn't been initialized
                if (error && typeof error === 'object' && 'message' in error) {
                    const errorMsg = (error as Error).message || '';
                    const errorName = (error as Error).name || '';

                    // Check for StatusCodeError with Unprocessable Content (422)
                    if (
                        errorName === 'StatusCodeError' ||
                        errorMsg.includes('Unprocessable Content') ||
                        (error as { status?: number }).status === 422
                    ) {
                        errorMessage = 'DRIVE_NOT_INITIALIZED';
                    }
                }

                setState((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: errorMessage,
                }));
                throw error;
            }
        },
        [drive, isGuest, clearCache]
    );

    const downloadFile = useCallback(
        async (nodeUid: string, onProgress?: (progress: number) => void): Promise<ArrayBuffer> => {
            // Prevent Drive API calls for guest users
            if (isGuest) {
                throw new Error('Drive is not available for guest users');
            }

            try {
                setState((prev) => ({
                    ...prev,
                    downloadProgress: { ...prev.downloadProgress, [nodeUid]: 0 },
                }));

                const downloader = await drive.getFileDownloader(nodeUid);
                const claimedSize = downloader.getClaimedSizeInBytes() || 0;

                // Create a WritableStream to collect the data
                const chunks: Uint8Array<ArrayBuffer>[] = [];
                let downloadedBytes = 0;

                const stream = new WritableStream({
                    write(chunk: Uint8Array<ArrayBuffer>) {
                        chunks.push(chunk);
                        downloadedBytes += chunk.length;

                        if (onProgress && claimedSize > 0) {
                            const progress = (downloadedBytes / claimedSize) * 100;
                            onProgress(progress);
                            setState((prev) => ({
                                ...prev,
                                downloadProgress: { ...prev.downloadProgress, [nodeUid]: progress },
                            }));
                        }
                    },
                });

                // Start the download
                const downloadController = downloader.downloadToStream(stream, (downloadedBytes) => {
                    if (onProgress && claimedSize > 0) {
                        const progress = (downloadedBytes / claimedSize) * 100;
                        onProgress(progress);
                        setState((prev) => ({
                            ...prev,
                            downloadProgress: { ...prev.downloadProgress, [nodeUid]: progress },
                        }));
                    }
                });

                // Wait for completion
                await downloadController.completion();

                // Combine all chunks into a single ArrayBuffer
                const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
                const result = new ArrayBuffer(totalLength);
                const resultView = new Uint8Array(result);
                let offset = 0;

                for (const chunk of chunks) {
                    resultView.set(chunk, offset);
                    offset += chunk.length;
                }

                // Clean up progress tracking
                setState((prev) => {
                    const newProgress = { ...prev.downloadProgress };
                    delete newProgress[nodeUid];
                    return { ...prev, downloadProgress: newProgress };
                });

                return result;
            } catch (error) {
                // Clean up progress tracking on error
                setState((prev) => {
                    const newProgress = { ...prev.downloadProgress };
                    delete newProgress[nodeUid];
                    return { ...prev, downloadProgress: newProgress };
                });

                console.error('Failed to download file:', error);
                throw error;
            }
        },
        [drive, isGuest]
    );

    const uploadFile = useCallback(
        async (folderUid: string, file: File, onProgress?: (progress: number) => void): Promise<string> => {
            // Prevent Drive API calls for guest users
            if (isGuest) {
                throw new Error('Drive is not available for guest users');
            }

            try {
                console.log(`Starting upload of ${file.name} to folder ${folderUid}`);

                const { mimeTypePromise, thumbnailsPromise } = generateThumbnail(file, file.name, file.size);
                const thumbnailsResult = await thumbnailsPromise;
                const mediaInfo = thumbnailsResult.ok
                    ? {
                          duration: thumbnailsResult.result?.duration,
                          width: thumbnailsResult.result?.width,
                          height: thumbnailsResult.result?.height,
                      }
                    : undefined;
                const metadata = {
                    mediaType: await mimeTypePromise,
                    expectedSize: file.size,
                    additionalMetadata: {
                        media: {
                            width: mediaInfo?.width,
                            height: mediaInfo?.height,
                            duration: mediaInfo?.duration,
                        },
                    },
                    modificationTime: new Date(file.lastModified),
                };

                // Get the file uploader
                const uploader = await drive.getFileUploader(folderUid, file.name, metadata);

                // Create a ReadableStream from the file with progress tracking
                const originalStream = file.stream();
                let totalUploadedBytes = 0;

                // Create a transform stream to track progress
                const progressStream = new TransformStream({
                    transform(chunk, controller) {
                        totalUploadedBytes += chunk.length;
                        if (onProgress && file.size > 0) {
                            const progress = (totalUploadedBytes / file.size) * 100;
                            console.log(`Upload progress: ${totalUploadedBytes}/${file.size} = ${progress}%`);
                            onProgress(progress);
                        }
                        controller.enqueue(chunk);
                    },
                });

                const streamWithProgress = originalStream.pipeThrough(progressStream);
                // Start the upload
                const uploadController = await uploader.uploadFromStream(
                    streamWithProgress,
                    thumbnailsResult.ok && thumbnailsResult.result?.thumbnails
                        ? thumbnailsResult.result?.thumbnails
                        : []
                );

                // Wait for completion and get the node UID
                const { nodeUid } = await uploadController.completion();

                console.log(`Upload completed for ${file.name}, node UID: ${nodeUid}`);
                return nodeUid;
            } catch (error) {
                console.error('Failed to upload file:', error);
                throw error;
            }
        },
        [drive, isGuest]
    );

    const navigateToFolder = useCallback(
        (folderUid: string) => {
            void browseFolderChildren(folderUid);
        },
        [browseFolderChildren]
    );

    const navigateUp = useCallback(() => {
        if (state.currentFolder?.parentUid) {
            void browseFolderChildren(state.currentFolder.parentUid);
        } else {
            void browseFolderChildren(); // Go to root
        }
    }, [state.currentFolder, browseFolderChildren]);

    const subscribeToDriveEvents = useCallback(
        async (callback: (event: DriveEvent) => Promise<void>): Promise<EventSubscription> => {
            if (!drive) {
                throw new Error('Drive not initialized');
            }

            console.log('[DriveSDK] Subscribing to drive events');
            const subscription = await drive.subscribeToDriveEvents(callback);
            console.log('[DriveSDK] Successfully subscribed to drive events');
            return subscription;
        },
        [drive]
    );

    const createFolder = useCallback(
        async (parentFolderUid: string, folderName: string): Promise<string> => {
            // Prevent Drive API calls for guest users
            if (isGuest) {
                throw new Error('Drive is not available for guest users');
            }

            try {
                console.log(`Creating folder "${folderName}" in parent ${parentFolderUid}`);
                const result = await drive.createFolder(parentFolderUid, folderName);
                const { node } = getNodeEntity(result);
                console.log(`Folder created successfully, node UID: ${node.uid}`);
                return node.uid;
            } catch (error) {
                console.error('Failed to create folder:', error);
                throw error;
            }
        },
        [drive, isGuest]
    );

    const subscribeToTreeEvents = useCallback(
        async (
            treeEventScopeId: string,
            callback: (event: DriveEvent) => Promise<void>
        ): Promise<EventSubscription> => {
            if (!drive) {
                throw new Error('Drive not initialized');
            }

            console.log('[DriveSDK] Subscribing to tree events for scope:', treeEventScopeId);
            const subscription = await drive.subscribeToTreeEvents(treeEventScopeId, callback);
            console.log('[DriveSDK] Successfully subscribed to tree events');
            return subscription;
        },
        [drive]
    );

    useEffect(() => {
        // Skip initialization for guest users
        if (isGuest) {
            return;
        }
        if (!drive && !state.isLoading && !hasInitialized) {
            hasInitialized = true;
            const userPlan = isPaid(user) ? 'paid' : 'free';
            setState((prev) => ({ ...prev, isLoading: true }));
            initDrive({
                appName: config.APP_NAME,
                appVersion: config.APP_VERSION,
                userPlan,
                logging,
            });
        }
    }, [initDrive, drive, state.isLoading, isGuest, user]);

    return {
        ...state,
        isInitialized: !!drive,
        browseFolderChildren,
        downloadFile,
        uploadFile,
        createFolder,
        navigateToFolder,
        navigateUp,
        getRootFolder,
        subscribeToDriveEvents,
        subscribeToTreeEvents,
    };
}
