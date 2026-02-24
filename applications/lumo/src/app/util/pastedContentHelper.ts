/**
 * Utility functions for handling pasted content in the composer
 */

import type {Attachment} from '../types';
import {newAttachmentId} from '../redux/slices/core/attachments';
import {getApproximateTokenCount} from '../llm/tokenizer';

/**
 * Configuration for paste-to-attachment conversion
 */
export const PASTE_TO_ATTACHMENT_CONFIG = {
    MIN_LINES: 50,
    MIN_CHARS: 2000,
    DEFAULT_FILENAME: 'pasted-content.txt',
};

/**
 * Check if pasted content should be converted to an attachment
 */
export function shouldConvertPasteToAttachment(content: string): boolean {
    if (!content || typeof content !== 'string') {
        return false;
    }

    const lineCount = content.split('\n').length;
    const charCount = content.length;

    return lineCount >= PASTE_TO_ATTACHMENT_CONFIG.MIN_LINES ||
           charCount >= PASTE_TO_ATTACHMENT_CONFIG.MIN_CHARS;
}

/**
 * Generate a filename for pasted content based on its characteristics
 */
export function generateFilenameForPastedContent(content: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `pasted-content-${timestamp}.txt`;
}

/**
 * Create an attachment from pasted content
 */
export function createAttachmentFromPastedContent(content: string): Attachment {
    const filename = generateFilenameForPastedContent(content);
    const encoder = new TextEncoder();
    const data = encoder.encode(content);

    const mimeType = 'text/plain';

    const filenameHeader = `Filename: ${filename}`;
    const header = 'File contents:';
    const beginMarker = '----- BEGIN FILE CONTENTS -----';
    const endMarker = '----- END FILE CONTENTS -----';
    const fullContext = [filenameHeader, header, beginMarker, content.trim(), endMarker].join('\n');
    const tokenCount = getApproximateTokenCount(fullContext);

    return {
        id: newAttachmentId(),
        mimeType,
        uploadedAt: new Date().toISOString(),
        rawBytes: data.length,
        processing: false,
        filename,
        data,
        markdown: content,
        tokenCount,
    };
}

export function getPasteConversionMessage(lineCount: number, charCount: number): string {
    if (lineCount >= PASTE_TO_ATTACHMENT_CONFIG.MIN_LINES) {
        return `Large content (${lineCount} lines) converted to attachment`;
    }
    return `Large content (${Math.round(charCount / 1000)}K characters) converted to attachment`;
}
