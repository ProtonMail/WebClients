import type { ESStatusBooleans } from '@proton/encrypted-search/models';

export type ContentSearchCoverage = 'full' | 'partial' | 'metadata_only' | 'unfinished';

export interface ContentSearchEvidence {
    esStatus: ESStatusBooleans;
    usedEncryptedSearch: boolean;
    settled: boolean;
}

export const resolveContentSearchCoverage = ({
    esStatus: { dbExists, esEnabled, contentIndexingDone, isDBLimited },
    usedEncryptedSearch,
    settled,
}: ContentSearchEvidence): ContentSearchCoverage => {
    if (!settled) {
        return 'unfinished';
    }

    if (!usedEncryptedSearch || !dbExists || !esEnabled || !contentIndexingDone) {
        return 'metadata_only';
    }

    return isDBLimited ? 'partial' : 'full';
};

/**
 * Model-facing, so untranslated.
 */
export const CONTENT_SEARCH_NOTES: Record<ContentSearchCoverage, string> = {
    full: 'Message bodies were searched, across the whole mailbox.',
    partial:
        'Message bodies were searched, but this device holds a capped index that omits the oldest mail, so a keyword matching only an old email can be missed.',
    metadata_only:
        'Message bodies were NOT searched — only subjects, senders, recipients and dates. A keyword appearing solely inside a body cannot match.',
    unfinished:
        'The search had NOT finished when these results were read, so this list is incomplete however many rows it holds.',
};
