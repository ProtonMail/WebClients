import { c } from 'ttag';

import type { ArtifactType } from '../../components/Conversation/artifact/parseArtifacts';
import type { CreationsListItem } from '../creations/hooks/useGeneratedGalleryCreations';

export type LibraryCreationFilter = 'all' | ArtifactType;
export type LibrarySortOrder = 'newest' | 'oldest';

/** A listed creation plus what is known once its encrypted asset has been decrypted. */
export interface LibraryCreationEntry {
    item: CreationsListItem;
    title: string;
    artifactType?: ArtifactType;
    conversationTitle?: string;
}

interface FilterOptions {
    filter: LibraryCreationFilter;
    query: string;
    sort: LibrarySortOrder;
}

/**
 * Applies the type chip, the search box and the sort order. Entries still decrypting have no type
 * or title yet, so they only show under "All" with an empty search.
 */
export function filterAndSortCreations(
    entries: LibraryCreationEntry[],
    { filter, query, sort }: FilterOptions
): LibraryCreationEntry[] {
    const needle = query.trim().toLowerCase();

    const matching = entries.filter((entry) => {
        if (filter !== 'all' && entry.artifactType !== filter) {
            return false;
        }
        if (!needle) {
            return true;
        }
        return [entry.title, entry.conversationTitle].some((text) => {
            return text?.toLowerCase().includes(needle);
        });
    });

    return matching.sort((a, b) => {
        const difference = a.item.createdAt.getTime() - b.item.createdAt.getTime();
        return sort === 'newest' ? -difference : difference;
    });
}

export function getLibraryTypeLabel(type: ArtifactType): string {
    switch (type) {
        case 'document':
            return c('collider_2025:Info').t`Document`;
        case 'code':
            return c('collider_2025:Info').t`Code`;
        case 'webpage':
            return c('collider_2025:Info').t`Web`;
        case 'presentation':
            return c('collider_2025:Info').t`Slides`;
        default:
            return type;
    }
}

export function getLibraryFilterLabel(filter: LibraryCreationFilter): string {
    switch (filter) {
        case 'all':
            return c('collider_2025:Action').t`All`;
        case 'document':
            return c('collider_2025:Action').t`Documents`;
        case 'code':
            return c('collider_2025:Action').t`Code`;
        case 'webpage':
            return c('collider_2025:Action').t`Web`;
        case 'presentation':
            return c('collider_2025:Action').t`Slides`;
        default:
            return filter;
    }
}

// Names for the extensions code artifacts are saved with (see getFileExtension in parseArtifacts).
const FORMAT_NAMES: Record<string, string> = {
    md: 'Markdown',
    html: 'HTML',
    py: 'Python',
    js: 'JavaScript',
    jsx: 'JavaScript',
    ts: 'TypeScript',
    tsx: 'TypeScript',
    sh: 'Shell',
    sql: 'SQL',
    json: 'JSON',
    css: 'CSS',
    scss: 'SCSS',
    rs: 'Rust',
    go: 'Go',
    java: 'Java',
    kt: 'Kotlin',
    swift: 'Swift',
    cpp: 'C++',
    c: 'C',
    cs: 'C#',
    rb: 'Ruby',
    php: 'PHP',
    yaml: 'YAML',
    yml: 'YAML',
    toml: 'TOML',
    xml: 'XML',
    r: 'R',
    txt: 'Text',
};

/** The stored file's format, from its extension: "Markdown", "TypeScript", "HTML"… */
export function getLibraryFormatLabel(filename: string | undefined): string | undefined {
    const extension = filename?.match(/\.([a-z0-9+]+)$/i)?.[1]?.toLowerCase();
    if (!extension) {
        return undefined;
    }
    return FORMAT_NAMES[extension] ?? extension.toUpperCase();
}
