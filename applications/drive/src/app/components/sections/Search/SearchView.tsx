import { c, msgid } from 'ttag';
import { useLocation } from 'react-router';

import { PrivateMainArea } from '@proton/components';

import { useSearchView } from '../../../store';
import { extractSearchParameters } from '../../../store/search/utils'; // TODO: handle with container
import useActiveShare from '../../../hooks/drive/useActiveShare';
import { mapDecryptedLinksToChildren } from '../helpers';
import DriveToolbar from '../Drive/DriveToolbar';
import { Search } from './Search';

export function SearchView() {
    const { activeShareId } = useActiveShare();

    const location = useLocation();
    const query = extractSearchParameters(location);

    const searchView = useSearchView(activeShareId, query);
    const selectedItems = mapDecryptedLinksToChildren(searchView.selectionControls.selectedItems);
    return (
        <>
            <DriveToolbar shareId={activeShareId} selectedItems={selectedItems} showOptionsForNoSelection={false} />
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
        </>
    );
}
