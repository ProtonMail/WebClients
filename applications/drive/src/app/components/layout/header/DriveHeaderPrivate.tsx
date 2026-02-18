import type { ReactNode } from 'react';

import { c } from 'ttag';

import { PrivateHeader, UserDropdown, useActiveBreakpoint } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import { useFlagsDriveFoundationSearch } from '../../../flags/useFlagsDriveFoundationSearch';
import { SearchField } from '../../../sections/search/searchField';
import isSearchFeatureEnabled from '../../../utils/isSearchFeatureEnabled';
import { SearchField as LegacySearchField } from '../search/SearchField';
import { DownloadAppButton } from './DownloadAppButton';
import { SuggestBusinessButton } from './SuggestBusinessButton';

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    searchBox?: ReactNode;
    title?: string;
    settingsButton?: ReactNode;
    upsellButton?: ReactNode;
}

const OptionalSearchField = () => {
    const isSearchFoundationEnabled = useFlagsDriveFoundationSearch();
    const isSearchSupported = isSearchFeatureEnabled();

    if (!isSearchSupported) {
        return null;
    }

    return isSearchFoundationEnabled ? <SearchField /> : <LegacySearchField />;
};

export const DriveHeaderPrivate = ({
    isHeaderExpanded,
    toggleHeaderExpanded,
    title = c('Title').t`Drive`,
    settingsButton,
}: Props) => {
    const { viewportWidth } = useActiveBreakpoint();

    return (
        <>
            <PrivateHeader
                app={APPS.PROTONDRIVE}
                userDropdown={<UserDropdown app={APPS.PROTONDRIVE} />}
                title={title}
                expanded={isHeaderExpanded}
                onToggleExpand={toggleHeaderExpanded}
                isSmallViewport={viewportWidth['<=small']}
                actionArea={<OptionalSearchField />}
                settingsButton={settingsButton}
                upsellButton={SuggestBusinessButton()}
                downloadAppButton={<DownloadAppButton />}
            />
        </>
    );
};
