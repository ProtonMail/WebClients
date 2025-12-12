import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { NodeType } from '@proton/drive';

import type { IndexedDriveFolder } from '../redux/slices/lumoUserSettings';
import { fileProcessingService } from '../services/fileProcessingService';
import { getMimeTypeFromExtension } from '../util/filetypes';
import { SearchService } from '../services/search/searchService';
import type { DriveDocument } from '../types/documents';
import { useDriveSDK, type DriveEvent, type DriveNode, type EventSubscription } from '../hooks/useDriveSDK';
import { useLumoUserSettings } from '../hooks';

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
}

interface DriveIndexingContextType {
    isSubscribed: boolean;
    subscribedScopes: string[];
    eventIndexingStatus: EventIndexingStatus;
    setIndexingFile: (fileName: string | null) => void;
    setIndexingProgress: (processed: number, total: number) => void;
}

const DriveIndexingContext = createContext<DriveIndexingContextType | undefined>(undefined);

interface DriveIndexingProviderProps {
    children: ReactNode;
}

export const DriveIndexingProvider = ({ children }: DriveIndexingProviderProps) => {
    const [user] = useUser();
    const { browseFolderChildren, downloadFile, subscribeToTreeEvents, isInitialized: isDriveInitialized } = useDriveSDK();
    const { lumoUserSettings, updateSettings } = useLumoUserSettings();
    const [isSubscribed, setIsSubscribed] = useState(false);
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

    // Keep indexed folders in a ref so callbacks can access latest value
    const indexedFoldersRef = useRef<IndexedDriveFolder[]>(indexedFolders);
    useEffect(() => {
        indexedFoldersRef.current = indexedFolders;
    }, [indexedFolders]);

    // Find the indexed folder for a given treeEventScopeId
    const findFolderByScope = useCallback((treeEventScopeId: string): IndexedDriveFolder | null => {
        return (
            indexedFoldersRef.current.find(
                (f) => f.isActive !== false && f.treeEventScopeId === treeEventScopeId
            ) || null
        );
    }, []);

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
            if (!user?.ID) return;

            const searchService = SearchService.get(user.ID);

            // For new files (not updates), check if already indexed (e.g., indexed immediately after upload)
            if (!isUpdate && searchService.hasDocument(fileNodeUid)) {
                console.log('[DriveIndexingProvider] File already indexed, skipping download:', fileName);
                return;
            }

            console.log('[DriveIndexingProvider] Indexing single file:', fileName, fileNodeUid, isUpdate ? '(update)' : '(new)');

            // Update status to show we're indexing
            setEventIndexingStatus(prev => ({
                ...prev,
                isIndexing: true,
                currentFile: fileName,
            }));

            // Yield to event loop to allow React to render the banner
            await new Promise(resolve => setTimeout(resolve, 0));

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
                if (result.success && result.result) {
                    const document: DriveDocument = {
                        id: fileNodeUid,
                        name: fileName,
                        content: result.result.convertedContent,
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
                                    f.nodeUid === folder.nodeUid
                                        ? { ...f, indexedAt: Date.now() }
                                        : f
                                );
                                updateSettings({
                                    indexedDriveFolders: updatedFolders,
                                    _autoSave: true,
                                });
                            }
                        }
                    }
                }

                // Update status - file processed
                setEventIndexingStatus(prev => ({
                    ...prev,
                    processedCount: prev.processedCount + 1,
                    isIndexing: prev.processedCount + 1 < prev.totalCount, // Still indexing if more to process
                    currentFile: prev.processedCount + 1 < prev.totalCount ? prev.currentFile : undefined,
                }));
            } catch (error) {
                console.error('[DriveIndexingProvider] Failed to index file:', fileName, error);
                // Reset status on error
                setEventIndexingStatus(prev => ({
                    ...prev,
                    isIndexing: false,
                    currentFile: undefined,
                }));
            }
        },
        [user?.ID, downloadFile, updateSettings]
    );

    // Remove a file from the index
    const removeFileFromIndex = useCallback(
        async (folder: IndexedDriveFolder, fileNodeUid: string) => {
            if (!user?.ID) return;

            console.log('[DriveIndexingProvider] Removing file from index:', fileNodeUid);

            try {
                const searchService = SearchService.get(user.ID);
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
        [user?.ID, updateSettings]
    );

    // Process pending events (debounced)
    const processPendingEvents = useCallback(async () => {
        const events = Array.from(pendingEventsRef.current.values());
        pendingEventsRef.current.clear();

        if (events.length === 0) return;

        console.log('[DriveIndexingProvider] Processing', events.length, 'pending events');

        // Update pending count for status tracking
        setEventIndexingStatus(prev => ({
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

                console.log('[DriveIndexingProvider] Processing event:', {
                    eventType,
                    nodeType,
                    nodeUid,
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

                // Find the indexed folder for this event
                const indexedFolder = findFolderByScope(treeEventScopeId);
                if (!indexedFolder) {
                    console.log('[DriveIndexingProvider] Event not for an indexed folder scope:', treeEventScopeId);
                    continue;
                }

                console.log('[DriveIndexingProvider] Event is for indexed folder:', indexedFolder.name);

                // Handle delete events OR trashed items (node_updated with isTrashed: true)
                if (eventType === DriveEventType.NodeDeleted || isTrashed === true) {
                    if (nodeUid) {
                        console.log('[DriveIndexingProvider] Processing node deletion/trash:', nodeUid, isTrashed ? '(trashed)' : '(deleted)');
                        await removeFileFromIndex(indexedFolder, nodeUid);
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

                // Handle create/update events
                if (eventType === DriveEventType.NodeCreated || eventType === DriveEventType.NodeUpdated) {
                    if (nodeUid) {
                        // If we don't have the fileName, we need to fetch node details
                        const finalFileName = fileName || await fetchNodeName(nodeUid, indexedFolder.nodeUid);
                        if (finalFileName) {
                            const isUpdate = eventType === DriveEventType.NodeUpdated;
                            await indexSingleFile(indexedFolder, nodeUid, finalFileName, isUpdate);
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
        setEventIndexingStatus(prev => ({
            ...prev,
            isIndexing: false,
            currentFile: undefined,
            processedCount: 0,
            totalCount: 0,
        }));
    }, [findFolderByScope, indexSingleFile, removeFileFromIndex]);

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
        if (!isDriveInitialized || !user?.ID) {
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
    }, [isDriveInitialized, user?.ID, indexedFolders, subscribeToTreeEvents, handleTreeEvent]);

    // Allow external components to signal indexing status (e.g., immediate indexing after upload)
    const setIndexingFile = useCallback((fileName: string | null) => {
        if (fileName) {
            setEventIndexingStatus(prev => ({
                ...prev,
                isIndexing: true,
                currentFile: fileName,
            }));
        } else {
            setEventIndexingStatus(prev => ({
                ...prev,
                isIndexing: false,
                currentFile: undefined,
                processedCount: 0,
                totalCount: 0,
            }));
        }
    }, []);

    // Allow external components to update indexing progress
    const setIndexingProgress = useCallback((processed: number, total: number) => {
        setEventIndexingStatus(prev => ({
            ...prev,
            processedCount: processed,
            totalCount: total,
        }));
    }, []);

    const value: DriveIndexingContextType = {
        isSubscribed,
        subscribedScopes,
        eventIndexingStatus,
        setIndexingFile,
        setIndexingProgress,
    };

    return <DriveIndexingContext.Provider value={value}>{children}</DriveIndexingContext.Provider>;
};

const DEFAULT_EVENT_INDEXING_STATUS: EventIndexingStatus = {
    isIndexing: false,
    processedCount: 0,
    totalCount: 0,
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

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
        };
    }
    return context;
};
