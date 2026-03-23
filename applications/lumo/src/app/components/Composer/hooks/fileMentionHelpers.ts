/**
 * Pure, dependency-free helpers for file-mention autocomplete logic.
 * Kept separate from the hook so they can be unit-tested without pulling in
 * the full React / component tree.
 */

import type { Attachment } from '../../../types';

export type FileItem = {
    id: string;
    name: string;
    source: 'local' | 'drive';
    /** Populated for files that are already attached to a space. */
    attachment?: Attachment;
    mimeType?: string;
};

/**
 * Filters `files` by a case-insensitive `query` substring and truncates the
 * result to at most `limit` items.
 */
export function filterFiles(files: FileItem[], query: string, limit: number = 10): FileItem[] {
    if (!query) {
        return files.length <= limit ? files : files.slice(0, limit);
    }

    const lowerQuery = query.toLowerCase();
    const filtered = files.filter((file) => file.name.toLowerCase().includes(lowerQuery));
    return filtered.length <= limit ? filtered : filtered.slice(0, limit);
}

/**
 * Returns the set of lowercase filenames that are already fully present as
 * `@<name>` mentions in `composerValue`.
 *
 * A file is only considered "already mentioned" when its exact `@filename`
 * token appears in the text — partial typing (e.g. `@README`) does NOT count.
 */
export function buildAlreadyMentionedNames(files: FileItem[], composerValue: string): Set<string> {
    return new Set(
        files.filter((f) => composerValue.includes(`@${f.name}`)).map((f) => f.name.toLowerCase())
    );
}
