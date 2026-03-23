import { useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components';

import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { selectSpaceByIdOptional } from '../../../redux/selectors';
import { newAttachmentId, upsertAttachment } from '../../../redux/slices/core/attachments';
import { SearchService } from '../../../services/search/searchService';
import type { ProjectSpace, SpaceId } from '../../../types';
import { getMimeTypeFromExtension } from '../../../util/filetypes';
import { getApproximateTokenCount } from '../../../llm/tokenizer';
import { useDriveFileAttachment } from './useDriveFileAttachment';
import { useDriveFileLoader } from './useDriveFileLoader';
import { EMPTY_FILES, useFileInventory } from './useFileInventory';
import { buildAlreadyMentionedNames, filterFiles } from './fileMentionHelpers';
import type { FileItem } from './fileMentionHelpers';

export type { FileItem } from './fileMentionHelpers';
export { buildAlreadyMentionedNames, filterFiles } from './fileMentionHelpers';

export interface FileMentionState {
    isActive: boolean;
    query: string;
    position: { top: number; left: number } | null;
    selectedIndex: number;
    /** Character index in the textarea value where the @ starts */
    mentionStart: number;
    /** Character index in the textarea value just after the typed query */
    mentionEnd: number;
}

// Optional Drive SDK functions - passed from parent to avoid calling useDriveSDK for guests
export interface DriveSDKFunctions {
    browseFolderChildren: (folderId?: string) => Promise<{ id: string; name: string; type: string }[]>;
    downloadFile: (nodeId: string) => Promise<ArrayBuffer>;
}

const INITIAL_MENTION_STATE: FileMentionState = {
    isActive: false,
    query: '',
    position: null,
    selectedIndex: 0,
    mentionStart: 0,
    mentionEnd: 0,
};

/**
 * Calculates the dropdown position relative to the textarea element.
 * Positions above the textarea by default (typical for a bottom-anchored composer).
 */
function getDropdownPosition(textarea: HTMLTextAreaElement): { top: number; left: number } {
    const rect = textarea.getBoundingClientRect();
    const dropdownWidth = 288;
    const viewportWidth = window.innerWidth;

    let left = rect.left + 16;
    if (left + dropdownWidth > viewportWidth) {
        left = Math.max(16, viewportWidth - dropdownWidth - 16);
    }

    // Return the textarea's top edge; FileMentionComponent adjusts for overflow
    return { top: rect.top, left };
}

/** Restores textarea focus and cursor position after a React re-render. */
function restoreCursor(textarea: HTMLTextAreaElement | null, pos: number) {
    setTimeout(() => {
        textarea?.focus();
        textarea?.setSelectionRange(pos, pos);
    }, 0);
}

export const useFileMentionAutocomplete = (
    textareaRef: React.RefObject<HTMLTextAreaElement>,
    value: string,
    setValue: (v: string) => void,
    spaceId?: SpaceId,
    driveSDK?: DriveSDKFunctions,
    onDriveFilesRefresh?: () => void,
    userId?: string
): {
    mentionState: FileMentionState;
    files: FileItem[];
    selectFile: (file: FileItem) => void;
    closeMention: () => void;
    refreshDriveFiles: () => Promise<void>;
} => {
    const [mentionState, setMentionState] = useState<FileMentionState>(INITIAL_MENTION_STATE);
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();

    const space = useLumoSelector(selectSpaceByIdOptional(spaceId));
    const spaceProject = space?.isProject ? (space satisfies ProjectSpace) : undefined;
    const linkedDriveFolder = spaceProject?.linkedDriveFolder;

    const { driveFiles, refreshDriveFiles } = useDriveFileLoader(linkedDriveFolder, driveSDK, onDriveFilesRefresh);
    const allFiles = useFileInventory(spaceId, driveFiles);
    const { attach } = useDriveFileAttachment(driveSDK, userId);

    // Detect @ mentions whenever the textarea value changes
    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const cursorPos = textarea.selectionStart ?? 0;
        const textBefore = value.substring(Math.max(0, cursorPos - 50), cursorPos);
        const match = textBefore.match(/@([^\s@]*)$/);

        if (match) {
            const query = match[1] || '';
            const mentionStart = cursorPos - match[0].length;
            const mentionEnd = cursorPos;
            const position = getDropdownPosition(textarea);

            setMentionState((prev) => {
                if (
                    prev.isActive &&
                    prev.query === query &&
                    prev.mentionStart === mentionStart &&
                    prev.mentionEnd === mentionEnd
                ) {
                    return prev;
                }
                return {
                    isActive: true,
                    query,
                    position,
                    selectedIndex: prev.isActive && prev.query === query ? prev.selectedIndex : 0,
                    mentionStart,
                    mentionEnd,
                };
            });
        } else {
            setMentionState((prev) => (!prev.isActive ? prev : INITIAL_MENTION_STATE));
        }
    }, [value, textareaRef]);

    // Refresh Drive files when autocomplete becomes active (user types @)
    const prevMentionActiveRef = useRef(false);
    useEffect(() => {
        if (mentionState.isActive && !prevMentionActiveRef.current && linkedDriveFolder && driveSDK) {
            void refreshDriveFiles();
        }
        prevMentionActiveRef.current = mentionState.isActive;
    }, [mentionState.isActive, linkedDriveFolder, driveSDK, refreshDriveFiles]);

    // Build a set of filenames that are already fully mentioned in the composer text,
    // so the dropdown doesn't re-offer them.
    const alreadyMentionedNames = buildAlreadyMentionedNames(allFiles, value);

    const filteredFiles = mentionState.isActive
        ? filterFiles(allFiles, mentionState.query).filter(
              (f) => !alreadyMentionedNames.has(f.name.toLowerCase())
          )
        : EMPTY_FILES;

    const closeMention = useCallback(() => {
        setMentionState((prev) => (prev.isActive ? INITIAL_MENTION_STATE : prev));
    }, []);

    const selectFile = useCallback(
        async (file: FileItem) => {
            if (!mentionState.isActive) return;

            const textarea = textareaRef.current;

            // Use the stored mention range — do NOT read selectionStart here because
            // clicking the dropdown causes the textarea to lose focus, resetting selectionStart to 0.
            const { mentionStart, mentionEnd } = mentionState;
            const mention = `@${file.name}`;
            const newValue = value.substring(0, mentionStart) + mention + value.substring(mentionEnd);
            const newCursorPos = mentionStart + mention.length;

            // Prevent mentioning the same file twice in the same message.
            const alreadyMentioned = value.includes(`@${file.name}`);
            if (alreadyMentioned) {
                createNotification({
                    text: c('collider_2025:Info').t`File "${file.name}" is already mentioned`,
                    type: 'info',
                });
                closeMention();
                return;
            }

            if (file.source === 'local') {
                if (file.attachment?.spaceId) {
                    const sourceAtt = file.attachment;

                    // Eagerly copy content into the provisional so it's available on the first
                    // message even before background sagas have fully loaded from IndexedDB.
                    // Priority: Redux state → search index → defer to fillShallowProvisionals at send time.
                    let markdown = sourceAtt.markdown;
                    let tokenCount = sourceAtt.tokenCount;
                    let rawBytes = sourceAtt.rawBytes || 0;

                    if (!markdown && userId) {
                        const doc = SearchService.get(userId).getDocumentById(sourceAtt.id);
                        if (doc?.content) {
                            markdown = doc.content;
                            tokenCount = getApproximateTokenCount(doc.content);
                            rawBytes = doc.size || rawBytes;
                        }
                    }

                    dispatch(
                        upsertAttachment({
                            id: newAttachmentId(),
                            filename: file.name,
                            mimeType: file.mimeType ?? sourceAtt.mimeType,
                            uploadedAt: new Date().toISOString(),
                            rawBytes,
                            processing: false,
                            ...(markdown && { markdown, tokenCount }),
                        })
                    );
                }
                // Already-provisional files (directly uploaded in this session) are already
                // showing as chips — just insert the @mention text.
                setValue(newValue);
                closeMention();
                restoreCursor(textarea, newCursorPos);
                return;
            }

            if (file.source === 'drive') {
                if (!driveSDK) {
                    createNotification({
                        text: c('collider_2025:Info').t`Drive files are not available for guest users`,
                        type: 'info',
                    });
                    closeMention();
                    return;
                }

                // Drive files: start a background download/index immediately so the content is
                // ready by the time the user sends. A provisional loading chip is shown in the
                // composer via the Redux attachment while processing.
                const mimeType = getMimeTypeFromExtension(file.name);
                const provisionalId = newAttachmentId();

                dispatch(
                    upsertAttachment({
                        id: provisionalId,
                        filename: file.name,
                        mimeType,
                        uploadedAt: new Date().toISOString(),
                        rawBytes: 0,
                        processing: true,
                    })
                );

                setValue(newValue);
                closeMention();
                restoreCursor(textarea, newCursorPos);

                void attach(file, provisionalId);
                return;
            }

            // Fallback
            setValue(newValue);
            closeMention();
            restoreCursor(textarea, newCursorPos);
        },
        [value, mentionState, textareaRef, setValue, dispatch, driveSDK, createNotification, attach, closeMention]
    );

    return {
        mentionState,
        files: filteredFiles,
        selectFile,
        closeMention,
        refreshDriveFiles,
    };
};
