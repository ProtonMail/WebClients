import { useLocation } from 'react-router';

import { c, msgid } from 'ttag';

import { PrivateMainArea } from '@proton/components';

// TODO: handle with container
import useActiveShare from '../../../hooks/drive/useActiveShare';
import { useSearchView } from '../../../store';
import { extractSearchParameters } from '../../../store/_search/utils';
import { FileBrowserStateProvider } from '../../FileBrowser';
import DriveToolbar from '../Drive/DriveToolbar';
import { Search } from './Search';

export function SearchView() {
    const { activeShareId } = useActiveShare();

    const location = useLocation();
    const query = extractSearchParameters(location);

    const searchView = useSearchView(activeShareId, query);

    return (
        <FileBrowserStateProvider itemIds={searchView.items.map(({ linkId }) => linkId)}>
            <DriveToolbar shareId={activeShareId} items={searchView.items} showOptionsForNoSelection={false} />
            <PrivateMainArea hasToolbar className="flex-no-min-children flex-column flex-nowrap">
                <div className="max-w100 text-pre pt1 pb1 pl0-75 pr0-75 border-bottom section--header text-strong">
                    {searchView.isLoading
                        ? c('Title').t`Searching…`
                        : c('Title').ngettext(
                              msgid`Found ${searchView.numberOfResults} result`,
                              `Found ${searchView.numberOfResults} results`,
                              searchView.numberOfResults
                          )}
                </div>
                <Search shareId={activeShareId} searchView={searchView} />
            </PrivateMainArea>
        </FileBrowserStateProvider>
    );
}
