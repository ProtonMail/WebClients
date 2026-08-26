import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import type { ESStatusBooleans, EnableContentSearch } from '@proton/encrypted-search/models';

/**
 * Announces content search once the index can actually answer a query, and returns the
 * `enableContentSearch` to expose in its place.
 *
 * The search library announces this itself when *its own* indexing ends, which is too early under
 * content search v2: the index only becomes searchable once the import that follows has finished. But
 * both paths report readiness the same way — `isEnablingContentSearch` stays true until the index is
 * usable, then flips together with `contentIndexingDone` — so hanging the notification off that
 * transition keeps it correct for either engine without knowing which one is running. (The message is
 * therefore no longer passed to the library; see `EncryptedSearchProvider`.)
 *
 * Only a run the user asked for is announced. Indexing can also resume on its own — at startup, or to
 * finish off an interrupted import — and that shouldn't be reported as if the user had just enabled
 * the feature. Which one it is isn't visible in the status, so it's taken from the `notify` option of
 * the call that started it, exactly as the library does.
 */
export const useContentSearchReadyNotification = (
    { isEnablingContentSearch, contentIndexingDone }: ESStatusBooleans,
    enableContentSearch: EnableContentSearch
): EnableContentSearch => {
    const { createNotification } = useNotifications();
    const wasIndexing = useRef(isEnablingContentSearch);
    const shouldAnnounce = useRef(false);

    useEffect(() => {
        const justFinished = wasIndexing.current && !isEnablingContentSearch && contentIndexingDone;
        wasIndexing.current = isEnablingContentSearch;

        if (justFinished && shouldAnnounce.current) {
            shouldAnnounce.current = false;
            createNotification({ text: c('Success').t`Message content search enabled` });
        }
    }, [isEnablingContentSearch, contentIndexingDone, createNotification]);

    return (options) => {
        // Same default as the library's `enableContentSearch`: announce unless told otherwise.
        shouldAnnounce.current = options?.notify ?? true;
        return enableContentSearch(options);
    };
};
