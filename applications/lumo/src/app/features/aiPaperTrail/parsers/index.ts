import { c } from 'ttag';

import { isChatGptExport, parseChatGptExport } from './chatgpt';
import { isClaudeExport, parseClaudeExport } from './claude';
import { type NormalizedExport, PaperTrailParseError } from './types';
import { readConversationsFromZip } from './zipConversations';

export { PaperTrailParseError } from './types';
export type { NormalizedExport, NormalizedUserPrompt } from './types';

const isZip = (file: File): boolean =>
    file.name.toLowerCase().endsWith('.zip') ||
    file.type === 'application/zip' ||
    file.type === 'application/x-zip-compressed';

const isNotReadableError = (error: unknown): boolean =>
    (error instanceof DOMException || error instanceof Error) && error.name === 'NotReadableError';

/** Map low-level file read failures to a short message suitable for the upload UI. */
export const formatPaperTrailFileReadError = (error: unknown): string => {
    if (error instanceof PaperTrailParseError) {
        return error.message;
    }
    if (isNotReadableError(error)) {
        // translator: Error shown when reading an uploaded conversation export or starting its analysis.
        return c('collider_2025:Error')
            .t`We could not read this file. Select it again, or move it out of cloud storage before uploading.`;
    }
    if (error instanceof Error) {
        return error.message;
    }
    // translator: Error shown when reading an uploaded conversation export or starting its analysis.
    return c('collider_2025:Error').t`Could not read this file.`;
};

/** Parse the raw text of a conversations.json into a normalized export. */
export const parseExportText = (text: string): NormalizedExport => {
    let data: unknown;
    try {
        data = JSON.parse(text);
    } catch {
        // translator: Error shown when reading an uploaded conversation export or starting its analysis.
        throw new PaperTrailParseError(c('collider_2025:Error').t`The uploaded file is not valid JSON.`);
    }

    // ChatGPT is checked first: its `mapping` shape is unambiguous.
    if (isChatGptExport(data)) {
        return parseChatGptExport(data);
    }
    if (isClaudeExport(data)) {
        return parseClaudeExport(data);
    }
    // translator: Error shown when reading an uploaded conversation export or starting its analysis.
    throw new PaperTrailParseError(c('collider_2025:Error').t`This does not look like a ChatGPT or Claude export.`);
};

/**
 * Parse an uploaded ChatGPT or Claude export. Accepts the raw `conversations.json`
 * or the full `.zip` archive that the providers hand out.
 */
export const parseExportFile = async (file: File): Promise<NormalizedExport> => {
    let text: string;
    try {
        text = isZip(file) ? await readConversationsFromZip(file) : await file.text();
    } catch (error) {
        throw new PaperTrailParseError(formatPaperTrailFileReadError(error));
    }
    const result = parseExportText(text);

    if (result.conversations.length === 0) {
        // translator: Error shown when reading an uploaded conversation export or starting its analysis.
        throw new PaperTrailParseError(
            c('collider_2025:Error').t`No conversations with user messages were found in this export.`
        );
    }
    return result;
};
