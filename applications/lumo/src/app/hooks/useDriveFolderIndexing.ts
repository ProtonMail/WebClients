import { useCallback } from 'react';

import { useUser } from '@proton/account/user/hooks';

import { useDriveIndexing } from '../providers/DriveIndexingProvider';
import {
    cancelFolderIndexing,
    clearFolderIndexingCancellation,
    isFolderIndexingCancelled,
} from '../services/driveFolderIndexingState';
import type { IndexedDriveFolder } from '../redux/slices/lumoUserSettings';
import { removeIndexedContentForSpace } from '../services/removeIndexedContentForSpace';
import { SearchService } from '../services/search/searchService';
import type { SpaceId } from '../types';
import type { DriveDocument, FolderIndexingStatus } from '../types/documents';
import { collectDriveFolderFiles, type DriveFileWithPath } from '../util/collectDriveFolderFiles';
import { getMimeTypeFromExtension, isFileTypeSupported } from '../util/filetypes';
import { useDriveSDK } from './useDriveSDK';
import { useFileProcessing } from './useFileProcessing';
import { useLumoUserSettings } from './useLumoUserSettings';
import { useLumoStore } from '../redux/hooks';

interface IndexFolderOptions {
    spaceId?: string;
}

const PARALLEL_DOWNLOAD_LIMIT = 5;

export const MAX_INDEXABLE_FILES = 200;

interface IndexFolderResult {
    success: boolean;
    totalFiles: number;
    indexedFiles: number;
    skippedFiles: number;
    limitExceeded: boolean;
}

interface UseDriveFolderIndexingReturn {
    indexedFolders: IndexedDriveFolder[];
    indexingStatus: FolderIndexingStatus | null;
    indexFolder: (
        folderUid: string,
        folderName: string,
        folderPath: string,
        options?: IndexFolderOptions
    ) => Promise<IndexFolderResult>;
    /** Rehydrate all indexed folders. Pass validSpaceIds to skip folders linked to deleted spaces. */
    rehydrateFolders: (validSpaceIds?: Set<SpaceId>) => Promise<number>;
    removeIndexedFolder: (folderUid: string) => Promise<void>;
    removeIndexedFoldersBySpace: (spaceId: SpaceId) => Promise<void>;
    isIndexing: boolean;
    isFolderIndexed: (folderUid: string) => boolean;
}

export function useDriveFolderIndexing(): UseDriveFolderIndexingReturn {
    const [user] = useUser();
    const store = useLumoStore();
    const { browseFolderChildren, downloadFile } = useDriveSDK();
    const { lumoUserSettings, updateSettings } = useLumoUserSettings();
    const {
        setIndexingFile,
        setIndexingProgress,
        resetIndexingStatus,
        eventIndexingStatus,
        bumpDriveIndexRevision,
    } = useDriveIndexing();
    const fileProcessingService = useFileProcessing();

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
                cancelFolderIndexing(folderUid);
                resetIndexingStatus();

                const latestFolders = store.getState().lumoUserSettings.indexedDriveFolders || [];
                const updatedFolders = latestFolders.filter((f) => f.nodeUid !== folderUid);
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
        [resetIndexingStatus, store, updateSettings, user?.ID]
    );

    const removeIndexedFoldersBySpace = useCallback(
        async (spaceId: SpaceId) => {
            try {
                removeIndexedContentForSpace(spaceId, user?.ID, { documentScope: 'drive-only' });
                resetIndexingStatus();
            } catch (error) {
                console.error('Failed to remove indexed folders for space:', error);
            }
        },
        [resetIndexingStatus, user?.ID]
    );

    const indexFolder = useCallback(
        async (
            folderUid: string,
            folderName: string,
            folderPath: string,
            options?: IndexFolderOptions
        ): Promise<IndexFolderResult> => {
            if (!user?.ID) {
                return {
                    success: false,
                    totalFiles: 0,
                    indexedFiles: 0,
                    skippedFiles: 0,
                    limitExceeded: false,
                };
            }

            const { spaceId } = options || {};
            const searchService = SearchService.get(user.ID);

            clearFolderIndexingCancellation(folderUid);
            setIndexingFile(folderName);
            setIndexingProgress(0, 0, 'Preparing...');

            const persistFolderMetadata = (
                documentCount: number,
                treeEventScopeId?: string,
                {
                    incomplete = false,
                    indexedAt = Date.now(),
                }: { incomplete?: boolean; indexedAt?: number } = {}
            ): void => {
                const latestFolders = store.getState().lumoUserSettings.indexedDriveFolders || [];
                const existing = latestFolders.find((f) => f.nodeUid === folderUid);

                const indexedFolder: IndexedDriveFolder = {
                    id: folderUid,
                    nodeUid: folderUid,
                    name: folderName,
                    path: folderPath,
                    spaceId,
                    indexedAt,
                    documentCount,
                    isActive: true,
                    incomplete,
                    treeEventScopeId: treeEventScopeId || existing?.treeEventScopeId,
                };

                const updatedFolders = latestFolders.filter((f) => f.nodeUid !== folderUid);
                updatedFolders.push(indexedFolder);

                updateSettings({
                    indexedDriveFolders: updatedFolders,
                    _autoSave: true,
                });
            };

            try {
                console.log('[DriveIndexing] Collecting files recursively from folder:', folderName);
                const { files: allFiles, treeEventScopeId } = await collectDriveFolderFiles(
                    folderUid,
                    browseFolderChildren
                );

                if (treeEventScopeId) {
                    console.log('[DriveIndexing] Captured treeEventScopeId:', treeEventScopeId);
                }

                const indexableFiles = allFiles.filter((file) => {
                    const mimeType = file.mediaType || getMimeTypeFromExtension(file.name);
                    return isFileTypeSupported(file.name, mimeType);
                });

                console.log(
                    '[DriveIndexing] Found',
                    allFiles.length,
                    'total files,',
                    indexableFiles.length,
                    'indexable files in folder tree'
                );

                const totalIndexableFiles = indexableFiles.length;
                const limitExceeded = totalIndexableFiles > MAX_INDEXABLE_FILES;
                const filesToProcess = limitExceeded ? indexableFiles.slice(0, MAX_INDEXABLE_FILES) : indexableFiles;
                const skippedFiles = limitExceeded ? totalIndexableFiles - MAX_INDEXABLE_FILES : 0;

                if (limitExceeded) {
                    console.warn(
                        `[DriveIndexing] File limit exceeded. Indexing first ${MAX_INDEXABLE_FILES} of ${totalIndexableFiles} indexable files. ${skippedFiles} files will be skipped.`
                    );
                }

                // Register the folder immediately so subscriptions and UI can react while indexing
                // runs. Re-indexing keeps the previous counts so a run that never finishes doesn't
                // leave the folder looking freshly indexed with zero documents.
                const previousFolder = (store.getState().lumoUserSettings.indexedDriveFolders || []).find(
                    (f) => f.nodeUid === folderUid
                );
                const previousDocumentCount = previousFolder?.documentCount || 0;

                persistFolderMetadata(previousDocumentCount, treeEventScopeId, {
                    incomplete: true,
                    indexedAt: previousFolder?.indexedAt,
                });
                bumpDriveIndexRevision();

                setIndexingProgress(0, filesToProcess.length);

                let indexedFilesCount = 0;
                let processedCount = 0;

                const processFile = async (file: DriveFileWithPath): Promise<DriveDocument | null> => {
                    try {
                        console.log(`[DriveIndexing] Downloading: ${file.relativePath}`);
                        const fileContent = await downloadFile(file.nodeUid);
                        const fileData = new Uint8Array(fileContent);
                        const inferredMime =
                            file.mediaType || getMimeTypeFromExtension(file.name) || 'application/octet-stream';
                        const fileObj = new File([fileData], file.name, { type: inferredMime });

                        console.log(`[DriveIndexing] Processing: ${file.relativePath}`);
                        const result = await fileProcessingService.processFile(fileObj);
                        if (result.type === 'text') {
                            return {
                                id: file.nodeUid,
                                name: file.name,
                                content: result.content,
                                mimeType: inferredMime,
                                size: file.size || fileData.byteLength || 0,
                                modifiedTime: file.modifiedTime?.getTime() || Date.now(),
                                folderId: folderUid,
                                folderPath: `${folderPath}/${file.relativePath}`.replace(/\/[^/]+$/, ''),
                                spaceId,
                            };
                        } else if (result.type === 'error') {
                            console.warn(
                                `[DriveIndexing] File processing failed for ${file.relativePath}: ${result.message}`
                            );
                        } else {
                            console.log(
                                `[DriveIndexing] Skipping indexing for ${file.relativePath} (type '${result.type}')`
                            );
                        }
                        return null;
                    } catch (error) {
                        console.error(`[DriveIndexing] Failed to process file ${file.relativePath}:`, error);
                        return null;
                    }
                };

                for (let i = 0; i < filesToProcess.length; i += PARALLEL_DOWNLOAD_LIMIT) {
                    if (isFolderIndexingCancelled(folderUid)) {
                        console.log('[DriveIndexing] Indexing cancelled for folder:', folderName);
                        // Previously indexed documents are still in the search index, so keep the
                        // higher count and flag the folder so it can be resumed later.
                        persistFolderMetadata(
                            Math.max(indexedFilesCount, previousDocumentCount),
                            treeEventScopeId,
                            { incomplete: true }
                        );
                        bumpDriveIndexRevision();
                        return {
                            success: false,
                            totalFiles: totalIndexableFiles,
                            indexedFiles: indexedFilesCount,
                            skippedFiles,
                            limitExceeded,
                        };
                    }

                    const batch = filesToProcess.slice(i, i + PARALLEL_DOWNLOAD_LIMIT);
                    const batchNum = Math.floor(i / PARALLEL_DOWNLOAD_LIMIT) + 1;
                    const totalBatches = Math.ceil(filesToProcess.length / PARALLEL_DOWNLOAD_LIMIT);
                    const batchEndIndex = Math.min(i + PARALLEL_DOWNLOAD_LIMIT, filesToProcess.length);

                    console.log(`[DriveIndexing] Processing batch ${batchNum}/${totalBatches} (${batch.length} files)`);

                    setIndexingProgress(
                        processedCount,
                        filesToProcess.length,
                        `Downloading files ${i + 1}-${batchEndIndex} of ${filesToProcess.length}`
                    );

                    await new Promise((resolve) => setTimeout(resolve, 0));

                    const batchResults = await Promise.all(batch.map(processFile));
                    const batchDocuments = batchResults.filter(
                        (doc): doc is DriveDocument => doc !== null && !!doc.content && doc.content.length > 0
                    );

                    if (batchDocuments.length > 0) {
                        const result = await searchService.indexDocuments(batchDocuments);
                        if (!result.success) {
                            throw new Error(result.error || 'Indexing failed');
                        }
                        indexedFilesCount += batchDocuments.length;
                        persistFolderMetadata(
                            Math.max(indexedFilesCount, previousDocumentCount),
                            treeEventScopeId,
                            { incomplete: true }
                        );
                        bumpDriveIndexRevision();
                    }

                    processedCount += batch.length;

                    setIndexingProgress(
                        processedCount,
                        filesToProcess.length,
                        `Indexed ${indexedFilesCount}/${filesToProcess.length} files`
                    );
                }

                persistFolderMetadata(indexedFilesCount, treeEventScopeId);

                console.log('[DriveIndexing] Indexing complete:', indexedFilesCount, 'documents indexed');

                return {
                    success: true,
                    totalFiles: totalIndexableFiles,
                    indexedFiles: indexedFilesCount,
                    skippedFiles,
                    limitExceeded,
                };
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                if (message.toLowerCase().includes('not found') || message.toLowerCase().includes('404')) {
                    await removeIndexedFolder(folderUid);
                }
                console.error('[DriveIndexing] Failed to index folder:', error);

                return {
                    success: false,
                    totalFiles: 0,
                    indexedFiles: 0,
                    skippedFiles: 0,
                    limitExceeded: false,
                };
            } finally {
                clearFolderIndexingCancellation(folderUid);
                resetIndexingStatus();
            }
        },
        [
            user?.ID,
            browseFolderChildren,
            downloadFile,
            fileProcessingService,
            store,
            updateSettings,
            removeIndexedFolder,
            setIndexingFile,
            setIndexingProgress,
            resetIndexingStatus,
            bumpDriveIndexRevision,
        ]
    );

    const rehydrateFolders = useCallback(
        async (validSpaceIds?: Set<SpaceId>): Promise<number> => {
            let folders = (lumoUserSettings.indexedDriveFolders || []).filter((f) => f.isActive !== false);

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
                    await indexFolder(
                        folder.nodeUid,
                        folder.name || folder.path || '',
                        folder.path || folder.name || '',
                        {
                            spaceId: folder.spaceId,
                        }
                    );
                    processed += 1;
                } catch (error) {
                    console.error('[DriveIndexing] Rehydrate failed for folder', folder.nodeUid, error);
                }
            }
            return processed;
        },
        [lumoUserSettings.indexedDriveFolders, indexFolder]
    );

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
