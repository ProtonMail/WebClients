import { Component, type ReactNode, createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { NodeType } from '@proton/drive';

import { useLumoUserSettings } from '../hooks';
import { useFileProcessing } from '../hooks/useFileProcessing';
import { type DriveEvent, type DriveNode, type EventSubscription, useDriveSDK } from '../hooks/useDriveSDK';
import type { IndexedDriveFolder } from '../redux/slices/lumoUserSettings';
import { SearchService } from '../services/search/searchService';
import type { DriveDocument } from '../types/documents';
import { getMimeTypeFromExtension } from '../util/filetypes';
import { useIsGuest } from './IsGuestProvider';

// Debounce time for processing events (ms)
const EVENT_DEBOUNCE_MS = 2000;

// Drive event types from the SDK
enum DriveEventType {
    NodeCreated = 'node_created',
    NodeUpdated = 'node_updated',
    NodeDeleted = 'node_deleted',
    SharedWithMeUpdated = 'shared_with_me_updated',
    TreeRefresh = 'tree_refresh',
    TreeRemove = 'tree_remove',
    FastForward = 'fast_forward',
}

interface FileWithPath extends DriveNode {
    relativePath: string;
}

interface EventIndexingStatus {
    isIndexing: boolean;
    currentFile?: string;
    processedCount: number;
    totalCount: number;
    /** Stage description for detailed progress */
    stage?: string;
}

interface DriveIndexingContextType {
    isSubscribed: boolean;
    subscribedScopes: string[];
    eventIndexingStatus: EventIndexingStatus;
    setIndexingFile: (fileName: string | null) => void;
    setIndexingProgress: (processed: number, total: number, stage?: string) => void;
    /** Completely reset the indexing status to idle state */
    resetIndexingStatus: () => void;
}

const DriveIndexingContext = createContext<DriveIndexingContextType | undefined>(undefined);

interface DriveIndexingProviderProps {
    children: ReactNode;
}

const DEFAULT_EVENT_INDEXING_STATUS: EventIndexingStatus = {
    isIndexing: false,
    processedCount: 0,
    totalCount: 0,
};

const noop = () => {};

const DEFAULT_CONTEXT_VALUE: DriveIndexingContextType = {
    isSubscribed: false,
    subscribedScopes: [],
    eventIndexingStatus: DEFAULT_EVENT_INDEXING_STATUS,
    setIndexingFile: noop,
    setIndexingProgress: noop,
    resetIndexingStatus: noop,
};

/**
 * Inner provider that handles the actual indexing logic.
 * Only rendered when user is authenticated.
 */
const DriveIndexingProviderInner = ({ children, userId }: { children: ReactNode; userId: string }) => {
    const {
        browseFolderChildren,
        downloadFile,
        subscribeToTreeEvents,
        isInitialized: isDriveInitialized,
    } = useDriveSDK();
    const { lumoUserSettings, updateSettings } = useLumoUserSettings();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const fileProcessingService = useFileProcessing();
    const [subscribedScopes, setSubscribedScopes] = useState<string[]>([]);
    const [eventIndexingStatus, setEventIndexingStatus] = useState<EventIndexingStatus>({
        isIndexing: false,
        processedCount: 0,
        totalCount: 0,
    });

    const indexedFolders = lumoUserSettings.indexedDriveFolders || [];

    // Refs for subscription management
    const subscriptionsRef = useRef<Map<string, EventSubscription>>(new Map());
    const pendingEventsRef = useRef<Map<string, DriveEvent>>(new Map());
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const hasCheckedRehydrationRef = useRef(false);

    // Keep indexed folders in a ref so callbacks can access latest value
    const indexedFoldersRef = useRef<IndexedDriveFolder[]>(indexedFolders);
    useEffect(() => {
        indexedFoldersRef.current = indexedFolders;
    }, [indexedFolders]);

    // Auto-rehydrate folders on startup if folders exist in settings but manifest is empty
    // This handles the case when opening the app in a new browser where IndexedDB is empty
    useEffect(() => {
        if (hasCheckedRehydrationRef.current || !isDriveInitialized || indexedFolders.length === 0) {
            return;
        }

        const checkAndRehydrate = async () => {
            hasCheckedRehydrationRef.current = true;

            const searchService = SearchService.get(userId);
            const documents = await searchService.getDriveDocuments();

            console.log('[DriveIndexingProvider] Auto-rehydration check:', {
                indexedFoldersCount: indexedFolders.length,
                documentsInManifest: documents.length,
            });

            // If we have indexed folders but no documents, trigger rehydration
            if (indexedFolders.length > 0 && documents.length === 0) {
                console.log('[DriveIndexingProvider] Manifest empty but folders exist - triggering auto-rehydration');

                setEventIndexingStatus({
                    isIndexing: true,
                    currentFile: 'Rehydrating index...',
                    processedCount: 0,
                    totalCount: indexedFolders.length,
                });

                // Rehydrate each folder
                for (const folder of indexedFolders) {
                    if (folder.isActive === false) continue;

                    try {
                        console.log('[DriveIndexingProvider] Rehydrating folder:', folder.name);
                        setEventIndexingStatus((prev) => ({
                            ...prev,
                            currentFile: `Rehydrating: ${folder.name}`,
                        }));

                        // Collect all files from the folder
                        const allFiles: FileWithPath[] = [];
                        const collectFiles = async (folderUid: string, basePath: string): Promise<void> => {
                            const children = await browseFolderChildren(folderUid);
                            for (const child of children) {
                                if (child.type === NodeType.File) {
                                    allFiles.push({
                                        ...child,
                                        relativePath: basePath ? `${basePath}/${child.name}` : child.name,
                                    });
                                } else if (child.type === NodeType.Folder) {
                                    await collectFiles(
                                        child.nodeUid,
                                        basePath ? `${basePath}/${child.name}` : child.name
                                    );
                                }
                            }
                        };
                        await collectFiles(folder.nodeUid, '');

                        // Download and process files
                        const documents: DriveDocument[] = [];
                        for (const file of allFiles) {
                            try {
                                const fileContent = await downloadFile(file.nodeUid);
                                const fileData = new Uint8Array(fileContent);
                                const inferredMime = getMimeTypeFromExtension(file.name) || 'application/octet-stream';
                                const fileObj = new File([fileData], file.name, { type: inferredMime });
                                const result = await fileProcessingService.processFile(fileObj);

                                if (result.type === 'text') {
                                    documents.push({
                                        id: file.nodeUid,
                                        name: file.name,
                                        content: result.content,
                                        mimeType: inferredMime,
                                        size: fileData.byteLength,
                                        modifiedTime: Date.now(),
                                        folderId: folder.nodeUid,
                                        folderPath: folder.path,
                                        spaceId: folder.spaceId,
                                    });
                                } else if (result.type === 'error') {
                                    console.warn(
                                        '[DriveIndexingProvider] File processing failed during rehydration:',
                                        file.name,
                                        result.message
                                    );
                                } else {
                                    console.log(
                                        `[DriveIndexingProvider] Skipping indexing for ${file.name} (type '${result.type}')`
                                    );
                                }
                            } catch (error) {
                                console.warn(
                                    '[DriveIndexingProvider] Failed to process file during rehydration:',
                                    file.name,
                                    error
                                );
                            }
                        }

                        // Index the documents
                        const docsWithContent = documents.filter((d) => d.content && d.content.length > 0);
                        if (docsWithContent.length > 0) {
                            await searchService.indexDocuments(docsWithContent);
                            console.log(
                                '[DriveIndexingProvider] Rehydrated',
                                docsWithContent.length,
                                'documents for folder:',
                                folder.name
                            );
                        }
                    } catch (error) {
                        console.error('[DriveIndexingProvider] Failed to rehydrate folder:', folder.name, error);
                    }
                }

                setEventIndexingStatus({
                    isIndexing: false,
                    processedCount: 0,
                    totalCount: 0,
                });
                console.log('[DriveIndexingProvider] Auto-rehydration complete');
            }
        };

        void checkAndRehydrate();
    }, [isDriveInitialized, indexedFolders, userId, browseFolderChildren, downloadFile]);

    const findFoldersByScope = useCallback((treeEventScopeId: string): IndexedDriveFolder[] => {
        return indexedFoldersRef.current.filter((f) => f.isActive !== false && f.treeEventScopeId === treeEventScopeId);
    }, []);

    // Check if a file (identified by its parentNodeUid) is within the indexed folder or its subfolders
    const isFileInIndexedFolder = useCallback(
        async (parentNodeUid: string | undefined, indexedFolderUid: string): Promise<boolean> => {
            if (!parentNodeUid) {
                return false;
            }

            // Direct child of indexed folder
            if (parentNodeUid === indexedFolderUid) {
                return true;
            }

            // Check if parent is a subfolder of the indexed folder by recursively browsing
            // We do a breadth-first search of the indexed folder's subfolders
            try {
                const visitedFolders = new Set<string>();
                const queue: string[] = [indexedFolderUid];

                while (queue.length > 0) {
                    const currentFolderUid = queue.shift()!;
                    if (visitedFolders.has(currentFolderUid)) {
                        continue;
                    }
                    visitedFolders.add(currentFolderUid);

                    const children = await browseFolderChildren(currentFolderUid);
                    for (const child of children) {
                        if (child.type === NodeType.Folder) {
                            if (child.nodeUid === parentNodeUid) {
                                return true; // Found the parent folder in the indexed tree
                            }
                            queue.push(child.nodeUid);
                        }
                    }

                    // Limit depth to avoid infinite loops or excessive API calls
                    if (visitedFolders.size > 100) {
                        console.warn('[DriveIndexingProvider] isFileInIndexedFolder: depth limit reached');
                        break;
                    }
                }

                return false;
            } catch (error) {
                console.error('[DriveIndexingProvider] Failed to check if file is in indexed folder:', error);
                return false;
            }
        },
        [browseFolderChildren]
    );

    // Fetch node name by browsing the folder and finding the node
    const fetchNodeName = useCallback(
        async (nodeUid: string, folderUid: string): Promise<string | null> => {
            try {
                console.log('[DriveIndexingProvider] Fetching node name for:', nodeUid);
                // Browse the folder to find the node with this UID
                const children = await browseFolderChildren(folderUid, true); // force refresh to get latest
                const node = children.find((child) => child.nodeUid === nodeUid);
                if (node) {
                    console.log('[DriveIndexingProvider] Found node name:', node.name);
                    return node.name;
                }

                // If not found in immediate children, search recursively in subfolders
                for (const child of children) {
                    if (child.type === NodeType.Folder) {
                        const subChildren = await browseFolderChildren(child.nodeUid, true);
                        const subNode = subChildren.find((c) => c.nodeUid === nodeUid);
                        if (subNode) {
                            console.log('[DriveIndexingProvider] Found node name in subfolder:', subNode.name);
                            return subNode.name;
                        }
                    }
                }

                console.log('[DriveIndexingProvider] Node not found in folder tree');
                return null;
            } catch (error) {
                console.error('[DriveIndexingProvider] Failed to fetch node name:', error);
                return null;
            }
        },
        [browseFolderChildren]
    );

    // Index a single file (handles both new files and updates)
    const indexSingleFile = useCallback(
        async (folder: IndexedDriveFolder, fileNodeUid: string, fileName: string, isUpdate: boolean = false) => {
            const searchService = SearchService.get(userId);

            // For new files (not updates), check if already indexed (e.g., indexed immediately after upload)
            if (!isUpdate && searchService.hasDocument(fileNodeUid)) {
                console.log('[DriveIndexingProvider] File already indexed, skipping download:', fileName);
                return;
            }

            console.log(
                '[DriveIndexingProvider] Indexing single file:',
                fileName,
                fileNodeUid,
                isUpdate ? '(update)' : '(new)'
            );

            // Update status to show we're indexing
            setEventIndexingStatus((prev) => ({
                ...prev,
                isIndexing: true,
                currentFile: fileName,
            }));

            // Yield to event loop to allow React to render the banner
            await new Promise((resolve) => setTimeout(resolve, 0));

            try {
                // For updates, remove the old version first
                if (isUpdate) {
                    console.log('[DriveIndexingProvider] Removing old version before re-indexing');
                    searchService.removeDocument(fileNodeUid);
                }

                const fileContent = await downloadFile(fileNodeUid);
                const fileData = new Uint8Array(fileContent);
                const inferredMime = getMimeTypeFromExtension(fileName) || 'application/octet-stream';
                const fileObj = new File([fileData], fileName, { type: inferredMime });

                const result = await fileProcessingService.processFile(fileObj);
                if (result.type === 'text') {
                    const document: DriveDocument = {
                        id: fileNodeUid,
                        name: fileName,
                        content: result.content,
                        mimeType: inferredMime,
                        size: fileData.byteLength,
                        modifiedTime: Date.now(),
                        folderId: folder.nodeUid,
                        folderPath: folder.path,
                        spaceId: folder.spaceId,
                    };

                    if (document.content && document.content.length > 0) {
                        const indexResult = await searchService.indexDocuments([document]);
                        if (!indexResult.success) {
                            console.error('[DriveIndexingProvider] Failed to index file:', indexResult.error);
                        } else {
                            console.log('[DriveIndexingProvider] Successfully indexed file:', fileName);

                            // Only update document count for new files, not updates
                            if (!isUpdate) {
                                const updatedFolders = indexedFoldersRef.current.map((f) =>
                                    f.nodeUid === folder.nodeUid
                                        ? { ...f, documentCount: (f.documentCount || 0) + 1, indexedAt: Date.now() }
                                        : f
                                );
                                updateSettings({
                                    indexedDriveFolders: updatedFolders,
                                    _autoSave: true,
                                });
                            } else {
                                // For updates, just update the indexedAt timestamp
                                const updatedFolders = indexedFoldersRef.current.map((f) =>
                                    f.nodeUid === folder.nodeUid ? { ...f, indexedAt: Date.now() } : f
                                );
                                updateSettings({
                                    indexedDriveFolders: updatedFolders,
                                    _autoSave: true,
                                });
                            }
                        }
                    }
                } else if (result.type === 'error') {
                    console.warn('[DriveIndexingProvider] File processing failed:', fileName, result.message);
                } else {
                    console.log(`[DriveIndexingProvider] Skipping indexing for ${fileName} (type '${result.type}')`);
                }

                // Update status - file processed
                setEventIndexingStatus((prev) => ({
                    ...prev,
                    processedCount: prev.processedCount + 1,
                    isIndexing: prev.processedCount + 1 < prev.totalCount, // Still indexing if more to process
                    currentFile: prev.processedCount + 1 < prev.totalCount ? prev.currentFile : undefined,
                }));
            } catch (error) {
                console.error('[DriveIndexingProvider] Failed to index file:', fileName, error);
                // Reset status on error
                setEventIndexingStatus((prev) => ({
                    ...prev,
                    isIndexing: false,
                    currentFile: undefined,
                }));
            }
        },
        [userId, downloadFile, updateSettings]
    );

    // Remove a file from the index
    const removeFileFromIndex = useCallback(
        async (folder: IndexedDriveFolder, fileNodeUid: string) => {
            console.log('[DriveIndexingProvider] Removing file from index:', fileNodeUid);

            try {
                const searchService = SearchService.get(userId);
                searchService.removeDocument(fileNodeUid);

                // Update document count
                const updatedFolders = indexedFoldersRef.current.map((f) =>
                    f.nodeUid === folder.nodeUid
                        ? { ...f, documentCount: Math.max(0, (f.documentCount || 0) - 1), indexedAt: Date.now() }
                        : f
                );
                updateSettings({
                    indexedDriveFolders: updatedFolders,
                    _autoSave: true,
                });

                console.log('[DriveIndexingProvider] Successfully removed file from index');
            } catch (error) {
                console.error('[DriveIndexingProvider] Failed to remove file from index:', error);
            }
        },
        [userId, updateSettings]
    );

    // Process pending events (debounced)
    const processPendingEvents = useCallback(async () => {
        const events = Array.from(pendingEventsRef.current.values());
        pendingEventsRef.current.clear();

        if (events.length === 0) return;

        console.log('[DriveIndexingProvider] Processing', events.length, 'pending events');

        // Update pending count for status tracking
        setEventIndexingStatus((prev) => ({
            ...prev,
            totalCount: events.length,
            processedCount: 0,
            isIndexing: true,
        }));

        for (const event of events) {
            try {
                // Extract event details - different event types have different structures
                const nodeUid = event.nodeUid;
                const fileName = event.name;
                const treeEventScopeId = event.treeEventScopeId;
                const eventType = event.type;
                const nodeType = event.nodeType?.toLowerCase();
                const isTrashed = event.isTrashed;
                const parentNodeUid = event.parentNodeUid;

                console.log('[DriveIndexingProvider] Processing event:', {
                    eventType,
                    nodeType,
                    nodeUid,
                    parentNodeUid,
                    treeEventScopeId,
                    fileName,
                    isTrashed,
                    fullEvent: event,
                });

                // Skip events that don't require indexing action
                if (
                    eventType === DriveEventType.FastForward ||
                    eventType === DriveEventType.TreeRefresh ||
                    eventType === DriveEventType.TreeRemove ||
                    eventType === DriveEventType.SharedWithMeUpdated
                ) {
                    console.log('[DriveIndexingProvider] Skipping non-node event:', eventType);
                    continue;
                }

                // Find all indexed folders for this event's scope
                // Multiple folders can share the same treeEventScopeId (e.g., parent and child folders)
                const matchingFolders = findFoldersByScope(treeEventScopeId);
                if (matchingFolders.length === 0) {
                    console.log('[DriveIndexingProvider] Event not for any indexed folder scope:', treeEventScopeId);
                    continue;
                }

                console.log(
                    '[DriveIndexingProvider] Found',
                    matchingFolders.length,
                    'indexed folders for scope:',
                    matchingFolders.map((f) => f.name).join(', ')
                );

                // Handle delete events OR trashed items (node_updated with isTrashed: true)
                if (eventType === DriveEventType.NodeDeleted || isTrashed === true) {
                    if (nodeUid) {
                        console.log(
                            '[DriveIndexingProvider] Processing node deletion/trash:',
                            nodeUid,
                            isTrashed ? '(trashed)' : '(deleted)'
                        );
                        // For deletions, try to remove from all matching folders
                        // (the document will only exist in one, so extra calls are harmless)
                        for (const folder of matchingFolders) {
                            await removeFileFromIndex(folder, nodeUid);
                        }
                    } else {
                        console.log('[DriveIndexingProvider] Delete/trash event missing nodeUid');
                    }
                    continue;
                }

                // For create/update events, skip folder events
                if (nodeType === 'folder') {
                    console.log('[DriveIndexingProvider] Skipping folder event');
                    continue;
                }

                // For create/update events, find which indexed folder actually contains this file
                // by checking if the file's parent is within each folder's tree
                let targetFolder: IndexedDriveFolder | null = null;
                for (const folder of matchingFolders) {
                    const isInFolder = await isFileInIndexedFolder(parentNodeUid, folder.nodeUid);
                    if (isInFolder) {
                        targetFolder = folder;
                        console.log('[DriveIndexingProvider] File is in indexed folder:', folder.name);
                        break;
                    }
                }

                if (!targetFolder) {
                    console.log('[DriveIndexingProvider] File is not in any indexed folder tree, skipping:', {
                        parentNodeUid,
                        checkedFolders: matchingFolders.map((f) => ({ uid: f.nodeUid, name: f.name })),
                    });
                    continue;
                }

                // Handle create/update events
                if (eventType === DriveEventType.NodeCreated || eventType === DriveEventType.NodeUpdated) {
                    if (nodeUid) {
                        // If we don't have the fileName, we need to fetch node details
                        const finalFileName = fileName || (await fetchNodeName(nodeUid, targetFolder.nodeUid));
                        if (finalFileName) {
                            const isUpdate = eventType === DriveEventType.NodeUpdated;
                            await indexSingleFile(targetFolder, nodeUid, finalFileName, isUpdate);
                        } else {
                            console.log('[DriveIndexingProvider] Could not determine file name for nodeUid:', nodeUid);
                        }
                    } else {
                        console.log('[DriveIndexingProvider] Create/update event missing nodeUid');
                    }
                } else {
                    console.log('[DriveIndexingProvider] Unknown event type:', eventType);
                }
            } catch (error) {
                console.error('[DriveIndexingProvider] Error processing event:', error);
            }
        }

        // Reset status after processing all events
        setEventIndexingStatus((prev) => ({
            ...prev,
            isIndexing: false,
            currentFile: undefined,
            processedCount: 0,
            totalCount: 0,
        }));
    }, [findFoldersByScope, indexSingleFile, removeFileFromIndex, isFileInIndexedFolder, fetchNodeName]);

    // Handle incoming tree event
    const handleTreeEvent = useCallback(
        async (event: DriveEvent) => {
            console.log('[DriveIndexingProvider] Received tree event:', event);

            // Add to pending events (keyed by nodeUid to deduplicate)
            const key = event.nodeUid || `${event.treeEventScopeId}-${event.name}-${Date.now()}`;
            pendingEventsRef.current.set(key, event);

            // Debounce processing
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            debounceTimerRef.current = setTimeout(() => {
                void processPendingEvents();
            }, EVENT_DEBOUNCE_MS);
        },
        [processPendingEvents]
    );

    // Set up event subscriptions for each indexed folder
    useEffect(() => {
        if (!isDriveInitialized) {
            return;
        }

        const activeFolders = indexedFolders.filter((f) => f.isActive !== false && f.treeEventScopeId);

        if (activeFolders.length === 0) {
            console.log('[DriveIndexingProvider] No indexed folders with treeEventScopeId, skipping subscription');
            return;
        }

        // Get unique treeEventScopeIds
        const scopeIds = new Set(activeFolders.map((f) => f.treeEventScopeId).filter(Boolean) as string[]);
        const currentSubscribedScopes = Array.from(subscriptionsRef.current.keys());

        // Check if we need to update subscriptions
        const needsUpdate =
            scopeIds.size !== currentSubscribedScopes.length ||
            !Array.from(scopeIds).every((id) => subscriptionsRef.current.has(id));

        if (!needsUpdate) {
            return;
        }

        console.log('[DriveIndexingProvider] Setting up tree event subscriptions for scopes:', Array.from(scopeIds));

        // Clean up old subscriptions
        for (const [scopeId, subscription] of subscriptionsRef.current.entries()) {
            if (!scopeIds.has(scopeId)) {
                console.log('[DriveIndexingProvider] Disposing old subscription for scope:', scopeId);
                subscription.dispose();
                subscriptionsRef.current.delete(scopeId);
            }
        }

        // Create new subscriptions
        const subscribeToNewScopes = async () => {
            const newScopes: string[] = [];

            for (const scopeId of scopeIds) {
                if (subscriptionsRef.current.has(scopeId)) {
                    newScopes.push(scopeId);
                    continue;
                }

                try {
                    console.log('[DriveIndexingProvider] Subscribing to tree events for scope:', scopeId);
                    const subscription = await subscribeToTreeEvents(scopeId, handleTreeEvent);
                    subscriptionsRef.current.set(scopeId, subscription);
                    newScopes.push(scopeId);
                    console.log('[DriveIndexingProvider] Successfully subscribed to scope:', scopeId);
                } catch (error) {
                    console.error('[DriveIndexingProvider] Failed to subscribe to scope:', scopeId, error);
                }
            }

            setSubscribedScopes(newScopes);
            setIsSubscribed(newScopes.length > 0);
        };

        void subscribeToNewScopes();

        return () => {
            // Clean up all subscriptions on unmount
            for (const [scopeId, subscription] of subscriptionsRef.current.entries()) {
                console.log('[DriveIndexingProvider] Disposing subscription for scope:', scopeId);
                subscription.dispose();
            }
            subscriptionsRef.current.clear();
            setSubscribedScopes([]);
            setIsSubscribed(false);

            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = null;
            }
        };
    }, [isDriveInitialized, indexedFolders, subscribeToTreeEvents, handleTreeEvent]);

    // Allow external components to signal indexing status (e.g., immediate indexing after upload)
    const setIndexingFile = useCallback((fileName: string | null) => {
        if (fileName) {
            setEventIndexingStatus((prev) => ({
                ...prev,
                isIndexing: true,
                currentFile: fileName,
            }));
        } else {
            setEventIndexingStatus((prev) => ({
                ...prev,
                isIndexing: false,
                currentFile: undefined,
                processedCount: 0,
                totalCount: 0,
            }));
        }
    }, []);

    // Allow external components to update indexing progress
    const setIndexingProgress = useCallback((processed: number, total: number, stage?: string) => {
        setEventIndexingStatus((prev) => ({
            ...prev,
            processedCount: processed,
            totalCount: total,
            isIndexing: true,
            ...(stage !== undefined && { stage }),
        }));
    }, []);

    // Reset indexing status to idle state
    const resetIndexingStatus = useCallback(() => {
        setEventIndexingStatus({
            isIndexing: false,
            processedCount: 0,
            totalCount: 0,
            currentFile: undefined,
            stage: undefined,
        });
    }, []);

    const value: DriveIndexingContextType = {
        isSubscribed,
        subscribedScopes,
        eventIndexingStatus,
        setIndexingFile,
        setIndexingProgress,
        resetIndexingStatus,
    };

    return <DriveIndexingContext.Provider value={value}>{children}</DriveIndexingContext.Provider>;
};

/**
 * Component for authenticated users only.
 * Only rendered when NOT in guest mode.
 */
const DriveIndexingProviderAuthenticated = ({ children }: DriveIndexingProviderProps) => {
    const [user] = useUser();

    // If user is not available, render with default context
    if (!user?.ID) {
        return <DriveIndexingContext.Provider value={DEFAULT_CONTEXT_VALUE}>{children}</DriveIndexingContext.Provider>;
    }

    // User is authenticated, render the full inner provider
    return <DriveIndexingProviderInner userId={user.ID}>{children}</DriveIndexingProviderInner>;
};

/**
 * Component that checks guest mode first before trying to use useUser.
 */
const DriveIndexingProviderWithUser = ({ children }: DriveIndexingProviderProps) => {
    const isGuest = useIsGuest();

    // In guest mode, skip useUser entirely and render with default context
    if (isGuest) {
        return <DriveIndexingContext.Provider value={DEFAULT_CONTEXT_VALUE}>{children}</DriveIndexingContext.Provider>;
    }

    // Not a guest, safe to use useUser
    return <DriveIndexingProviderAuthenticated>{children}</DriveIndexingProviderAuthenticated>;
};

/**
 * Error boundary to catch errors from useUser() in guest mode.
 * Falls back to rendering children with default (no-op) context.
 */
class DriveIndexingErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): { hasError: boolean } {
        return { hasError: true };
    }

    componentDidCatch(error: Error): void {
        console.warn('[DriveIndexingProvider] Error caught (likely guest mode):', error.message);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            // Fall back to passthrough provider with default values
            return (
                <DriveIndexingContext.Provider value={DEFAULT_CONTEXT_VALUE}>
                    {this.props.children}
                </DriveIndexingContext.Provider>
            );
        }
        return this.props.children;
    }
}

/**
 * Main provider component that handles guest mode gracefully.
 * Wrapped in an error boundary to catch errors from useUser() hook.
 */
export const DriveIndexingProvider = ({ children }: DriveIndexingProviderProps) => {
    return (
        <DriveIndexingErrorBoundary>
            <DriveIndexingProviderWithUser>{children}</DriveIndexingProviderWithUser>
        </DriveIndexingErrorBoundary>
    );
};

export const useDriveIndexing = (): DriveIndexingContextType => {
    const context = useContext(DriveIndexingContext);
    // Return default values if not within provider (e.g., in tests or before provider mounts)
    if (context === undefined) {
        return {
            isSubscribed: false,
            subscribedScopes: [],
            eventIndexingStatus: DEFAULT_EVENT_INDEXING_STATUS,
            setIndexingFile: noop,
            setIndexingProgress: noop,
            resetIndexingStatus: noop,
        };
    }
    return context;
};
