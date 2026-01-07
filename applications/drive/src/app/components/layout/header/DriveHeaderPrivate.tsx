import type { ReactNode } from 'react';

import { c } from 'ttag';

import { PrivateHeader, UserDropdown, useActiveBreakpoint } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import isSearchFeatureEnabled from '../../../utils/isSearchFeatureEnabled';
import { SearchField } from '../search/SearchField';
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
                actionArea={isSearchFeatureEnabled() && <SearchField />}
                settingsButton={settingsButton}
                upsellButton={SuggestBusinessButton()}
                downloadAppButton={<DownloadAppButton />}
            />
        </>
    );
};
