import {
    SEARCH_EVICTION_MAX_REMOVALS_PER_RUN,
    SEARCH_EVICTION_REMOVAL_RATIO,
    SEARCH_MAX_INDEXED_DOCUMENTS,
} from './config';

describe('eviction constant invariants', () => {
    // EvictIndexEntriesTask clamps its per-sweep removal to
    // min(SEARCH_EVICTION_REMOVAL_RATIO * SEARCH_MAX_INDEXED_DOCUMENTS, SEARCH_EVICTION_MAX_REMOVALS_PER_RUN).
    // If the max-removals ceiling is at or below the derived removal, it stops being a defensive
    // backstop and starts actively clamping every sweep - the index then settles above the
    // documented ~SEARCH_MAX_INDEXED_DOCUMENTS, since one sweep removes less than what re-crossing
    // the trigger implies (regression: a sweep starting exactly at the trigger settled at ~52_500,
    // not ~50_000, when this ceiling was 5_000).
    it('SEARCH_EVICTION_MAX_REMOVALS_PER_RUN never clamps the derived per-sweep removal', () => {
        const derivedRemoval = Math.round(SEARCH_MAX_INDEXED_DOCUMENTS * SEARCH_EVICTION_REMOVAL_RATIO);
        expect(SEARCH_EVICTION_MAX_REMOVALS_PER_RUN).toBeGreaterThan(derivedRemoval);
    });
});
