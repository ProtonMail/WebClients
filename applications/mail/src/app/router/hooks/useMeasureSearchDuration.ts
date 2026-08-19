import { useLayoutEffect, useRef } from 'react';

import { isSearch } from '../../helpers/elements';
import type { ElementsStructure } from '../../hooks/mailbox/useElements';

import type { useGetElementParams } from './useGetElementParams';

export function useMeasureSearchDuration(
    elementsParams: ReturnType<typeof useGetElementParams>,
    isSearching: boolean,
    elementsData: ElementsStructure
) {
    // Mark the start of a search whenever the (URL-derived) query changes. Keying on the query
    // means this fires for every way a search can begin — submitting the search form, loading a
    // URL that already has a query (fresh page load), and back/forward navigation — not just form
    // submit. Resetting the ref here re-arms the measurement for the new query.
    //
    // This MUST be a layout effect (not useEffect): React runs all layout effects before any
    // passive effects within a commit, so a useEffect start mark would run *after* the measure's
    // layout effect below — leaving `search-start` undefined when `performance.measure` runs,
    // which throws and produces no entry. Both effects are layout effects, and this one is
    // declared first, so `search-start` is always set before the measure reads it.
    const searchResultsMeasured = useRef(false);
    useLayoutEffect(() => {
        if (isSearch(elementsParams.search)) {
            performance.mark('search-start');
            searchResultsMeasured.current = false;
        }
    }, [elementsParams.search]);

    // Measure search latency up to the first results being ready to paint. Layout effect (runs
    // after commit, before paint) plus a ref guard so only the first render that surfaces results
    // is measured — not the second settled-params pass or pagination.
    useLayoutEffect(() => {
        if (!isSearching) {
            return;
        }
        if (!searchResultsMeasured.current && !elementsData.loading && elementsData.elements.length > 0) {
            searchResultsMeasured.current = true;
            performance.mark('search-results-displayed');
            performance.measure('search', 'search-start', 'search-results-displayed');
        }
    }, [isSearching, elementsData.loading, elementsData.elements.length]);
}
