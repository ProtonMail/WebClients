import type { ESStatusBooleans } from '@proton/encrypted-search/models';

import { indexedESStatus } from '../../helpers/navigation.test.helpers';
import type { ContentSearchEvidence } from './contentSearch';
import { CONTENT_SEARCH_NOTES, resolveContentSearchCoverage } from './contentSearch';

/** A finished search that Encrypted Search served off a fully indexed device — full coverage. */
const evidence = ({
    esStatus,
    ...overrides
}: Partial<Omit<ContentSearchEvidence, 'esStatus'>> & { esStatus?: Partial<ESStatusBooleans> } = {}) => ({
    settled: true,
    usedEncryptedSearch: true,
    ...overrides,
    esStatus: indexedESStatus(esStatus),
});

describe('resolveContentSearchCoverage', () => {
    it('covers the whole mailbox when Encrypted Search served a finished search off a complete index', () => {
        expect(resolveContentSearchCoverage(evidence())).toBe('full');
    });

    // The case the boolean this replaced got wrong: indexing IS done, so bodies are searched, but the
    // index was capped and the oldest mail never entered it — an empty result proves nothing.
    it('is only partial when a capped index leaves the oldest mail unindexed', () => {
        expect(resolveContentSearchCoverage(evidence({ esStatus: { isDBLimited: true } }))).toBe('partial');
    });

    it.each([
        ['no index on this device', { dbExists: false }],
        ['the user switched it off', { esEnabled: false }],
        ['indexing has not finished', { contentIndexingDone: false }],
    ])('falls back to metadata only when %s', (_case, esStatus) => {
        expect(resolveContentSearchCoverage(evidence({ esStatus }))).toBe('metadata_only');
    });

    // The device-level flags describe what this device COULD search; they stay untouched when a search
    // falls back to the server, which is how a metadata-only miss used to be reported as a full one.
    it('reports metadata only when the search did not go through Encrypted Search, however good the index', () => {
        expect(resolveContentSearchCoverage(evidence({ usedEncryptedSearch: false }))).toBe('metadata_only');
    });

    // Otherwise a list that is still filling reads as an authoritative empty result.
    it('reports an unfinished search ahead of any coverage claim', () => {
        expect(resolveContentSearchCoverage(evidence({ settled: false }))).toBe('unfinished');
    });

    // isSearchPartial is per-search React state that a handler would read one render too early, so the
    // rule must not depend on it — see the note on MailToolDeps.getESStatus.
    it('ignores the per-search partial flag, which is stale by the time a handler reads it', () => {
        expect(resolveContentSearchCoverage(evidence({ esStatus: { isSearchPartial: true } }))).toBe('full');
    });
});

describe('CONTENT_SEARCH_NOTES', () => {
    it('tells the model to trust an empty result only under full coverage', () => {
        expect(CONTENT_SEARCH_NOTES.full).not.toContain('Do NOT');
        expect(CONTENT_SEARCH_NOTES.partial).toContain('Do NOT tell the user no such email exists');
        expect(CONTENT_SEARCH_NOTES.metadata_only).toContain('Do NOT tell the user no such email exists');
        expect(CONTENT_SEARCH_NOTES.unfinished).toContain('Do NOT tell the user no such email exists');
    });
});
