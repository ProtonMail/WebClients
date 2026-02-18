import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';

import { c } from 'ttag';

import { useNotifications } from '@proton/components/index';
import { generateNodeUid } from '@proton/drive/index';

import { useActiveShare } from '../../../../hooks/drive/useActiveShare';
import { useSearchResults } from '../../../../store/_search';
import { extractSearchParameters } from '../../../../store/_search/utils';
import { useMemoArrayNoMatterTheOrder } from '../../../../store/_views/utils';
import { sendErrorReport } from '../../../../utils/errorHandling';
import type { SearchViewModelAdapter } from '../type';

// An adapter to connect the encrypted-search providers to the stateless DriveExplorer.
// This hook will be the junction point to allow:
//  - migrating the search UI to the new SDK-friendly DriveExplorer while using the encrypted-search library
//  - migrating the encrypted-search library to the new Search Library from foundation in the future.
export const useLegacySearchAdapter = (): SearchViewModelAdapter => {
    // Note: Calling this hook has side-effects and it's required to bootstrap and init the search library.
    const {
        runSearch,
        dbExists,
        isSearching,
        results,
        isSearchSupported,
        enableSearch,
        isEnablingSearch,
        cachedSearchDB,
    } = useSearchResults();

    const { createNotification } = useNotifications();

    const [refreshMarker, setRefreshMarker] = useState(0);

    // The search view is based on url params.
    const location = useLocation();
    // TODO: do not rely on this store/_search/utils package.
    const query = extractSearchParameters(location);

    const enableSearchAction = useCallback(async () => {
        if (!isSearchSupported || isEnablingSearch) {
            // TODO: Warn the user that search is not supported.
            return;
        }

        if (dbExists) {
            return cachedSearchDB();
        }

        await enableSearch();
    }, [isSearchSupported, isEnablingSearch, dbExists]);

    // The search library emits results as unstable arrays (e.g. new reference created
    // on each render) but containing (often) the same uids inside.
    // We need a shallow array encapsulation to prevent rerenders for those cases.
    // We don't care about order since they will reorder by the UI component alter.
    const cachedUnorderedResults = useMemoArrayNoMatterTheOrder(results, refreshMarker);

    // Search results contain only node IDs (linkId), but complete UIDs require both volume ID and node ID.
    // Extract the root volume ID from the default share to construct full UIDs via generateNodeUid.
    const {
        defaultShareRoot: { volumeId: rootFolderVolumeId },
    } = useActiveShare();

    const searchResultUids = useMemo(() => {
        return cachedUnorderedResults.map((esLink) => generateNodeUid(rootFolderVolumeId, esLink.linkId));
    }, [cachedUnorderedResults, rootFolderVolumeId]);

    const doSearch = useCallback(() => {
        if (!dbExists) {
            return;
        }
        runSearch(query).catch((err) => {
            createNotification({
                type: 'error',
                text: c('Error').t`Search failed`,
            });
            sendErrorReport(err);
        });
    }, [dbExists, query]);

    useEffect(() => {
        doSearch();
    }, [doSearch, refreshMarker]); // Use refreshMarker as a dep to refresh the search when required.

    const refresh = useCallback(() => {
        setRefreshMarker((prev) => prev + 1);
    }, []);

    return {
        isSearchEnabled: dbExists,
        isComputingSearchIndex: isEnablingSearch,
        startIndexing: enableSearchAction,
        isSearching,
        resultUids: searchResultUids,
        refreshResults: refresh,
    };
};
