import { isChatGptExport, parseChatGptExport } from './chatgpt';
import { isClaudeExport, parseClaudeExport } from './claude';
import { type NormalizedExport, PaperTrailParseError } from './types';
import { readConversationsFromZip } from './zipConversations';

export type { NormalizedConversation, NormalizedExport, NormalizedUserPrompt, PaperTrailSource } from './types';
export { PaperTrailParseError } from './types';
export {
    CONVERSATIONS_JSON,
    getConversationJsonBasename,
    isConversationJsonPath,
    listConversationJsonPaths,
    mergeConversationJsonTexts,
    readConversationsFromZip,
} from './zipConversations';

const isZip = (file: File): boolean =>
    file.name.toLowerCase().endsWith('.zip') ||
    file.type === 'application/zip' ||
    file.type === 'application/x-zip-compressed';

/** Parse the raw text of a conversations.json into a normalized export. */
export const parseExportText = (text: string): NormalizedExport => {
    let data: unknown;
    try {
        data = JSON.parse(text);
    } catch {
        throw new PaperTrailParseError('The uploaded file is not valid JSON.');
    }

    // ChatGPT is checked first: its `mapping` shape is unambiguous.
    if (isChatGptExport(data)) {
        return parseChatGptExport(data);
    }
    if (isClaudeExport(data)) {
        return parseClaudeExport(data);
    }
    throw new PaperTrailParseError('This does not look like a ChatGPT or Claude export.');
};

/**
 * Parse an uploaded ChatGPT or Claude export. Accepts the raw `conversations.json`
 * or the full `.zip` archive that the providers hand out.
 */
export const parseExportFile = async (file: File): Promise<NormalizedExport> => {
    const text = isZip(file) ? await readConversationsFromZip(file) : await file.text();
    const result = parseExportText(text);

    if (result.conversations.length === 0) {
        throw new PaperTrailParseError('No conversations with user messages were found in this export.');
    }
    return result;
};
