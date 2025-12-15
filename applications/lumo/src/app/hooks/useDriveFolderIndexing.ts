import { useCallback, useState } from 'react';

import { useUser } from '@proton/account/user/hooks';
import { NodeType } from '@proton/drive';

import type { IndexedDriveFolder } from '../redux/slices/lumoUserSettings';
import { useDriveIndexing } from '../providers/DriveIndexingProvider';
import { fileProcessingService } from '../services/fileProcessingService';
import { getMimeTypeFromExtension } from '../util/filetypes';
import { SearchService } from '../services/search/searchService';
import type { DriveDocument, FolderIndexingStatus } from '../types/documents';
import type { SpaceId } from '../types';
import { useDriveSDK, type DriveNode } from './useDriveSDK';
import { useLumoUserSettings } from './useLumoUserSettings';

interface IndexFolderOptions {
    spaceId?: string;
}

interface FileWithPath extends DriveNode {
    relativePath: string;
}

// Number of files to download in parallel
const PARALLEL_DOWNLOAD_LIMIT = 5;

interface UseDriveFolderIndexingReturn {
    indexedFolders: IndexedDriveFolder[];
    indexingStatus: FolderIndexingStatus | null;
    indexFolder: (
        folderUid: string,
        folderName: string,
        folderPath: string,
        options?: IndexFolderOptions
    ) => Promise<void>;
    /** Rehydrate all indexed folders. Pass validSpaceIds to skip folders linked to deleted spaces. */
    rehydrateFolders: (validSpaceIds?: Set<SpaceId>) => Promise<number>;
    removeIndexedFolder: (folderUid: string) => Promise<void>;
    removeIndexedFoldersBySpace: (spaceId: SpaceId) => Promise<void>;
    isIndexing: boolean;
    isFolderIndexed: (folderUid: string) => boolean;
}

export function useDriveFolderIndexing(): UseDriveFolderIndexingReturn {
    const [user] = useUser();
    const { browseFolderChildren, downloadFile } = useDriveSDK();
    const { lumoUserSettings, updateSettings } = useLumoUserSettings();
    const { setIndexingFile, setIndexingProgress, resetIndexingStatus, eventIndexingStatus } = useDriveIndexing();
    
    // Derive indexingStatus from the shared context eventIndexingStatus
    const indexingStatus: FolderIndexingStatus | null = eventIndexingStatus.isIndexing
        ? {
            folderId: '', // We don't track folderId in context, but it's not used by the banner
            status: 'indexing',
            progress: {
                indexed: eventIndexingStatus.processedCount,
                total: eventIndexingStatus.totalCount,
            },
            stage: eventIndexingStatus.stage,
        }
        : null;
    
    // Derive isIndexing from the shared context
    const isIndexing = eventIndexingStatus.isIndexing;

    const indexedFolders = lumoUserSettings.indexedDriveFolders || [];

    const isFolderIndexed = useCallback(
        (folderUid: string) => indexedFolders.some((folder) => folder.nodeUid === folderUid),
        [indexedFolders]
    );

    const removeIndexedFolder = useCallback(
        async (folderUid: string) => {
            try {
                const updatedFolders = indexedFolders.filter((f) => f.nodeUid !== folderUid);
                updateSettings({
                    indexedDriveFolders: updatedFolders,
                    _autoSave: true,
                });
                if (user?.ID) {
                    const searchService = SearchService.get(user.ID);
                    searchService.removeDocumentsByFolder(folderUid);
                }
            } catch (error) {
                console.error('Failed to remove indexed folder:', error);
            }
        },
        [indexedFolders, updateSettings, user?.ID]
    );

    const removeIndexedFoldersBySpace = useCallback(
        async (spaceId: SpaceId) => {
            try {
                console.log('[DriveIndexing] Removing indexed folders for space:', spaceId);
                const foldersToRemove = indexedFolders.filter((f) => f.spaceId === spaceId);
                if (foldersToRemove.length === 0) {
                    console.log('[DriveIndexing] No indexed folders found for space:', spaceId);
                    return;
                }

                const updatedFolders = indexedFolders.filter((f) => f.spaceId !== spaceId);
                updateSettings({
                    indexedDriveFolders: updatedFolders,
                    _autoSave: true,
                });

                if (user?.ID) {
                    const searchService = SearchService.get(user.ID);
                    // Remove documents from the search index for this space
                    searchService.removeDocumentsBySpace(spaceId);
                }

                console.log('[DriveIndexing] Removed', foldersToRemove.length, 'folders for space:', spaceId);
            } catch (error) {
                console.error('Failed to remove indexed folders for space:', error);
            }
        },
        [indexedFolders, updateSettings, user?.ID]
    );

    // Recursively collect all files from a folder and its subfolders
    const collectAllFiles = useCallback(
        async (folderUid: string, basePath: string): Promise<FileWithPath[]> => {
            const allFiles: FileWithPath[] = [];

            try {
                const children = await browseFolderChildren(folderUid);

                for (const child of children) {
                    if (child.type === NodeType.File) {
                        allFiles.push({
                            ...child,
                            relativePath: basePath ? `${basePath}/${child.name}` : child.name,
                        });
                    } else if (child.type === NodeType.Folder) {
                        // Recursively get files from subfolder
                        const subfolderPath = basePath ? `${basePath}/${child.name}` : child.name;
                        const subfolderFiles = await collectAllFiles(child.nodeUid, subfolderPath);
                        allFiles.push(...subfolderFiles);
                    }
                }
            } catch (error) {
                console.error(`[DriveIndexing] Failed to collect files from folder ${folderUid}:`, error);
            }

            return allFiles;
        },
        [browseFolderChildren]
    );

    const indexFolder = useCallback(
        async (folderUid: string, folderName: string, folderPath: string, options?: IndexFolderOptions) => {
            if (!user?.ID) return;

            const { spaceId } = options || {};

            setIndexingFile(folderName); // Signal to context that indexing started
            setIndexingProgress(0, 0, 'Preparing...');

            try {
                // Recursively collect all files from the folder and its subfolders
                console.log('[DriveIndexing] Collecting files recursively from folder:', folderName);
                const allFiles = await collectAllFiles(folderUid, '');

                // Get treeEventScopeId from first file or subfolder in the folder
                let treeEventScopeId: string | undefined;
                if (allFiles.length > 0 && allFiles[0].treeEventScopeId) {
                    treeEventScopeId = allFiles[0].treeEventScopeId;
                    console.log('[DriveIndexing] Captured treeEventScopeId:', treeEventScopeId);
                }

                console.log('[DriveIndexing] Found', allFiles.length, 'total files in folder tree');

                setIndexingProgress(0, allFiles.length);

                const documents: DriveDocument[] = [];
                let processedCount = 0;

                // Process files in parallel batches
                const processFile = async (file: FileWithPath): Promise<DriveDocument | null> => {
                    try {
                        console.log(`[DriveIndexing] Downloading: ${file.relativePath}`);
                        const fileContent = await downloadFile(file.nodeUid);
                        const fileData = new Uint8Array(fileContent);
                        const inferredMime =
                            file.mediaType || getMimeTypeFromExtension(file.name) || 'application/octet-stream';
                        const fileObj = new File([fileData], file.name, { type: inferredMime });

                        console.log(`[DriveIndexing] Processing: ${file.relativePath}`);
                        const result = await fileProcessingService.processFile(fileObj);
                        if (result.success && result.result) {
                            return {
                                id: file.nodeUid,
                                name: file.name,
                                content: result.result.convertedContent,
                                mimeType: inferredMime,
                                size: file.size || fileData.byteLength || 0,
                                modifiedTime: file.modifiedTime?.getTime() || Date.now(),
                                folderId: folderUid,
                                folderPath: `${folderPath}/${file.relativePath}`.replace(/\/[^/]+$/, ''),
                                spaceId,
                            };
                        }
                        return null;
                    } catch (error) {
                        console.error(`[DriveIndexing] Failed to process file ${file.relativePath}:`, error);
                        return null;
                    }
                };

                // Process in batches of PARALLEL_DOWNLOAD_LIMIT
                for (let i = 0; i < allFiles.length; i += PARALLEL_DOWNLOAD_LIMIT) {
                    const batch = allFiles.slice(i, i + PARALLEL_DOWNLOAD_LIMIT);
                    const batchNum = Math.floor(i / PARALLEL_DOWNLOAD_LIMIT) + 1;
                    const totalBatches = Math.ceil(allFiles.length / PARALLEL_DOWNLOAD_LIMIT);
                    const batchEndIndex = Math.min(i + PARALLEL_DOWNLOAD_LIMIT, allFiles.length);
                    
                    console.log(`[DriveIndexing] Processing batch ${batchNum}/${totalBatches} (${batch.length} files)`);
                    
                    // Show progress as "processing files X to Y"
                    setIndexingProgress(i, allFiles.length, `Downloading files ${i + 1}-${batchEndIndex} of ${allFiles.length}`);

                    // Yield to allow UI to update
                    await new Promise(resolve => setTimeout(resolve, 0));

                    // Download and process batch in parallel
                    const batchResults = await Promise.all(batch.map(processFile));
                    
                    // Collect successful results
                    for (const doc of batchResults) {
                        if (doc) {
                            documents.push(doc);
                        }
                        processedCount++;
                    }

                    setIndexingProgress(processedCount, allFiles.length, `Processed ${processedCount}/${allFiles.length} files`);
                }

                const documentsWithContent = documents.filter((d) => d.content && d.content.length > 0);
                if (documentsWithContent.length > 0) {
                    const searchService = SearchService.get(user.ID);
                    const result = await searchService.indexDocuments(documentsWithContent);
                    if (!result.success) {
                        throw new Error(result.error || 'Indexing failed');
                    }
                }

                const indexedFolder: IndexedDriveFolder = {
                    id: folderUid,
                    nodeUid: folderUid,
                    name: folderName,
                    path: folderPath,
                    spaceId,
                    indexedAt: Date.now(),
                    documentCount: documentsWithContent.length,
                    isActive: true,
                    treeEventScopeId,
                };

                const updatedFolders = indexedFolders.filter((f) => f.nodeUid !== folderUid);
                updatedFolders.push(indexedFolder);

                updateSettings({
                    indexedDriveFolders: updatedFolders,
                    _autoSave: true,
                });

                console.log('[DriveIndexing] Indexing complete:', documentsWithContent.length, 'documents indexed');
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                // If folder is missing/forbidden, clean it up
                if (message.toLowerCase().includes('not found') || message.toLowerCase().includes('404')) {
                    await removeIndexedFolder(folderUid);
                }
                console.error('[DriveIndexing] Failed to index folder:', error);
            } finally {
                // Always reset the indexing status to idle state
                resetIndexingStatus();
            }
        },
        [user?.ID, collectAllFiles, downloadFile, indexedFolders, updateSettings, removeIndexedFolder, setIndexingFile, setIndexingProgress, resetIndexingStatus]
    );

    const rehydrateFolders = useCallback(
        async (validSpaceIds?: Set<SpaceId>): Promise<number> => {
            let folders = (lumoUserSettings.indexedDriveFolders || []).filter((f) => f.isActive !== false);

            // If validSpaceIds is provided, filter out folders linked to deleted spaces
            if (validSpaceIds) {
                const before = folders.length;
                folders = folders.filter((f) => !f.spaceId || validSpaceIds.has(f.spaceId as SpaceId));
                if (folders.length < before) {
                    console.log('[DriveIndexing] Skipped', before - folders.length, 'folders linked to deleted spaces');
                }
            }

            console.log('[DriveIndexing] Rehydrate folders - count', folders.length);
            if (!folders.length) {
                console.warn('[DriveIndexing] Rehydrate folders - no active folders found');
                return 0;
            }
            let processed = 0;
            for (const folder of folders) {
                try {
                    console.log('[DriveIndexing] Rehydrate folder', {
                        nodeUid: folder.nodeUid,
                        name: folder.name,
                        path: folder.path,
                        spaceId: folder.spaceId,
                    });
                    await indexFolder(folder.nodeUid, folder.name || folder.path || '', folder.path || folder.name || '', {
                        spaceId: folder.spaceId,
                    });
                    processed += 1;
                } catch (error) {
                    console.error('[DriveIndexing] Rehydrate failed for folder', folder.nodeUid, error);
                }
            }
            return processed;
        },
        [lumoUserSettings.indexedDriveFolders, indexFolder]
    );

    // Note: Drive event subscription is handled by DriveIndexingProvider at the app level
    // to ensure events are received even when this hook is not mounted

    return {
        indexedFolders,
        indexingStatus,
        indexFolder,
        rehydrateFolders,
        removeIndexedFolder,
        removeIndexedFoldersBySpace,
        isIndexing,
        isFolderIndexed,
    };
}
