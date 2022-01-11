import { c } from 'ttag';

import { PrivateMainArea } from '@proton/components';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import { useSearchResultsStorage } from '../../search/SearchResultsStorage';
import { SearchContentProvider } from './SearchContentProvider';
import { Search } from './Search';
import { SearchToolbar } from './SearchToolbar';

export function SearchView() {
    const { getResults, isSearchInProgress } = useSearchResultsStorage();
    const { activeShareId } = useActiveShare();
    const searchResults = getResults();
    return (
        <SearchContentProvider shareId={activeShareId}>
            <SearchToolbar shareId={activeShareId} />
            <PrivateMainArea hasToolbar className="flex-no-min-children flex-column flex-nowrap">
                <div className="max-w100 text-pre pt1 pb1 pl0-75 pr0-75 border-bottom section--header text-strong">
                    {isSearchInProgress
                        ? c('Title').t`Searching...`
                        : c('Title').t`Search results: ${searchResults.length} found`}
                </div>
                <Search shareId={activeShareId} />
            </PrivateMainArea>
        </SearchContentProvider>
    );
}
