import { useEffect, useState } from 'react';
import { c } from 'ttag';
import { useLocation } from 'react-router-dom';
import {
    FeatureCode,
    generateUID,
    Href,
    Spotlight,
    TopNavbarListItemSearchButton,
    useAddresses,
    useFeatures,
    useFolders,
    useLabels,
    useMailSettings,
    usePopperAnchor,
    useSpotlightOnFeature,
    useToggle,
    useUser,
    useWelcomeFlags,
} from '@proton/components';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { isPaid } from '@proton/shared/lib/user/helpers';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
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
    const [{ loading: loadingESFeature, feature: esFeature }, { loading: loadingScheduledFeature }] = useFeatures([
        FeatureCode.EnabledEncryptedSearch,
        FeatureCode.ScheduledSend,
    ]);
    const [welcomeFlags] = useWelcomeFlags();
    const { getESDBStatus, cacheIndexedDB, closeDropdown } = useEncryptedSearchContext();
    const { isDBLimited, dropdownOpened } = getESDBStatus();
    const esState = useEncryptedSearchToggleState(isOpen);

    const showEncryptedSearch = !isMobile() && !!esFeature && !!esFeature.Value && !!isPaid(user);

    // Show more from inside AdvancedSearch to persist the state when the overlay is closed
    const { state: showMore, toggle: toggleShowMore } = useToggle(false);

    const searchParams = extractSearchParameters(location);

    const loading =
        loadingLabels ||
        loadingFolders ||
        loadingMailSettings ||
        loadingAddresses ||
        loadingESFeature ||
        loadingScheduledFeature;

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

    const { show: showSpotlight, onDisplayed } = useSpotlightOnFeature(
        FeatureCode.SpotlightEncryptedSearch,
        showEncryptedSearch && !welcomeFlags.isWelcomeFlow && !isOpen
    );

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
            <Spotlight
                originalPlacement="bottom"
                show={showSpotlight}
                onDisplayed={onDisplayed}
                content={
                    <>
                        <div className="text-bold text-lg mauto">{c('Spotlight').t`Message Content Search`}</div>
                        {c('Spotlight').t`You can now search the content of your encrypted emails.`}
                        <br />
                        <Href url={getKnowledgeBaseUrl('/search-message-content/')} title="Message Content Search">
                            {c('Info').t`Learn more`}
                        </Href>
                    </>
                }
            >
                {breakpoints.isNarrow ? (
                    <TopNavbarListItemSearchButton onClick={handleOpen} />
                ) : (
                    <SearchInput ref={anchorRef} searchParams={searchParams} onOpen={handleOpen} />
                )}
            </Spotlight>
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
