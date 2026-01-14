import { useCallback, useEffect, useRef, useState } from 'react';

import type { Editor } from '@tiptap/react';
import { c } from 'ttag';

import { useNotifications } from '@proton/components';

import { useFileProcessing } from '../../../../hooks/useFileProcessing';
import { getApproximateTokenCount } from '../../../../llm/tokenizer';
import { useIsGuest } from '../../../../providers/IsGuestProvider';
import { useLumoDispatch, useLumoSelector } from '../../../../redux/hooks';
import {
    selectAttachments,
    selectAttachmentsBySpaceId,
    selectProvisionalAttachments,
    selectSpaceByIdOptional,
} from '../../../../redux/selectors';
import { newAttachmentId, upsertAttachment } from '../../../../redux/slices/core/attachments';
import { SearchService } from '../../../../services/search/searchService';
import type { Attachment, Message, ProjectSpace, SpaceId } from '../../../../types';
import { getMimeTypeFromExtension } from '../../../../util/filetypes';

export interface FileMentionState {
    isActive: boolean;
    query: string;
    position: { top: number; left: number } | null;
    selectedIndex: number;
}

export type FileItem = {
    id: string;
    name: string;
    source: 'local' | 'drive';
    attachment?: Attachment;
    mimeType?: string;
};

// Optional Drive SDK functions - passed from parent to avoid calling useDriveSDK for guests
export interface DriveSDKFunctions {
    browseFolderChildren: (folderId?: string) => Promise<{ id: string; name: string; type: string }[]>;
    downloadFile: (nodeId: string) => Promise<ArrayBuffer>;
}

// Stable empty array reference
const EMPTY_FILES: FileItem[] = [];

const INITIAL_MENTION_STATE: FileMentionState = {
    isActive: false,
    query: '',
    position: null,
    selectedIndex: 0,
};

/**
 * Computes the list of available files from space attachments and drive files.
 */
function computeFileList(
    spaceAttachments: Record<string, any>,
    driveFiles: { id: string; name: string }[],
    allAttachments: Record<string, Attachment>,
    provisionalAttachments: Attachment[]
): FileItem[] {
    const provisionalFiles: FileItem[] = provisionalAttachments
        .filter((attachment) => attachment && !attachment.error && !attachment.processing)
        .map((attachment) => ({
            id: attachment.id,
            name: attachment.filename,
            source: 'local' as const,
            attachment,
            mimeType: attachment.mimeType,
        }));

    
    const spaceFiles: FileItem[] = Object.values(spaceAttachments)
        .filter((attachment) => {
            // Only include attachments that:
            // 1. Exist in the attachments map (not deleted)
            // 2. Don't have errors or are processing
            // 3. Are not auto-retrieved
            const existsInStore = attachment && allAttachments[attachment.id];
            return existsInStore && !attachment.error && !attachment.processing && !attachment.autoRetrieved;
        })
        .map((file) => {
            const attachment = allAttachments[file.id];
            return {
                id: file.id,
                name: file.filename,
                source: 'local' as const,
                attachment,
                mimeType: file.mimeType || attachment?.mimeType,
            };
        });

    // Drive files
    const driveFilesList: FileItem[] = driveFiles.map((file) => ({
        id: file.id,
        name: file.name,
        source: 'drive' as const,
        mimeType: undefined,
    }));

    const allFilesCombined = [...provisionalFiles, ...spaceFiles, ...driveFilesList];
    
    const seen = new Set<string>();
    const uniqueFiles = allFilesCombined.filter((file) => {
        const key = file.name.toLowerCase();
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });

    return uniqueFiles;
}

/**
 * Filters files by query string
 */
function filterFiles(files: FileItem[], query: string, limit: number = 10): FileItem[] {
    if (!query) {
        return files.length <= limit ? files : files.slice(0, limit);
    }

    const lowerQuery = query.toLowerCase();
    const filtered = files.filter((file) => file.name.toLowerCase().includes(lowerQuery));
    return filtered.length <= limit ? filtered : filtered.slice(0, limit);
}

/**
 * Creates a stable cache key from the file-related dependencies
 */
function createFileCacheKey(
    spaceAttachments: Record<string, any>,
    driveFiles: { id: string; name: string }[],
    provisionalAttachments: Attachment[],
    allAttachments: Record<string, Attachment>
): string {
    const attachmentIds = Object.keys(spaceAttachments).sort().join(',');
    // Include allAttachments keys to detect deletions
    const allAttachmentIds = Object.keys(allAttachments).sort().join(',');
    const driveIds = driveFiles
        .map((f) => `${f.id}:${f.name}`)
        .sort()
        .join(',');
    const provisionalNames = provisionalAttachments
        .map((att) => att.filename.toLowerCase())
        .sort()
        .join(',');
    return `${attachmentIds}|${allAttachmentIds}|${driveIds}|${provisionalNames}`;
}

export const useFileMentionAutocomplete = (
    editor: Editor | null,
    spaceId?: SpaceId,
    messageChain: Message[] = [],
    driveSDK?: DriveSDKFunctions, // Optional - only provided for authenticated users
    onDriveFilesRefresh?: () => void, // Optional callback when drive files are refreshed
    userId?: string // Optional - only provided for authenticated users
): {
    mentionState: FileMentionState;
    files: FileItem[];
    selectFile: (file: FileItem) => void;
    closeMention: () => void;
    refreshDriveFiles: () => Promise<void>;
} => {
    const [mentionState, setMentionState] = useState<FileMentionState>(INITIAL_MENTION_STATE);
    const isGuest = useIsGuest();
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const fileProcessingService = useFileProcessing();
    const space = useLumoSelector(selectSpaceByIdOptional(spaceId));
    const spaceProject = space?.isProject ? (space satisfies ProjectSpace) : undefined;
    const linkedDriveFolder = spaceProject?.linkedDriveFolder;
    const allAttachments = useLumoSelector(selectAttachments);
    const provisionalAttachments = useLumoSelector(selectProvisionalAttachments);

    const spaceAttachments = useLumoSelector(selectAttachmentsBySpaceId(spaceId));

    // Drive files state
    const [driveFiles, setDriveFiles] = useState<{ id: string; name: string }[]>([]);
    const driveFilesLoadedRef = useRef(false);

    // Cache for computed files
    const filesCacheRef = useRef<{ key: string; files: FileItem[] }>({ key: '', files: EMPTY_FILES });

    // Clear drive files when folder is unlinked
    useEffect(() => {
        if (!linkedDriveFolder) {
            setDriveFiles([]);
            driveFilesLoadedRef.current = false;
            // Clear the file cache as well
            filesCacheRef.current = { key: '', files: EMPTY_FILES };
        }
    }, [linkedDriveFolder]);

    // Recursive function to load all files from a folder and its subfolders
    const loadDriveFilesRecursively = useCallback(
        async (folderId: string, path: string = ''): Promise<{ id: string; name: string; path: string }[]> => {
            if (!driveSDK) return [];

            try {
                const children = await driveSDK.browseFolderChildren(folderId);
                const allFiles: { id: string; name: string; path: string }[] = [];

                for (const child of children) {
                    const childPath = path ? `${path}/${child.name}` : child.name;

                    if (child.type === 'file') {
                        allFiles.push({
                            id: child.id,
                            name: child.name,
                            path: childPath,
                        });
                    } else if (child.type === 'folder') {
                        // Recursively load files from subfolders
                        const subFiles = await loadDriveFilesRecursively(child.id, childPath);
                        allFiles.push(...subFiles);
                    }
                }

                return allFiles;
            } catch (error) {
                console.error(`Failed to load Drive files from folder ${folderId}:`, error);
                return [];
            }
        },
        [driveSDK]
    );

    // Load Drive files (with refresh capability)
    const refreshDriveFiles = useCallback(async () => {
        if (!linkedDriveFolder || !driveSDK) return;

        try {
            const allFiles = await loadDriveFilesRecursively(linkedDriveFolder.folderId);
            const files = allFiles.map((file) => ({
                id: file.id,
                name: file.path, // Use full path as name for better identification
            }));
            setDriveFiles(files);
            driveFilesLoadedRef.current = true;

            // Call the refresh callback if provided
            onDriveFilesRefresh?.();
        } catch (error) {
            console.error('Failed to load Drive files for autocomplete:', error);
        }
    }, [linkedDriveFolder, driveSDK, loadDriveFilesRecursively, onDriveFilesRefresh]);

    // Initial load of Drive files
    useEffect(() => {
        if (!linkedDriveFolder || driveFilesLoadedRef.current || !driveSDK) return;
        void refreshDriveFiles();
    }, [linkedDriveFolder, driveSDK, refreshDriveFiles]);

    // Compute files with manual caching
    const getAllFiles = useCallback((): FileItem[] => {
        const cacheKey = createFileCacheKey(spaceAttachments, driveFiles, provisionalAttachments, allAttachments);

        if (cacheKey === filesCacheRef.current.key) {
            return filesCacheRef.current.files;
        }

        const files = computeFileList(spaceAttachments, driveFiles, allAttachments, provisionalAttachments);
        filesCacheRef.current = { key: cacheKey, files: files.length === 0 ? EMPTY_FILES : files };
        return filesCacheRef.current.files;
    }, [spaceAttachments, driveFiles, allAttachments, provisionalAttachments]);

    // Detect @ mentions in editor
    useEffect(() => {
        if (!editor) return;

        const handleUpdate = () => {
            const { state } = editor;
            const { selection } = state;
            const { $from } = selection;

            const textBefore = $from.parent.textBetween(
                Math.max(0, $from.parentOffset - 50),
                $from.parentOffset,
                undefined,
                ' '
            );

            const match = textBefore.match(/@([^\s@]*)$/);

            if (match) {
                const query = match[1] || '';
                const allFiles = getAllFiles();
                const matchingFiles = filterFiles(allFiles, query);
                const fileCount = matchingFiles.length;

                const itemHeight = 52;
                const containerPadding = 8;
                const estimatedHeight = Math.min(fileCount * itemHeight + containerPadding, 320);

                const coords = editor.view.coordsAtPos($from.pos);
                const viewportHeight = window.innerHeight;
                const viewportWidth = window.innerWidth;
                const dropdownWidth = 288;

                let top = coords.bottom + 4;
                let left = coords.left;

                if (top + estimatedHeight > viewportHeight) {
                    top = coords.top - estimatedHeight - 4;
                    if (top < 8) {
                        top = 8;
                    }
                }

                if (left + dropdownWidth > viewportWidth) {
                    left = viewportWidth - dropdownWidth - 16;
                }

                if (left < 16) {
                    left = 16;
                }

                const finalTop = Math.max(8, top);
                const finalLeft = Math.max(16, left);

                setMentionState((prev) => {
                    if (
                        prev.isActive &&
                        prev.query === query &&
                        prev.position?.top === finalTop &&
                        prev.position?.left === finalLeft
                    ) {
                        return prev;
                    }

                    return {
                        isActive: true,
                        query,
                        position: { top: finalTop, left: finalLeft },
                        selectedIndex: prev.isActive && prev.query === query ? prev.selectedIndex : 0,
                    };
                });
            } else {
                setMentionState((prev) => {
                    if (!prev.isActive) {
                        return prev;
                    }
                    return INITIAL_MENTION_STATE;
                });
            }
        };

        editor.on('update', handleUpdate);
        editor.on('selectionUpdate', handleUpdate);

        return () => {
            editor.off('update', handleUpdate);
            editor.off('selectionUpdate', handleUpdate);
        };
    }, [editor, getAllFiles]);

    // Compute filtered files for rendering
    const allFiles = getAllFiles();
    const filteredFiles = mentionState.isActive ? filterFiles(allFiles, mentionState.query) : EMPTY_FILES;

    const selectFile = useCallback(
        async (file: FileItem) => {
            if (!editor) return;

            const { state } = editor;
            const { selection } = state;
            const { $from } = selection;

            const textBefore = $from.parent.textBetween(
                Math.max(0, $from.parentOffset - 50),
                $from.parentOffset,
                undefined,
                ' '
            );
            const match = textBefore.match(/@([^\s@]*)$/);

            if (!match) return;

            const startPos = $from.pos - match[0].length;
            const endPos = $from.pos;

            // Check for duplicates for all file types
            const conversationAttachmentIds = new Set(
                messageChain.flatMap((msg) => msg.attachments?.map((att) => att.id) || [])
            );
            const conversationAttachments = Object.values(allAttachments).filter(
                (att) => conversationAttachmentIds.has(att.id) || !att.spaceId
            );

            const isDuplicate = conversationAttachments.some(
                (att) => att.filename.toLowerCase() === file.name.toLowerCase()
            );

            if (isDuplicate) {
                createNotification({
                    text: c('collider_2025:Info').t`File "${file.name}" is already added to this conversation`,
                    type: 'info',
                });
                setMentionState(INITIAL_MENTION_STATE);
                return;
            }

            const attachmentToAdd: Attachment | null = null;

            if (file.source === 'local' && file.attachment) {
                // For project files, don't create a new attachment - just insert the @mention
                // The file already exists in space attachments and will be resolved by fileResolver in sendMessage
                // This prevents duplicates and avoids showing thumbnails for project file @mentions
                editor
                    .chain()
                    .focus()
                    .setTextSelection({ from: startPos, to: endPos })
                    .deleteSelection()
                    .insertContent(`@${file.name}`)
                    .run();

                setMentionState(INITIAL_MENTION_STATE);
                return;
            } else if (file.source === 'drive') {
                // Drive files require driveSDK
                if (!driveSDK) {
                    createNotification({
                        text: c('collider_2025:Info').t`Drive files are not available for guest users`,
                        type: 'info',
                    });
                    setMentionState(INITIAL_MENTION_STATE);
                    return;
                }

                const mimeType = getMimeTypeFromExtension(file.name);
                const provisionalAttachmentId = newAttachmentId();

                const provisionalAttachment: Attachment = {
                    id: provisionalAttachmentId,
                    filename: file.name,
                    mimeType,
                    uploadedAt: new Date().toISOString(),
                    rawBytes: 0,
                    processing: true,
                };

                dispatch(upsertAttachment(provisionalAttachment));

                editor
                    .chain()
                    .focus()
                    .setTextSelection({ from: startPos, to: endPos })
                    .deleteSelection()
                    .insertContent(`@${file.name}`)
                    .run();

                setMentionState(INITIAL_MENTION_STATE);

                // Process in background
                (async () => {
                    try {
                        // Check if file is already in the search index (cached from indexing)
                        let content: string | null = null;
                        let fileSize = 0;

                        if (userId && !isGuest) {
                            const searchService = SearchService.get(userId);
                            const indexedDoc = searchService.getDocumentById(file.id);
                            if (indexedDoc && indexedDoc.content) {
                                console.log('[FileMention] Using cached content from search index for:', file.name);
                                content = indexedDoc.content;
                                fileSize = indexedDoc.size;
                            }
                        }

                        // If not in index, download and process
                        if (!content) {
                            console.log('[FileMention] Downloading file from Drive:', file.name);
                            const fileData = await driveSDK.downloadFile(file.id);
                            const data = new Uint8Array(fileData);
                            fileSize = data.byteLength;

                            const fileBlob = new Blob([data], { type: mimeType });
                            const driveFile = new File([fileBlob], file.name, {
                                type: mimeType,
                                lastModified: Date.now(),
                            });

                            const result = await fileProcessingService.processFile(driveFile);

                            if (result.type === 'text') {
                                content = result.content;
                            } else if (result.type === 'error') {
                                if (result.unsupported) {
                                    dispatch(
                                        upsertAttachment({
                                            ...provisionalAttachment,
                                            error: true,
                                            errorMessage: 'File format not supported',
                                            processing: false,
                                        })
                                    );
                                    createNotification({
                                        text: c('collider_2025:Error').t`File format not supported: ${file.name}`,
                                        type: 'error',
                                    });
                                    return;
                                } else {
                                    dispatch(
                                        upsertAttachment({
                                            ...provisionalAttachment,
                                            error: true,
                                            errorMessage: result.message,
                                            processing: false,
                                        })
                                    );
                                    createNotification({
                                        text: c('collider_2025:Error').t`Failed to process file: ${file.name}`,
                                        type: 'error',
                                    });
                                    return;
                                }
                            }
                        }

                        // Use the content (from cache or freshly processed)
                        if (content) {
                            const filename = `Filename: ${file.name}`;
                            const header = 'File contents:';
                            const beginMarker = '----- BEGIN FILE CONTENTS -----';
                            const endMarker = '----- END FILE CONTENTS -----';
                            const fullContext = [filename, header, beginMarker, content.trim(), endMarker].join('\n');
                            const tokenCount = getApproximateTokenCount(fullContext);

                            dispatch(
                                upsertAttachment({
                                    ...provisionalAttachment,
                                    rawBytes: fileSize,
                                    markdown: content,
                                    truncated: false,
                                    tokenCount,
                                    processing: false,
                                })
                            );
                        }
                    } catch (error) {
                        console.error('Failed to download/process Drive file:', error);

                        const isIntegrityError =
                            error instanceof Error &&
                            (error.message.includes('Data integrity check failed') ||
                                error.message.includes('IntegrityError') ||
                                error.name === 'IntegrityError');

                        const errorMessage = isIntegrityError
                            ? c('collider_2025:Error').t`File download failed due to integrity check. Please try again.`
                            : error instanceof Error
                              ? error.message
                              : 'Failed to process file';

                        if (isIntegrityError) {
                            createNotification({
                                text: c('collider_2025:Error')
                                    .t`Failed to download "${file.name}": Data integrity check failed. Please try again.`,
                                type: 'error',
                            });
                        }

                        dispatch(
                            upsertAttachment({
                                ...provisionalAttachment,
                                error: true,
                                errorMessage,
                                processing: false,
                            })
                        );
                    }
                })();

                return;
            }

            editor
                .chain()
                .focus()
                .setTextSelection({ from: startPos, to: endPos })
                .deleteSelection()
                .insertContent(`@${file.name}`)
                .run();

            setMentionState(INITIAL_MENTION_STATE);

            if (file.source === 'local' && attachmentToAdd) {
                dispatch(upsertAttachment(attachmentToAdd));
            }
        },
        [editor, dispatch, driveSDK, createNotification, messageChain, allAttachments]
    );

    const closeMention = useCallback(() => {
        setMentionState((prev) => (prev.isActive ? INITIAL_MENTION_STATE : prev));
    }, []);

    // Refresh Drive files when autocomplete becomes active (user types @)
    const prevMentionActiveRef = useRef(false);
    useEffect(() => {
        // Detect when autocomplete becomes active (transitions from false to true)
        if (mentionState.isActive && !prevMentionActiveRef.current && linkedDriveFolder && driveSDK) {
            // Refresh files when user starts typing @ to ensure fresh results
            void refreshDriveFiles();
        }
        prevMentionActiveRef.current = mentionState.isActive;
    }, [mentionState.isActive, linkedDriveFolder, driveSDK, refreshDriveFiles]);

    return {
        mentionState,
        files: filteredFiles,
        selectFile,
        closeMention,
        refreshDriveFiles,
    };
};
