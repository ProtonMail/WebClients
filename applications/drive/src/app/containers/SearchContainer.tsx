import { SearchViewLegacy } from '../components/sections/Search/SearchViewLegacy';
import { useFlagsDriveFoundationSearch } from '../flags/useFlagsDriveFoundationSearch';
import { SearchView } from '../sections/search/searchView';

export const SearchContainer = () => {
    const isFoundationSearchEnabled = useFlagsDriveFoundationSearch();
    if (isFoundationSearchEnabled) {
        return <SearchView />;
    }
    return <SearchViewLegacy />;
};
