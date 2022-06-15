import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
    FeatureCode,
    generateUID,
    TopNavbarListItemSearchButton,
    useAddresses,
    useFeature,
    useFolders,
    useLabels,
    useMailSettings,
    usePopperAnchor,
    useToggle,
    useUser,
} from '@proton/components';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { isPaid } from '@proton/shared/lib/user/helpers';
import SearchOverlay from './SearchOverlay';
import AdvancedSearch from './AdvancedSearch';
import SearchInput from './SearchInput';
import { Breakpoints } from '../../../models/utils';
import { useEncryptedSearchContext } from '../../../containers/EncryptedSearchProvider';
import useEncryptedSearchToggleState from '../useEncryptedSearchToggleState';
import { extractSearchParameters } from '../../../helpers/mailboxUrl';
import { useClickMailContent } from '../../../hooks/useClickMailContent';
import { ADVANCED_SEARCH_OVERLAY_CLOSE_EVENT } from '../../../constants';

import './Search.scss';
import MailSearchSpotlight from './MailSearchSpotlight';

interface Props {
    breakpoints: Breakpoints;
}

const MailSearch = ({ breakpoints }: Props) => {
    const location = useLocation();
    const [uid] = useState(generateUID('advanced-search-overlay'));
    const { anchorRef, isOpen, open, close } = usePopperAnchor<HTMLInputElement>();

    const [user] = useUser();
    const [, loadingMailSettings] = useMailSettings();
    const [, loadingLabels] = useLabels();
    const [, loadingFolders] = useFolders();
    const [, loadingAddresses] = useAddresses();
    const { loading: loadingScheduledFeature } = useFeature(FeatureCode.ScheduledSend);
    const { getESDBStatus, cacheIndexedDB, closeDropdown } = useEncryptedSearchContext();
    const { isDBLimited, dropdownOpened } = getESDBStatus();
    const esState = useEncryptedSearchToggleState(isOpen);

    const showEncryptedSearch = !isMobile() && !!isPaid(user);

    // Show more from inside AdvancedSearch to persist the state when the overlay is closed
    const { state: showMore, toggle: toggleShowMore } = useToggle(false);

    const searchParams = extractSearchParameters(location);

    const loading =
        loadingLabels || loadingFolders || loadingMailSettings || loadingAddresses || loadingScheduledFeature;

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

    useClickMailContent(() => {
        close();
    });

    const handleOpen = () => {
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
                {breakpoints.isNarrow ? (
                    <TopNavbarListItemSearchButton onClick={handleOpen} />
                ) : (
                    <SearchInput ref={anchorRef} searchParams={searchParams} onOpen={handleOpen} />
                )}
            </MailSearchSpotlight>
            <SearchOverlay id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <AdvancedSearch
                    isNarrow={breakpoints.isNarrow}
                    showEncryptedSearch={showEncryptedSearch}
                    onClose={close}
                    esState={esState}
                    isDBLimited={isDBLimited}
                    showMore={showMore}
                    toggleShowMore={toggleShowMore}
                />
            </SearchOverlay>
        </>
    );
};

export default MailSearch;
