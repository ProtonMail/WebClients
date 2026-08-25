import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';

import { useDriveIndexing } from '../../../providers/DriveIndexingProvider';
import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { selectProvisionalAttachments, selectSpaceByIdOptional } from '../../../redux/selectors';
import { newAttachmentId, upsertAttachment } from '../../../redux/slices/core/attachments';
import type { Message, ProjectSpace, SpaceId } from '../../../types';
import { getMimeTypeFromExtension, getProcessingCategory } from '../../../util/filetypes';
import { buildAlreadyMentionedNames, buildAttachedNames, filterFiles } from './fileMentionHelpers';
import type { FileItem } from './fileMentionHelpers';
import { useDriveFileAttachment } from './useDriveFileAttachment';
import { useDriveFileLoader } from './useDriveFileLoader';
import { EMPTY_FILES, useFileInventory } from './useFileInventory';

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
    browseFolderChildren: (
        folderId?: string,
        forceRefresh?: boolean
    ) => Promise<{ id: string; name: string; type: string }[]>;
    downloadFile: (nodeId: string) => Promise<ArrayBuffer>;
}

const EMPTY_MESSAGES: Message[] = [];

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
    userId?: string,
    messageChain: Message[] = EMPTY_MESSAGES
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

    const provisionalAttachments = useLumoSelector(selectProvisionalAttachments);
    const space = useLumoSelector(selectSpaceByIdOptional(spaceId));
    const spaceProject = space?.isProject ? (space satisfies ProjectSpace) : undefined;
    const linkedDriveFolder = spaceProject?.linkedDriveFolder;
    const { driveIndexRevision } = useDriveIndexing();

    const { driveFiles, refreshDriveFiles } = useDriveFileLoader(
        linkedDriveFolder,
        driveSDK,
        onDriveFilesRefresh,
        driveIndexRevision
    );
    const allFiles = useFileInventory(spaceId, driveFiles, !!linkedDriveFolder);
    const { attach } = useDriveFileAttachment(driveSDK, userId);

    // Lowercase filenames already present in this conversation — as composer chips
    // (provisional attachments) or as attachments on any message in the chain.
    // Re-mentioning one of these should only insert the `@filename` text reference,
    // never create another attachment (which would duplicate the file).
    const attachedNames = useMemo(
        () =>
            buildAttachedNames([
                ...provisionalAttachments,
                ...messageChain.flatMap((message) => message.attachments ?? []),
            ]),
        [provisionalAttachments, messageChain]
    );

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
        ? filterFiles(allFiles, mentionState.query).filter((f) => !alreadyMentionedNames.has(f.name.toLowerCase()))
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

            // Re-mentioning a file already in the conversation only needs the @reference text;
            // content is resolved from the search index at send time.
            if (attachedNames.has(file.name.toLowerCase()) || attachedNames.has(file.id.toLowerCase())) {
                setValue(newValue);
                closeMention();
                restoreCursor(textarea, newCursorPos);
                return;
            }

            if (file.source === 'local') {
                if (file.attachment?.spaceId) {
                    dispatch(
                        upsertAttachment({
                            id: newAttachmentId(),
                            filename: file.name,
                            mimeType: file.mimeType ?? file.attachment.mimeType,
                            uploadedAt: new Date().toISOString(),
                            rawBytes: 0,
                            processing: false,
                        })
                    );
                }
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

                const mimeType = getMimeTypeFromExtension(file.name);
                const isImage = getProcessingCategory(mimeType, file.name) === 'image';
                const provisionalId = newAttachmentId();

                dispatch(
                    upsertAttachment({
                        id: provisionalId,
                        filename: file.name,
                        mimeType,
                        uploadedAt: new Date().toISOString(),
                        rawBytes: 0,
                        processing: !isImage,
                        driveNodeId: file.id,
                        conversationContext: true,
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
        [
            value,
            mentionState,
            textareaRef,
            setValue,
            dispatch,
            driveSDK,
            createNotification,
            attach,
            closeMention,
            attachedNames,
        ]
    );

    return {
        mentionState,
        files: filteredFiles,
        selectFile,
        closeMention,
        refreshDriveFiles,
    };
};
