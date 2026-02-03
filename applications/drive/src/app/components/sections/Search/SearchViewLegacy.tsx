import { useEffect } from 'react';
import { useLocation } from 'react-router-dom-v5-compat';

import { c, msgid } from 'ttag';

import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions';

// TODO: handle with container
import { useActiveShare } from '../../../hooks/drive/useActiveShare';
import { useSearchView } from '../../../store';
import { extractSearchParameters } from '../../../store/_search/utils';
import { FileBrowserStateProvider } from '../../FileBrowser';
import DriveToolbar from '../Drive/DriveToolbar';
import ToolbarRow from '../ToolbarRow/ToolbarRow';
import { SearchLegacy } from './SearchLegacy';

export function SearchViewLegacy() {
    const { activeFolder, setDefaultRoot } = useActiveShare();
    useEffect(setDefaultRoot, []);

    const location = useLocation();
    const query = extractSearchParameters(location);

    const searchView = useSearchView(activeFolder.shareId, query);
    const resultCount = searchView.numberOfResults;
    return (
        <FileBrowserStateProvider itemIds={searchView.items.map(({ linkId }) => linkId)}>
            <ToolbarRow
                titleArea={
                    <span className="text-strong pl-1">
                        {searchView.isLoading
                            ? c('Title').t`Searching…`
                            : c('Title').ngettext(
                                  msgid`Found ${resultCount} result`,
                                  `Found ${resultCount} results`,
                                  resultCount
                              )}
                    </span>
                }
                toolbar={
                    <DriveToolbar
                        //TODO: We don't support search view and direct sharing so we assume that user is owner.
                        permissions={SHARE_MEMBER_PERMISSIONS.OWNER}
                        volumeId={activeFolder.volumeId}
                        shareId={activeFolder.shareId}
                        linkId={activeFolder.linkId}
                        items={searchView.items}
                        showOptionsForNoSelection={false}
                    />
                }
            />
            <SearchLegacy shareId={activeFolder.shareId} searchView={searchView} />
        </FileBrowserStateProvider>
    );
}
