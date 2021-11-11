import { APPS } from '@proton/shared/lib/constants';
import * as React from 'react';
import { useHistory } from 'react-router-dom';
import { Location } from 'history';
import {
    PrivateHeader,
    useActiveBreakpoint,
    TopNavbarListItemContactsDropdown,
    TopNavbarListItemSettingsDropdown,
    Searchbox,
} from '@proton/components';
import { c } from 'ttag';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';
import { ESFile } from '../../helpers/encryptedSearchDriveHelpers';

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    floatingPrimary: React.ReactNode;
    logo: React.ReactNode;
    title?: string;
}

const DriveHeader = ({
    logo,
    isHeaderExpanded,
    toggleHeaderExpanded,
    floatingPrimary,
    title = c('Title').t`Drive`,
}: Props) => {
    const { isNarrow } = useActiveBreakpoint();

    /* ES PoC */
    const { encryptedSearch, cacheIndexedDB, getESDBStatus } = useEncryptedSearchContext();
    const history = useHistory();
    const { dbExists } = getESDBStatus();

    const getSearchParams = (search: string): { [key: string]: string } => {
        let searchHash = search;
        if (searchHash) {
            searchHash = searchHash[0] === '#' ? `?${search.slice(1)}` : searchHash;
        }

        const params = new URLSearchParams(searchHash);

        const result: { [key: string]: string } = {};

        params.forEach((value, key) => {
            result[key] = value;
        });

        return result;
    };

    const handleSearch = React.useCallback((location: Location, keyword = '') => {
        const queryString = `keyword=${keyword.trim()}`;
        const urlFragment = (queryString === '' ? '' : '#') + queryString;
        history.push(location.pathname + urlFragment);
    }, []);

    const extractSearchParameters = (location: Location) => {
        return getSearchParams(location.hash);
    };

    // Update the search input field when the keyword in the url is changed
    const { keyword = '' } = extractSearchParameters(history.location);
    const [value, updateValue] = React.useState(keyword);
    React.useEffect(() => updateValue(keyword), [keyword]);

    const searchBox = dbExists && (
        <Searchbox
            delay={0}
            placeholder={c('Placeholder').t`Search file names`}
            onSearch={(keyword) => {
                handleSearch(history.location, keyword);
                void encryptedSearch('', (Elements: ESFile[]) => console.log(Elements)); // eslint-disable-line
            }}
            onChange={updateValue}
            value={value}
            onFocus={() => cacheIndexedDB()}
        />
    );
    /* ES PoC */

    return (
        <PrivateHeader
            logo={logo}
            title={title}
            contactsButton={<TopNavbarListItemContactsDropdown />}
            settingsButton={<TopNavbarListItemSettingsDropdown to="/drive" toApp={APPS.PROTONACCOUNT} />}
            expanded={isHeaderExpanded}
            onToggleExpand={toggleHeaderExpanded}
            isNarrow={isNarrow}
            floatingButton={floatingPrimary}
            searchBox={searchBox}
        />
    );
};

export default DriveHeader;
