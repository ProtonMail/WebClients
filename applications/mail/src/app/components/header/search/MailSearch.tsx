import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import {
    FeatureCode,
    TopNavbarListItemSearchButton,
    generateUID,
    useAddresses,
    useFeature,
    useFolders,
    useLabels,
    useMailSettings,
    usePopperAnchor,
    useToggle,
} from '@proton/components';
import { isMobile } from '@proton/shared/lib/helpers/browser';

import { ADVANCED_SEARCH_OVERLAY_CLOSE_EVENT } from '../../../constants';
import { useEncryptedSearchContext } from '../../../containers/EncryptedSearchProvider';
import { extractSearchParameters } from '../../../helpers/mailboxUrl';
import { useClickMailContent } from '../../../hooks/useClickMailContent';
import { Breakpoints } from '../../../models/utils';
import useEncryptedSearchToggleState from '../useEncryptedSearchToggleState';
import AdvancedSearch from './AdvancedSearch';
import MailSearchSpotlight from './MailSearchSpotlight';
import SearchInput from './SearchInput';
import SearchOverlay from './SearchOverlay';

import './Search.scss';

interface Props {
    breakpoints: Breakpoints;
}

const MailSearch = ({ breakpoints }: Props) => {
    const location = useLocation();
    const [uid] = useState(generateUID('advanced-search-overlay'));
    const { anchorRef, isOpen, open, close } = usePopperAnchor<HTMLInputElement>();

    const [, loadingMailSettings] = useMailSettings();
    const [, loadingLabels] = useLabels();
    const [, loadingFolders] = useFolders();
    const [, loadingAddresses] = useAddresses();
    const { loading: loadingScheduledFeature } = useFeature(FeatureCode.ScheduledSend);
    const { getESDBStatus, cacheOrIndexMetadata, closeDropdown } = useEncryptedSearchContext();
    const { dropdownOpened, dbExists } = getESDBStatus();
    const esState = useEncryptedSearchToggleState(isOpen);

    const showEncryptedSearch = !isMobile();

    // Show more from inside AdvancedSearch to persist the state when the overlay is closed
    const { state: showMore, toggle: toggleShowMore } = useToggle(false);
    // Show a loader between the time the user interacts with the ES CTA (i.e. the "Activate"
    // button) and when metadata indexing is over. Set back to false in case the ESDB is removed
    const [esInteraction, setESInteraction] = useState<boolean>(false);
    const handleESInteraction = async () => {
        setESInteraction(() => true);
    };
    useEffect(() => {
        if (!dbExists) {
            setESInteraction(() => false);
        }
    }, [dbExists]);

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
            void cacheOrIndexMetadata();
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
                    esInteraction={esInteraction}
                    handleESInteraction={handleESInteraction}
                    showMore={showMore}
                    toggleShowMore={toggleShowMore}
                />
            </SearchOverlay>
        </>
    );
};

export default MailSearch;
