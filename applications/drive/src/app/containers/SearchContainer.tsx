import { SearchViewLegacy } from '../components/sections/Search/SearchViewLegacy';
import { useFlagsDriveSDKSearch } from '../flags/useFlagsDriveSDKSearch';
import { SearchView } from '../sections/search/searchView';

export const SearchContainer = () => {
    const isDriveSDKSearchEnabled = useFlagsDriveSDKSearch();
    if (isDriveSDKSearchEnabled) {
        return <SearchView />;
    }
    return <SearchViewLegacy />;
};
