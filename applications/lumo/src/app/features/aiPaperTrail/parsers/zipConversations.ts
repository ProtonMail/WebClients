import JSZip from 'jszip';

import { PaperTrailParseError } from './types';

export const CONVERSATIONS_JSON = 'conversations.json';
const CHUNKED_CONVERSATIONS_JSON = /^conversations-\d+\.json$/i;

export const getConversationJsonBasename = (path: string): string => path.split('/').pop() ?? path;

export const isConversationJsonPath = (path: string): boolean => {
    const basename = getConversationJsonBasename(path);
    return basename === CONVERSATIONS_JSON || CHUNKED_CONVERSATIONS_JSON.test(basename);
};

/** Sorted paths to conversation JSON entries inside a ChatGPT/Claude export archive. */
export const listConversationJsonPaths = (zip: JSZip): string[] => {
    return Object.keys(zip.files)
        .filter((path) => !zip.files[path].dir && isConversationJsonPath(path))
        .sort((a, b) =>
            getConversationJsonBasename(a).localeCompare(getConversationJsonBasename(b), undefined, { numeric: true })
        );
};

/** Merge one or more conversations.json / conversations-NNN.json payloads into a single JSON array.
 *  File order does not affect prompt selection: downstream we pick the most recent prompts by timestamp. */
export const mergeConversationJsonTexts = (jsonTexts: string[]): string => {
    const merged: unknown[] = [];

    for (const text of jsonTexts) {
        let data: unknown;
        try {
            data = JSON.parse(text);
        } catch {
            throw new PaperTrailParseError('The uploaded file is not valid JSON.');
        }
        if (!Array.isArray(data)) {
            throw new PaperTrailParseError('Conversation export files must contain a JSON array.');
        }
        merged.push(...data);
    }

    return JSON.stringify(merged);
};

export const readConversationsFromZip = async (file: File): Promise<string> => {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const paths = listConversationJsonPaths(zip);

    if (paths.length === 0) {
        throw new PaperTrailParseError(
            `Could not find ${CONVERSATIONS_JSON} or conversations-*.json inside the uploaded archive.`
        );
    }

    const jsonTexts = await Promise.all(paths.map((path) => zip.file(path)!.async('string')));
    return mergeConversationJsonTexts(jsonTexts);
};
