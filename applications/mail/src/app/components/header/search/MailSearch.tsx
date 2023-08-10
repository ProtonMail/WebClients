import { useEffect, useState } from 'react';

import { Location } from 'history';

import {
    FeatureCode,
    TopNavbarListItemSearchButton,
    generateUID,
    useAddresses,
    useFolders,
    useLabels,
    useMailSettings,
    usePopperAnchor,
    useProgressiveRollout,
    useToggle,
    useUser,
} from '@proton/components';

import { ADVANCED_SEARCH_OVERLAY_CLOSE_EVENT } from '../../../constants';
import { useEncryptedSearchContext } from '../../../containers/EncryptedSearchProvider';
import { isEncryptedSearchAvailable } from '../../../helpers/encryptedSearch/esUtils';
import { extractSearchParameters } from '../../../helpers/mailboxUrl';
import { useClickMailContent } from '../../../hooks/useClickMailContent';
import { Breakpoints } from '../../../models/utils';
import useEncryptedSearchToggleState from '../useEncryptedSearchToggleState';
import AdvancedSearch from './AdvancedSearch';
import MailSearchInput from './MailSearchInput';
import MailSearchSpotlight from './MailSearchSpotlight';
import SearchOverlay from './SearchOverlay';

import './Search.scss';

interface Props {
    breakpoints: Breakpoints;
    labelID: string;
    location: Location;
    columnMode: boolean;
}

const MailSearch = ({ breakpoints, labelID, location, columnMode }: Props) => {
    const [uid] = useState(generateUID('advanced-search-overlay'));
    const isESUserInterfaceAvailable = useProgressiveRollout(FeatureCode.ESUserInterface);
    const { anchorRef, isOpen, open, close } = usePopperAnchor<HTMLInputElement>();
    const searchParams = extractSearchParameters(location);
    const [searchInputValue, setSearchInputValue] = useState(searchParams.keyword || '');
    const [user] = useUser();
    const [, loadingMailSettings] = useMailSettings();
    const [, loadingLabels] = useLabels();
    const [, loadingFolders] = useFolders();
    const [, loadingAddresses] = useAddresses();
    const { getESDBStatus, cacheIndexedDB, closeDropdown } = useEncryptedSearchContext();
    const { dropdownOpened } = getESDBStatus();
    const esState = useEncryptedSearchToggleState(isOpen);
    const showEncryptedSearch = isEncryptedSearchAvailable(user, isESUserInterfaceAvailable);

    // Show more from inside AdvancedSearch to persist the state when the overlay is closed
    const { state: showMore, toggle: toggleShowMore } = useToggle(false);

    const loading = loadingLabels || loadingFolders || loadingMailSettings || loadingAddresses;

    useEffect(() => {
        if (!isOpen) {
            closeDropdown();
        }
    }, [isOpen]);

    useEffect(() => {
        if (dropdownOpened) {
            open();
        }
    }, [dropdownOpened]);

    useEffect(() => {
        setSearchInputValue(searchParams?.keyword || '');
    }, [location]);

    useClickMailContent(() => {
        close();
    });

    const handleOpen = () => {
        if (isOpen) {
            return;
        }

        if (!loading) {
            anchorRef.current?.blur();
            void cacheIndexedDB();
            open();
        }
    };

    // Listen to close events from composer or iframes
    useEffect(() => {
        document.addEventListener('dropdownclose', close);
        document.addEventListener(ADVANCED_SEARCH_OVERLAY_CLOSE_EVENT, close);

        return () => {
            document.removeEventListener('dropdownclose', close);
            document.removeEventListener(ADVANCED_SEARCH_OVERLAY_CLOSE_EVENT, close);
        };
    }, [close]);

    return (
        <>
            <MailSearchSpotlight canShow={showEncryptedSearch && !isOpen}>
                {breakpoints.isNarrow || breakpoints.isTablet ? (
                    <div className="topnav-listItem flex flex-item-noshrink pl-1">
                        <TopNavbarListItemSearchButton onClick={handleOpen} />
                    </div>
                ) : (
                    <MailSearchInput
                        loading={loading}
                        ref={anchorRef}
                        value={searchInputValue}
                        onChange={setSearchInputValue}
                        onOpen={handleOpen}
                        adaptWidth={columnMode}
                    />
                )}
            </MailSearchSpotlight>
            <SearchOverlay id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <AdvancedSearch
                    isNarrow={breakpoints.isNarrow || breakpoints.isTablet}
                    showEncryptedSearch={showEncryptedSearch}
                    onClose={close}
                    esState={esState}
                    showMore={showMore}
                    toggleShowMore={toggleShowMore}
                    searchInputValue={searchInputValue}
                    labelID={labelID}
                />
            </SearchOverlay>
        </>
    );
};

export default MailSearch;
