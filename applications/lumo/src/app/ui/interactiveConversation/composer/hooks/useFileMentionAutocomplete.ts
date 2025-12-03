import { useState, useEffect, useRef, useCallback } from 'react';
import type { Editor } from '@tiptap/react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';

import type { SpaceId, Attachment, Message } from '../../../../types';
import { useLumoDispatch, useLumoSelector } from '../../../../redux/hooks';
import { selectSpaceById, selectAssetsBySpaceId, selectAttachmentsBySpaceId, selectAttachments, selectProvisionalAttachments } from '../../../../redux/selectors';
import { upsertAttachment, newAttachmentId, deleteAttachment } from '../../../../redux/slices/core/attachments';
import { fileProcessingService } from '../../../../services/fileProcessingService';
import { getApproximateTokenCount } from '../../../../llm/tokenizer';
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
 * Computes the list of available files from space assets, attachments, and drive files.
 */
function computeFileList(
    spaceAssets: Record<string, any>,
    spaceAttachments: Record<string, any>,
    driveFiles: { id: string; name: string }[],
    allAttachments: Record<string, Attachment>,
    provisionalAttachments: Attachment[]
): FileItem[] {
    // Get local files (space assets and attachments)
    const localFiles: FileItem[] = [
        ...Object.values(spaceAssets).filter((asset) => asset && !asset.error && !asset.processing),
        ...Object.values(spaceAttachments).filter((att) => att && !att.error && !att.processing),
    ].map((file) => {
        const attachment = allAttachments[file.id];
        return {
            id: file.id,
            name: file.filename,
            source: 'local' as const,
            attachment,
            mimeType: attachment?.mimeType,
        };
    });

    // Drive files
    const driveFilesList: FileItem[] = driveFiles.map((file) => ({
        id: file.id,
        name: file.name,
        source: 'drive' as const,
        mimeType: undefined,
    }));

    // Combine and deduplicate
    const allFilesCombined = [...localFiles, ...driveFilesList];
    const seen = new Set<string>();
    const provisionalFilenames = new Set(provisionalAttachments.map(att => att.filename.toLowerCase()));
    
    const uniqueFiles = allFilesCombined.filter((file) => {
        const key = file.name.toLowerCase();
        if (seen.has(key) || provisionalFilenames.has(key)) {
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
    spaceAssets: Record<string, any>,
    spaceAttachments: Record<string, any>,
    driveFiles: { id: string; name: string }[],
    provisionalAttachments: Attachment[]
): string {
    const assetIds = Object.keys(spaceAssets).sort().join(',');
    const attachmentIds = Object.keys(spaceAttachments).sort().join(',');
    const driveIds = driveFiles.map(f => `${f.id}:${f.name}`).sort().join(',');
    const provisionalNames = provisionalAttachments.map(att => att.filename.toLowerCase()).sort().join(',');
    return `${assetIds}|${attachmentIds}|${driveIds}|${provisionalNames}`;
}

export const useFileMentionAutocomplete = (
    editor: Editor | null,
    spaceId?: SpaceId,
    messageChain: Message[] = [],
    driveSDK?: DriveSDKFunctions // Optional - only provided for authenticated users
): {
    mentionState: FileMentionState;
    files: FileItem[];
    selectFile: (file: FileItem) => void;
    closeMention: () => void;
} => {
    const [mentionState, setMentionState] = useState<FileMentionState>(INITIAL_MENTION_STATE);

    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const space = useLumoSelector((state) => (spaceId ? selectSpaceById(spaceId)(state) : undefined));
    const linkedDriveFolder = space?.linkedDriveFolder;
    const allAttachments = useLumoSelector(selectAttachments);
    const provisionalAttachments = useLumoSelector(selectProvisionalAttachments);

    const spaceAssets = useLumoSelector((state) =>
        spaceId ? selectAssetsBySpaceId(spaceId)(state) : {}
    );
    const spaceAttachments = useLumoSelector((state) =>
        spaceId ? selectAttachmentsBySpaceId(spaceId)(state) : {}
    );

    // Drive files state
    const [driveFiles, setDriveFiles] = useState<{ id: string; name: string }[]>([]);
    const driveFilesLoadedRef = useRef(false);

    // Cache for computed files
    const filesCacheRef = useRef<{ key: string; files: FileItem[] }>({ key: '', files: EMPTY_FILES });

    // Load Drive files once (only if driveSDK is provided)
    useEffect(() => {
        if (!linkedDriveFolder || driveFilesLoadedRef.current || !driveSDK) return;

        const loadDriveFiles = async () => {
            try {
                const children = await driveSDK.browseFolderChildren(linkedDriveFolder.folderId);
                const files = children
                    .filter((child) => child.type === 'file')
                    .map((file) => ({
                        id: file.id,
                        name: file.name,
                    }));
                setDriveFiles(files);
                driveFilesLoadedRef.current = true;
            } catch (error) {
                console.error('Failed to load Drive files for autocomplete:', error);
            }
        };

        loadDriveFiles();
    }, [linkedDriveFolder, driveSDK]);

    // Compute files with manual caching
    const getAllFiles = useCallback((): FileItem[] => {
        const cacheKey = createFileCacheKey(spaceAssets, spaceAttachments, driveFiles, provisionalAttachments);
        
        if (cacheKey === filesCacheRef.current.key) {
            return filesCacheRef.current.files;
        }
        
        const files = computeFileList(spaceAssets, spaceAttachments, driveFiles, allAttachments, provisionalAttachments);
        filesCacheRef.current = { key: cacheKey, files: files.length === 0 ? EMPTY_FILES : files };
        return filesCacheRef.current.files;
    }, [spaceAssets, spaceAttachments, driveFiles, allAttachments, provisionalAttachments]);

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
                
                setMentionState(prev => {
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
                setMentionState(prev => {
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
    const filteredFiles = mentionState.isActive 
        ? filterFiles(allFiles, mentionState.query)
        : EMPTY_FILES;

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

            let attachmentToAdd: Attachment | null = null;

            if (file.source === 'local' && file.attachment) {
                attachmentToAdd = {
                    ...file.attachment,
                    id: newAttachmentId(),
                    spaceId: undefined,
                };
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
                        const fileData = await driveSDK.downloadFile(file.id);
                        const data = new Uint8Array(fileData);
                        
                        const fileBlob = new Blob([data], { type: mimeType });
                        const driveFile = new File([fileBlob], file.name, {
                            type: mimeType,
                            lastModified: Date.now(),
                        });
                        
                        const conversationAttachmentIds = new Set(
                            messageChain.flatMap((msg) => msg.attachments?.map((att) => att.id) || [])
                        );
                        const conversationAttachments = Object.values(allAttachments).filter(
                            (att) => conversationAttachmentIds.has(att.id) || (!att.spaceId && att.id !== provisionalAttachmentId)
                        );
                        
                        const isDuplicate = conversationAttachments.some(
                            (att) => att.filename.toLowerCase() === file.name.toLowerCase()
                        );
                        
                        if (isDuplicate) {
                            dispatch(deleteAttachment(provisionalAttachmentId));
                            createNotification({
                                text: c('collider_2025:Info').t`File "${file.name}" is already added`,
                                type: 'info',
                            });
                            return;
                        }
                        
                        try {
                            const result = await fileProcessingService.processFile(driveFile);
                            
                            if (result.success && result.result) {
                                const filename = `Filename: ${file.name}`;
                                const header = 'File contents:';
                                const beginMarker = '----- BEGIN FILE CONTENTS -----';
                                const endMarker = '----- END FILE CONTENTS -----';
                                const content = result.result.convertedContent.trim();
                                const fullContext = [filename, header, beginMarker, content, endMarker].join('\n');
                                const tokenCount = getApproximateTokenCount(fullContext);
                                
                                dispatch(upsertAttachment({
                                    ...provisionalAttachment,
                                    rawBytes: driveFile.size,
                                    markdown: result.result.convertedContent,
                                    truncated: result.result.truncated,
                                    originalRowCount: result.result.originalRowCount,
                                    processedRowCount: result.result.processedRowCount,
                                    tokenCount,
                                    processing: false,
                                }));
                            } else if (result.isUnsupported) {
                                dispatch(upsertAttachment({
                                    ...provisionalAttachment,
                                    error: true,
                                    errorMessage: 'File format not supported',
                                    processing: false,
                                }));
                                createNotification({
                                    text: c('collider_2025:Error').t`File format not supported: ${file.name}`,
                                    type: 'error',
                                });
                            } else {
                                dispatch(upsertAttachment({
                                    ...provisionalAttachment,
                                    error: true,
                                    errorMessage: result.error || 'Failed to process file',
                                    processing: false,
                                }));
                                createNotification({
                                    text: c('collider_2025:Error').t`Failed to process file: ${file.name}`,
                                    type: 'error',
                                });
                            }
                        } catch (processingError) {
                            console.error('Failed to process Drive file:', processingError);
                            dispatch(upsertAttachment({
                                ...provisionalAttachment,
                                error: true,
                                errorMessage: processingError instanceof Error ? processingError.message : 'Failed to process file',
                                processing: false,
                            }));
                            createNotification({
                                text: c('collider_2025:Error').t`Failed to process file: ${file.name}`,
                                type: 'error',
                            });
                        }
                    } catch (error) {
                        console.error('Failed to download/process Drive file:', error);
                        
                        const isIntegrityError = error instanceof Error && 
                            (error.message.includes('Data integrity check failed') || 
                             error.message.includes('IntegrityError') ||
                             error.name === 'IntegrityError');
                        
                        const errorMessage = isIntegrityError
                            ? c('collider_2025:Error').t`File download failed due to integrity check. Please try again.`
                            : error instanceof Error ? error.message : 'Failed to process file';
                        
                        if (isIntegrityError) {
                            createNotification({
                                text: c('collider_2025:Error').t`Failed to download "${file.name}": Data integrity check failed. Please try again.`,
                                type: 'error',
                            });
                        }
                        
                        dispatch(upsertAttachment({
                            ...provisionalAttachment,
                            error: true,
                            errorMessage,
                            processing: false,
                        }));
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
        setMentionState(prev => prev.isActive ? INITIAL_MENTION_STATE : prev);
    }, []);

    return {
        mentionState,
        files: filteredFiles,
        selectFile,
        closeMention,
    };
};
