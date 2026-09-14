/**
 * Pure, dependency-free helpers for file-mention autocomplete logic.
 * Kept separate from the hook so they can be unit-tested without pulling in
 * the full React / component tree.
 */
import type { Attachment } from '../../../types';
import { isBlockedFileExtension } from '../../../util/filetypes';

export type FileItem = {
    id: string;
    name: string;
    source: 'local' | 'drive';
    /** Populated for files that are already attached to a space. */
    attachment?: Attachment;
    mimeType?: string;
};

/** `name` holds the full path for Drive files, so the filename is its last segment. */
function basenameOf(path: string): string {
    const lastSlash = path.lastIndexOf('/');
    return lastSlash >= 0 ? path.slice(lastSlash + 1) : path;
}

function stripExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.slice(0, lastDot) : filename;
}

/** Filesystem bookkeeping that syncs alongside real documents but carries no user content. */
const OS_METADATA_FILENAMES = new Set(['thumbs.db', 'desktop.ini']);

/**
 * Whether a file is worth offering as an `@` mention.
 *
 * Drive syncs everything it finds, including OS bookkeeping and formats we refuse to read.
 * Offering those is a dead end: the user picks the file and the model receives nothing, so
 * they are hidden from the picker rather than shown and silently dropped later.
 */
export function isMentionableFile(name: string): boolean {
    const basename = basenameOf(name).toLowerCase();

    if (basename.length === 0 || basename.startsWith('.')) {
        return false;
    }
    if (OS_METADATA_FILENAMES.has(basename)) {
        return false;
    }
    return !isBlockedFileExtension(basename);
}

/** Match strength, best first. `NO_MATCH` excludes the file. */
const enum MatchRank {
    NoMatch = 0,
    /** Only a folder in the path matched. */
    FolderContains = 1,
    NameContains = 2,
    NameStartsWith = 3,
    NameExact = 4,
}

function rankMatch(file: FileItem, lowerQuery: string): MatchRank {
    const path = file.name.toLowerCase();
    const basename = basenameOf(path);

    if (basename === lowerQuery || stripExtension(basename) === lowerQuery) {
        return MatchRank.NameExact;
    }
    if (basename.startsWith(lowerQuery)) {
        return MatchRank.NameStartsWith;
    }
    if (basename.includes(lowerQuery)) {
        return MatchRank.NameContains;
    }
    if (path.includes(lowerQuery)) {
        return MatchRank.FolderContains;
    }
    return MatchRank.NoMatch;
}

/**
 * Filters `files` by a case-insensitive `query` and truncates to at most `limit` items.
 *
 * Matches on the filename outrank matches on a folder in its path. Typing `@report` in a
 * project with a `report/` folder should surface `report.pdf` first, not the dozen
 * unrelated files that happen to live under `report/` — and because the limit is applied
 * after ranking, those folder matches can no longer crowd the real file out of the list.
 */
export function filterFiles(files: FileItem[], query: string, limit: number = 10): FileItem[] {
    if (!query) {
        return files.length <= limit ? files : files.slice(0, limit);
    }

    const lowerQuery = query.toLowerCase();

    const ranked = files
        .map((file) => ({ file, rank: rankMatch(file, lowerQuery) }))
        .filter((entry) => entry.rank !== MatchRank.NoMatch);

    ranked.sort((a, b) => {
        if (a.rank !== b.rank) {
            return b.rank - a.rank;
        }
        // Within a tier, the shortest filename is the most specific match.
        const nameLengthDelta = basenameOf(a.file.name).length - basenameOf(b.file.name).length;
        if (nameLengthDelta !== 0) {
            return nameLengthDelta;
        }
        return a.file.name.localeCompare(b.file.name);
    });

    const sorted = ranked.map((entry) => entry.file);
    return sorted.length <= limit ? sorted : sorted.slice(0, limit);
}

/**
 * Returns the set of lowercase filenames that are already fully present as
 * `@<name>` mentions in `composerValue`.
 *
 * A file is only considered "already mentioned" when its exact `@filename`
 * token appears in the text — partial typing (e.g. `@README`) does NOT count.
 */
export function buildAlreadyMentionedNames(files: FileItem[], composerValue: string): Set<string> {
    return new Set(files.filter((f) => composerValue.includes(`@${f.name}`)).map((f) => f.name.toLowerCase()));
}

/**
 * Returns the set of lowercase filenames that are already attached to the
 * composer as provisional chips.
 *
 * Used to avoid creating a duplicate attachment when a user re-mentions a file
 * that is already attached — in that case we only insert the `@filename` text
 * reference instead of dispatching another attachment.
 */
export function buildAttachedNames(attachments: Pick<Attachment, 'filename' | 'driveNodeId'>[]): Set<string> {
    const names = new Set<string>();
    for (const attachment of attachments) {
        names.add(attachment.filename.toLowerCase());
        if (attachment.driveNodeId) {
            names.add(attachment.driveNodeId.toLowerCase());
        }
    }
    return names;
}

/**
 * For Drive-linked projects, drop files whose Drive node no longer exists in the
 * live folder listing (e.g. deleted on Drive but still cached in Redux).
 */
export function filterStaleDriveAttachments(
    files: FileItem[],
    liveDriveFileIds: ReadonlySet<string>,
    isDriveLinkedProject: boolean
): FileItem[] {
    if (!isDriveLinkedProject) {
        return files;
    }

    return files.filter((file) => {
        const driveNodeId = file.source === 'drive' ? file.id : file.attachment?.driveNodeId;
        if (!driveNodeId) {
            return true;
        }
        return liveDriveFileIds.has(driveNodeId);
    });
}
