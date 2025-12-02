import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Editor } from '@tiptap/react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';

import type { SpaceId, Attachment, Message } from '../../../../types';
import { useDriveSDK } from '../../../../hooks/useDriveSDK';
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

export const useFileMentionAutocomplete = (
    editor: Editor | null,
    spaceId?: SpaceId,
    messageChain: Message[] = []
): {
    mentionState: FileMentionState;
    files: Array<{ id: string; name: string; source: 'local' | 'drive'; attachment?: Attachment; mimeType?: string }>;
    selectFile: (file: { id: string; name: string; source: 'local' | 'drive'; attachment?: Attachment; mimeType?: string }) => void;
    closeMention: () => void;
} => {
    const [mentionState, setMentionState] = useState<FileMentionState>({
        isActive: false,
        query: '',
        position: null,
        selectedIndex: 0,
    });

    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const space = useLumoSelector((state) => (spaceId ? selectSpaceById(spaceId)(state) : undefined));
    const linkedDriveFolder = space?.linkedDriveFolder;
    const { browseFolderChildren, downloadFile } = useDriveSDK();
    const allAttachments = useLumoSelector(selectAttachments);
    const provisionalAttachments = useLumoSelector(selectProvisionalAttachments);

    // Get local files
    const spaceAssets = useLumoSelector((state) =>
        spaceId ? selectAssetsBySpaceId(spaceId)(state) : {}
    );
    const spaceAttachments = useLumoSelector((state) =>
        spaceId ? selectAttachmentsBySpaceId(spaceId)(state) : {}
    );

    const [driveFiles, setDriveFiles] = useState<Array<{ id: string; name: string }>>([]);
    const driveFilesLoadedRef = useRef(false);

    // Load Drive files once when folder is linked
    useEffect(() => {
        if (!linkedDriveFolder || driveFilesLoadedRef.current) return;

        const loadDriveFiles = async () => {
            try {
                const children = await browseFolderChildren(linkedDriveFolder.folderId);
                const files = children
                    .filter((child) => child.type === 'file')
                    .map((file) => ({
                        id: file.nodeId,
                        name: file.name,
                    }));
                setDriveFiles(files);
                driveFilesLoadedRef.current = true;
            } catch (error) {
                console.error('Failed to load Drive files for autocomplete:', error);
            }
        };

        loadDriveFiles();
    }, [linkedDriveFolder, browseFolderChildren]);

    // Get stable references to space assets and attachments IDs
    const spaceAssetIds = useMemo(() => Object.keys(spaceAssets), [spaceAssets]);
    const spaceAttachmentIds = useMemo(() => Object.keys(spaceAttachments), [spaceAttachments]);
    
    // Get all available files with their attachment references
    // Use useMemo instead of useCallback to avoid dependency issues
    const allFiles = useMemo((): Array<{ id: string; name: string; source: 'local' | 'drive'; attachment?: Attachment; mimeType?: string }> => {
        // Get local files (space assets and attachments) - these already exist as attachments
        const localFiles = [
            ...spaceAssetIds.map((id) => spaceAssets[id]).filter((asset) => asset && !asset.error && !asset.processing),
            ...spaceAttachmentIds.map((id) => spaceAttachments[id]).filter((att) => att && !att.error && !att.processing),
        ].map((file) => {
            // Find the attachment in the attachments store
            const attachment = allAttachments[file.id];
            return {
                id: file.id,
                name: file.filename,
                source: 'local' as const,
                attachment,
                mimeType: attachment?.mimeType,
            };
        });

        // Drive files - we'll need to download and create attachments when selected
        const driveFilesList = driveFiles.map((file) => ({
            id: file.id,
            name: file.name,
            source: 'drive' as const,
            mimeType: undefined, // Will be detected from filename
        }));

        // Combine and remove duplicates by filename (case-insensitive)
        // Also check against provisional attachments to avoid duplicates
        const allFilesCombined = [...localFiles, ...driveFilesList];
        const seen = new Set<string>();
        const provisionalFilenames = new Set(provisionalAttachments.map(att => att.filename.toLowerCase()));
        
        const uniqueFiles = allFilesCombined.filter((file) => {
            const key = file.name.toLowerCase();
            // Skip if already seen or if it's already a provisional attachment
            if (seen.has(key) || provisionalFilenames.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });

        return uniqueFiles;
    }, [spaceAssetIds, spaceAttachmentIds, spaceAssets, spaceAttachments, driveFiles, allAttachments, provisionalAttachments]);

    // Detect @ mentions in editor
    useEffect(() => {
        if (!editor) return;

        const handleUpdate = () => {
            const { state } = editor;
            const { selection } = state;
            const { $from } = selection;

            // Get text before cursor
            const textBefore = $from.parent.textBetween(
                Math.max(0, $from.parentOffset - 50),
                $from.parentOffset,
                undefined,
                ' '
            );

            // Check for @ pattern (simple @filename format)
            // Match @ followed by optional filename (no spaces)
            const match = textBefore.match(/@([^\s@]*)$/);
            
            if (match) {
                const query = match[1] || '';
                
                // Calculate filtered files count to estimate dropdown height
                const lowerQuery = query.toLowerCase();
                const matchingFiles = query
                    ? allFiles.filter((file) => file.name.toLowerCase().includes(lowerQuery)).slice(0, 10)
                    : allFiles.slice(0, 10);
                const fileCount = matchingFiles.length;
                
                // Estimate height: ~52px per item (py-2 = 16px + content ~36px) + container padding (py-1 = 8px)
                // Cap at max-h-80 (320px)
                const itemHeight = 52; // Approximate height per file item
                const containerPadding = 8; // py-1 = 4px top + 4px bottom
                const estimatedHeight = Math.min(fileCount * itemHeight + containerPadding, 320);
                
                // Get cursor position for dropdown (coordsAtPos returns viewport coordinates)
                const coords = editor.view.coordsAtPos($from.pos);
                const viewportHeight = window.innerHeight;
                const viewportWidth = window.innerWidth;
                const dropdownWidth = 288; // min-w-72 = 18rem = 288px
                
                // For fixed positioning, coords are already relative to viewport
                let top = coords.bottom + 4;
                let left = coords.left;
                
                // Flip above cursor if dropdown would overflow bottom of viewport
                if (top + estimatedHeight > viewportHeight) {
                    top = coords.top - estimatedHeight - 4;
                    // Ensure it doesn't go above viewport
                    if (top < 8) {
                        top = 8;
                    }
                }
                
                // Ensure dropdown doesn't overflow right edge
                if (left + dropdownWidth > viewportWidth) {
                    left = viewportWidth - dropdownWidth - 16;
                }
                
                // Ensure dropdown doesn't overflow left edge
                if (left < 16) {
                    left = 16;
                }
                
                setMentionState({
                    isActive: true,
                    query,
                    position: {
                        top: Math.max(8, top),
                        left: Math.max(16, left),
                    },
                    selectedIndex: 0,
                });
            } else {
                setMentionState((prev) => ({ ...prev, isActive: false }));
            }
        };

        editor.on('update', handleUpdate);
        editor.on('selectionUpdate', handleUpdate);

        return () => {
            editor.off('update', handleUpdate);
            editor.off('selectionUpdate', handleUpdate);
        };
    }, [editor, allFiles]);

    // Filter files by query
    const filteredFiles = useMemo(() => {
        if (!mentionState.query) return allFiles.slice(0, 10);

        const lowerQuery = mentionState.query.toLowerCase();
        return allFiles
            .filter((file) => file.name.toLowerCase().includes(lowerQuery))
            .slice(0, 10);
    }, [allFiles, mentionState.query]);

    const selectFile = useCallback(
        async (file: { id: string; name: string; source: 'local' | 'drive'; attachment?: Attachment; mimeType?: string }) => {
            if (!editor) return;

            const { state } = editor;
            const { selection } = state;
            const { $from } = selection;

            // Find the @ mention in the text
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
                // For local files, create a provisional copy (without spaceId) so it shows in composer
                attachmentToAdd = {
                    ...file.attachment,
                    id: newAttachmentId(), // New ID for provisional attachment
                    spaceId: undefined, // Make it provisional
                };
            } else if (file.source === 'drive') {
                // For Drive files, add provisional attachment immediately, then process in background
                // This improves perceived performance - user sees file immediately
                const mimeType = getMimeTypeFromExtension(file.name);
                const provisionalAttachmentId = newAttachmentId();
                
                // Create provisional attachment immediately (will show in composer right away)
                const provisionalAttachment: Attachment = {
                    id: provisionalAttachmentId,
                    filename: file.name,
                    mimeType,
                    uploadedAt: new Date().toISOString(),
                    rawBytes: 0, // Will be updated after download
                    processing: true, // Shows processing indicator
                    // No spaceId = provisional attachment
                };
                
                dispatch(upsertAttachment(provisionalAttachment));
                
                // Replace @query with @filename to keep the reference visible in the text
                editor
                    .chain()
                    .focus()
                    .setTextSelection({ from: startPos, to: endPos })
                    .deleteSelection()
                    .insertContent(`@${file.name}`)
                    .run();

                setMentionState((prev) => ({ ...prev, isActive: false }));
                
                // Download and process in background (async, don't await)
                (async () => {
                    try {
                        const fileData = await downloadFile(file.id);
                        const data = new Uint8Array(fileData);
                        
                        const fileBlob = new Blob([data], { type: mimeType });
                        const driveFile = new File([fileBlob], file.name, {
                            type: mimeType,
                            lastModified: Date.now(),
                        });
                        
                        // Check for duplicates first
                        const conversationAttachmentIds = new Set(
                            messageChain.flatMap((msg) => msg.attachments?.map((att) => att.id) || [])
                        );
                        // Use the already-loaded allAttachments from the hook
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
                        
                        // Process the file and update the provisional attachment in place
                        try {
                            const result = await fileProcessingService.processFile(driveFile);
                            
                            if (result.success && result.result) {
                                // Calculate token count
                                const filename = `Filename: ${file.name}`;
                                const header = 'File contents:';
                                const beginMarker = '----- BEGIN FILE CONTENTS -----';
                                const endMarker = '----- END FILE CONTENTS -----';
                                const content = result.result.convertedContent.trim();
                                const fullContext = [filename, header, beginMarker, content, endMarker].join('\n');
                                const tokenCount = getApproximateTokenCount(fullContext);
                                
                                // Update the provisional attachment with processed data
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
                                // Mark provisional attachment as error
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
                                // Mark provisional attachment as error
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
                        
                        // Check if it's an integrity error
                        const isIntegrityError = error instanceof Error && 
                            (error.message.includes('Data integrity check failed') || 
                             error.message.includes('IntegrityError') ||
                             error.name === 'IntegrityError');
                        
                        const errorMessage = isIntegrityError
                            ? c('collider_2025:Error').t`File download failed due to integrity check. Please try again.`
                            : error instanceof Error ? error.message : 'Failed to process file';
                        
                        // Show notification for integrity errors
                        if (isIntegrityError) {
                            createNotification({
                                text: c('collider_2025:Error').t`Failed to download "${file.name}": Data integrity check failed. Please try again.`,
                                type: 'error',
                            });
                        }
                        
                        // Mark as error
                        dispatch(upsertAttachment({
                            ...provisionalAttachment,
                            error: true,
                            errorMessage,
                            processing: false,
                        }));
                    }
                })();
                
                // Return early - don't wait for processing
                return;
            }

            // Replace @query with @filename to keep the reference visible in the text
            editor
                .chain()
                .focus()
                .setTextSelection({ from: startPos, to: endPos })
                .deleteSelection()
                .insertContent(`@${file.name}`)
                .run();

            setMentionState((prev) => ({ ...prev, isActive: false }));

            // For local files, add as provisional attachment
            // For Drive files, handleFileAsync already added it to Redux
            if (file.source === 'local' && attachmentToAdd) {
                dispatch(upsertAttachment(attachmentToAdd));
            }
        },
        [editor, dispatch, downloadFile]
    );

    const closeMention = useCallback(() => {
        setMentionState((prev) => ({ ...prev, isActive: false }));
    }, []);

    return {
        mentionState,
        files: filteredFiles,
        selectFile,
        closeMention,
    };
};

