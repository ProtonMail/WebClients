import { useFlagsDriveFoundationSearch } from '@proton/drive/modules/flags';

import { SearchViewLegacy } from '../legacy/components/sections/Search/SearchViewLegacy';
import { SearchView } from '../sections/search/searchView';

export const SearchContainer = () => {
    const isFoundationSearchEnabled = useFlagsDriveFoundationSearch();
    if (isFoundationSearchEnabled) {
        return <SearchView />;
    }
    return <SearchViewLegacy />;
};
