import JSZip from 'jszip';

import { PaperTrailParseError } from './types';

export const CONVERSATIONS_JSON = 'conversations.json';
const CHUNKED_CONVERSATIONS_JSON = /^conversations-\d+\.json$/i;
/** Privacy-portal exports nest chat shards inside Conversations__*-chatgpt-*.zip. */
const NESTED_CONVERSATIONS_ZIP = /conversations.*chatgpt.*\.zip$/i;

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

const listNestedZipPaths = (zip: JSZip): string[] => {
    const zipPaths = Object.keys(zip.files).filter((path) => !zip.files[path].dir && path.toLowerCase().endsWith('.zip'));
    const preferred = zipPaths.filter((path) => NESTED_CONVERSATIONS_ZIP.test(getConversationJsonBasename(path)));

    return (preferred.length > 0 ? preferred : zipPaths).sort((a, b) =>
        getConversationJsonBasename(a).localeCompare(getConversationJsonBasename(b), undefined, { numeric: true })
    );
};

const readConversationJsonFromZipArchive = async (zip: JSZip): Promise<string> => {
    const paths = listConversationJsonPaths(zip);

    if (paths.length > 0) {
        const jsonTexts = await Promise.all(paths.map((path) => zip.file(path)!.async('string')));
        return mergeConversationJsonTexts(jsonTexts);
    }

    const nestedZipPaths = listNestedZipPaths(zip);
    let lastError: PaperTrailParseError | undefined;

    for (const nestedPath of nestedZipPaths) {
        const nestedZip = await JSZip.loadAsync(await zip.file(nestedPath)!.async('arraybuffer'));

        try {
            return await readConversationJsonFromZipArchive(nestedZip);
        } catch (error) {
            if (!(error instanceof PaperTrailParseError)) {
                throw error;
            }
            lastError = error;
        }
    }

    throw (
        lastError ??
        new PaperTrailParseError(
            `Could not find ${CONVERSATIONS_JSON} or conversations-*.json inside the uploaded archive.`
        )
    );
};

export const readConversationsFromZip = async (file: File): Promise<string> => {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    return readConversationJsonFromZipArchive(zip);
};
