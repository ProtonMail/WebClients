import type { ReactNode } from 'react';

import { c } from 'ttag';

import { PrivateHeader, UserDropdown, useActiveBreakpoint } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import isSearchFeatureEnabled from '../../utils/isSearchFeatureEnabled';
import { SearchField } from './search/SearchField';

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    searchBox?: ReactNode;
    title?: string;
    settingsButton?: ReactNode;
}

export const DriveHeader = ({
    isHeaderExpanded,
    toggleHeaderExpanded,
    title = c('Title').t`Drive`,
    searchBox,
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
                actionArea={isSearchFeatureEnabled() && searchBox}
                settingsButton={settingsButton}
            />
        </>
    );
};

export const DriveHeaderPrivate = (props: Props) => {
    return <DriveHeader {...props} searchBox={<SearchField />} />;
};
