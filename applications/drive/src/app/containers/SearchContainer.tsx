import { SearchViewLegacy } from '../legacy/components/sections/Search/SearchViewLegacy';
import { useFlagsDriveFoundationSearch } from '../modules/featureFlag';
import { SearchView } from '../sections/search/searchView';

export const SearchContainer = () => {
    const isFoundationSearchEnabled = useFlagsDriveFoundationSearch();
    if (isFoundationSearchEnabled) {
        return <SearchView />;
    }
    return <SearchViewLegacy />;
};
