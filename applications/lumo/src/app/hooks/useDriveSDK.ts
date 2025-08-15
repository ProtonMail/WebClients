import { useCallback, useEffect, useRef, useState } from 'react';

import { MemoryCache, ProtonDriveClient } from '@protontech/drive-sdk';

import { useUser } from '@proton/account/user/hooks';
import { useLocalState } from '@proton/components';
import { initOpenPGPCryptoModule } from '@proton/drive/lib/openPGPCryptoModule';
import { initTelemetry } from '@proton/drive/lib/telemetry';
import { useAccount } from '@proton/drive/lib/useAccount';
import { useHttpClient } from '@proton/drive/lib/useHttpClient';
import { useSrpModule } from '@proton/drive/lib/useSrpModule';
import { isPaid } from '@proton/shared/lib/user/helpers';

export interface DriveNode {
    nodeId: string;
    name: string;
    type: 'file' | 'folder';
    size?: number;
    mimeType?: string;
    mediaType?: string;
    modifiedTime?: number;
    parentNodeId?: string;
}

export interface DriveSDKState {
    isInitialized: boolean;
    isLoading: boolean;
    error: string | null;
    currentFolder: DriveNode | null;
    folderContents: DriveNode[];
    breadcrumbs: DriveNode[];
    downloadProgress: { [nodeId: string]: number };
    lastRefreshTime: number;
}

export interface DriveSDKMethods {
    browseFolderChildren: (folderId?: string, forceRefresh?: boolean) => Promise<DriveNode[]>;
    downloadFile: (nodeId: string, onProgress?: (progress: number) => void) => Promise<ArrayBuffer>;
    uploadFile: (folderId: string, file: File, onProgress?: (progress: number) => void) => Promise<string>;
    navigateToFolder: (folderId: string) => void;
    navigateUp: () => void;
    getRootFolder: () => Promise<DriveNode>;
}

export function useDriveSDK(): DriveSDKState & DriveSDKMethods {
    const [state, setState] = useState<DriveSDKState>({
        isInitialized: false,
        isLoading: false,
        error: null,
        currentFolder: null,
        folderContents: [],
        breadcrumbs: [],
        downloadProgress: {},
        lastRefreshTime: Date.now(),
    });

    const [user] = useUser();
    const [debug] = useLocalState(false, 'proton-drive-debug');
    const httpClient = useHttpClient([]);
    const account = useAccount();
    const openPGPCryptoModule = initOpenPGPCryptoModule();
    const srpModule = useSrpModule();

    // Create our own controllable cache instances
    const entitiesCacheRef = useRef<MemoryCache<any>>();
    const cryptoCacheRef = useRef<MemoryCache<any>>();
    const driveClientRef = useRef<ProtonDriveClient>();

    const initializeDriveSDK = useCallback(async () => {
        try {
            setState((prev) => ({ ...prev, isLoading: true, error: null }));

            // Create fresh cache instances that we control
            entitiesCacheRef.current = new MemoryCache();
            cryptoCacheRef.current = new MemoryCache();

            const userPlan = isPaid(user) ? 'paid' : 'free';
            const { telemetry } = initTelemetry(userPlan, debug);

            // Create our own ProtonDriveClient instance with controllable caches
            driveClientRef.current = new ProtonDriveClient({
                httpClient,
                entitiesCache: entitiesCacheRef.current,
                cryptoCache: cryptoCacheRef.current,
                account,
                openPGPCryptoModule,
                config: {
                    baseUrl: `${window.location.host}/api`,
                },
                telemetry,
                srpModule,
            });

            setState((prev) => ({ ...prev, isInitialized: true, isLoading: false }));
        } catch (error) {
            console.error('Failed to initialize Drive:', error);
            setState((prev) => ({
                ...prev,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to initialize Drive',
            }));
        }
    }, [user, debug, httpClient, account, openPGPCryptoModule]);

    const clearCaches = useCallback(() => {
        console.log('Clearing Drive SDK caches...');
        try {
            if (entitiesCacheRef.current && typeof entitiesCacheRef.current.clear === 'function') {
                entitiesCacheRef.current.clear();
                console.log('Cleared entitiesCache');
            }
            if (cryptoCacheRef.current && typeof cryptoCacheRef.current.clear === 'function') {
                cryptoCacheRef.current.clear();
                console.log('Cleared cryptoCache');
            }
        } catch (error) {
            console.warn('Failed to clear caches:', error);
        }
    }, []);

    const getRootFolder = useCallback(async (): Promise<DriveNode> => {
        const drive = driveClientRef.current;
        if (!drive) {
            throw new Error('Drive not initialized');
        }

        try {
            const rootFolderResponse = await drive.getMyFilesRootFolder();
            console.log('Raw root folder response:', rootFolderResponse);

            if (!rootFolderResponse) {
                throw new Error('Root folder is undefined - Drive may not be fully initialized');
            }

            // Handle MaybeNode structure
            let rootFolder;
            if ('ok' in rootFolderResponse && rootFolderResponse.ok && rootFolderResponse.value) {
                rootFolder = rootFolderResponse.value;
            } else {
                rootFolder = rootFolderResponse;
            }

            const nodeId = (rootFolder as any).uid || (rootFolder as any).linkId || (rootFolder as any).nodeId;
            if (!nodeId) {
                console.error('Root folder object:', rootFolder);
                throw new Error('Could not extract node ID from root folder');
            }

            return {
                nodeId,
                name: 'My Files',
                type: 'folder',
                parentNodeId: undefined,
            };
        } catch (error) {
            console.error('Failed to get root folder:', error);

            // Check if this is the "Unprocessable Content" error that occurs when Drive hasn't been initialized
            if (error && typeof error === 'object' && 'message' in error) {
                const errorMessage = (error as any).message || '';
                const errorName = (error as any).name || '';

                // Check for StatusCodeError with Unprocessable Content (422)
                if (
                    errorName === 'StatusCodeError' ||
                    errorMessage.includes('Unprocessable Content') ||
                    (error as any).status === 422
                ) {
                    throw new Error('DRIVE_NOT_INITIALIZED');
                }
            }

            throw error;
        }
    }, []);

    const browseFolderChildren = useCallback(
        async (folderId?: string, forceRefresh?: boolean): Promise<DriveNode[]> => {
            const drive = driveClientRef.current;
            if (!drive) {
                throw new Error('Drive not initialized');
            }

            try {
                setState((prev) => ({ ...prev, isLoading: true, error: null }));

                // Clear caches if force refresh is requested
                if (forceRefresh) {
                    clearCaches();
                }

                let targetFolderId = folderId;
                if (!targetFolderId) {
                    const rootFolderResponse = await drive.getMyFilesRootFolder();
                    if (!rootFolderResponse) {
                        throw new Error('Root folder is undefined - Drive may not be fully initialized');
                    }

                    // Handle MaybeNode structure
                    let rootFolder;
                    if ('ok' in rootFolderResponse && rootFolderResponse.ok && rootFolderResponse.value) {
                        rootFolder = rootFolderResponse.value;
                    } else {
                        rootFolder = rootFolderResponse;
                    }

                    targetFolderId =
                        (rootFolder as any).uid || (rootFolder as any).linkId || (rootFolder as any).nodeId;
                    if (!targetFolderId) {
                        throw new Error('Could not extract node ID from root folder');
                    }
                }
                const children: DriveNode[] = [];

                // Create a new AbortController for each request
                const abortController = new AbortController();

                // Use the drive.iterateFolderChildren method
                for await (const maybeNode of drive.iterateFolderChildren(targetFolderId, abortController.signal)) {
                    // Handle the MaybeNode type - check if it's successful
                    if ('ok' in maybeNode && maybeNode.ok && maybeNode.value) {
                        const node = maybeNode.value;

                        // Determine file type based on node.type property
                        const isFile = (node as any).type === 'file';

                        children.push({
                            nodeId: (node as any).uid || (node as any).linkId || (node as any).nodeId,
                            name: (node as any).name,
                            type: isFile ? 'file' : 'folder',
                            size: isFile ? (node as any).size : undefined,
                            mimeType: isFile ? (node as any).mimeType : undefined,
                            mediaType: isFile ? (node as any).mediaType : undefined,
                            modifiedTime: (node as any).modifyTime || (node as any).modifiedTime,
                            parentNodeId: targetFolderId,
                        });
                    }
                }

                const currentFolder: DriveNode = {
                    nodeId: targetFolderId,
                    name: folderId ? 'Folder' : 'My Files',
                    type: 'folder',
                    parentNodeId: undefined,
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
                    const errorMsg = (error as any).message || '';
                    const errorName = (error as any).name || '';

                    // Check for StatusCodeError with Unprocessable Content (422)
                    if (
                        errorName === 'StatusCodeError' ||
                        errorMsg.includes('Unprocessable Content') ||
                        (error as any).status === 422
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
        [clearCaches]
    );

    const downloadFile = useCallback(
        async (nodeId: string, onProgress?: (progress: number) => void): Promise<ArrayBuffer> => {
            const drive = driveClientRef.current;
            if (!drive) {
                throw new Error('Drive not initialized');
            }

            try {
                setState((prev) => ({
                    ...prev,
                    downloadProgress: { ...prev.downloadProgress, [nodeId]: 0 },
                }));

                const downloader = await drive.getFileDownloader(nodeId);
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
                                downloadProgress: { ...prev.downloadProgress, [nodeId]: progress },
                            }));
                        }
                    },
                });

                // Start the download
                const downloadController = downloader.writeToStream(stream, (downloadedBytes) => {
                    if (onProgress && claimedSize > 0) {
                        const progress = (downloadedBytes / claimedSize) * 100;
                        onProgress(progress);
                        setState((prev) => ({
                            ...prev,
                            downloadProgress: { ...prev.downloadProgress, [nodeId]: progress },
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
                    delete newProgress[nodeId];
                    return { ...prev, downloadProgress: newProgress };
                });

                return result;
            } catch (error) {
                // Clean up progress tracking on error
                setState((prev) => {
                    const newProgress = { ...prev.downloadProgress };
                    delete newProgress[nodeId];
                    return { ...prev, downloadProgress: newProgress };
                });

                console.error('Failed to download file:', error);
                throw error;
            }
        },
        []
    );

    const uploadFile = useCallback(
        async (folderId: string, file: File, onProgress?: (progress: number) => void): Promise<string> => {
            const drive = driveClientRef.current;
            if (!drive) {
                throw new Error('Drive not initialized');
            }

            try {
                console.log(`Starting upload of ${file.name} to folder ${folderId}`);

                // Get the file uploader
                const uploader = await drive.getFileUploader(folderId, file.name, {
                    mediaType: file.type,
                    expectedSize: file.size,
                });

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
                const uploadController = await uploader.writeStream(streamWithProgress, []);

                // Wait for completion and get the node UID
                const nodeUid = await uploadController.completion();

                console.log(`Upload completed for ${file.name}, node UID: ${nodeUid}`);
                return nodeUid;
            } catch (error) {
                console.error('Failed to upload file:', error);
                throw error;
            }
        },
        []
    );

    const navigateToFolder = useCallback(
        (folderId: string) => {
            browseFolderChildren(folderId);
        },
        [browseFolderChildren]
    );

    const navigateUp = useCallback(() => {
        if (state.currentFolder?.parentNodeId) {
            browseFolderChildren(state.currentFolder.parentNodeId);
        } else {
            browseFolderChildren(); // Go to root
        }
    }, [state.currentFolder, browseFolderChildren]);

    useEffect(() => {
        if (!state.isInitialized && !state.isLoading && user) {
            initializeDriveSDK();
        }
    }, [initializeDriveSDK, state.isInitialized, state.isLoading, user]);

    return {
        ...state,
        browseFolderChildren,
        downloadFile,
        uploadFile,
        navigateToFolder,
        navigateUp,
        getRootFolder,
    };
}
