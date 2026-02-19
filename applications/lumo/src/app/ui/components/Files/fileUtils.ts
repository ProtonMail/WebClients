import React from 'react';

import { countAttachmentToken, getFileSizeLevel } from '../../../llm/utils';
import { useLumoSelector } from '../../../redux/hooks';
import { selectAttachmentById } from '../../../redux/selectors';
import type { Attachment } from '../../../types';
import { mimeToHuman } from '../../../util/filetypes';

// Shared hook for file item data
export const useFileItemData = (file: any, attachment?: Attachment) => {
    // Find attachment from store, or use provided attachment
    const attachmentFromStore = useLumoSelector(selectAttachmentById(file.id));
    const fullAttachment = attachmentFromStore || attachment;

    const hasContent = fullAttachment?.markdown && fullAttachment.markdown.trim() !== '';
    const mimeTypeIcon = file.mimeType ?? fullAttachment?.mimeType ?? 'unknown';
    const prettyType = mimeToHuman(file);

    // Memoize expensive token calculations
    const { tokenSize, sizeLevel } = React.useMemo(() => {
        if (!fullAttachment || fullAttachment.processing || !fullAttachment.markdown) {
            return { tokenSize: 0, sizeLevel: 'small' as const };
        }
        const tokens = fullAttachment.tokenCount ?? countAttachmentToken(fullAttachment);
        return {
            tokenSize: tokens,
            sizeLevel: getFileSizeLevel(tokens),
        };
    }, [fullAttachment?.markdown, fullAttachment?.processing, fullAttachment?.tokenCount]);

    // Define preview token limit (150k tokens)
    const PREVIEW_TOKEN_LIMIT = 150000;
    const isTooLargeForPreview = tokenSize > PREVIEW_TOKEN_LIMIT;

    // Can view if has content, not processing, no error, and not too large for preview
    const canView = hasContent && !file.processing && !file.error && !isTooLargeForPreview;

    return {
        fullAttachment,
        hasContent,
        canView: Boolean(canView),
        mimeTypeIcon,
        prettyType,
        tokenSize,
        sizeLevel,
        isTooLargeForPreview,
    };
};

// Shared color mapping utilities
export const getSizeColor = (sizeLevel: string) => {
    switch (sizeLevel) {
        case 'very-large':
            return 'text-bold color-weak';
        case 'large':
            return 'text-bold color-weak';
        default:
            return 'text-normal color-weak';
    }
};

// Shared preview handler creator
export const createPreviewHandler = (
    canView: boolean,
    onView: Function | undefined,
    file: any,
    fullAttachment: any
) => {
    return (e: React.MouseEvent) => {
        e.stopPropagation();
        if (canView && onView) {
            // Handle different onView signatures
            if (onView.length === 1) {
                onView(fullAttachment); // CurrentAttachmentItem
            } else {
                onView(file, fullAttachment, e); // HistoricalFileItem and FileItem
            }
        }
    };
};

/**
 * Format file size in bytes to human readable format
 * @param bytes - Size in bytes
 * @returns Formatted string like "1.2 KB", "5.7 MB", etc.
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
