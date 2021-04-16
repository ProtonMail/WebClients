import { APPS } from 'proton-shared/lib/constants';
import React from 'react';
import { PrivateHeader, TopNavbarListItemSettingsButton, useActiveBreakpoint } from 'react-components';
import { c } from 'ttag';

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
    return (
        <PrivateHeader
            logo={logo}
            title={title}
            settingsButton={<TopNavbarListItemSettingsButton to="/drive" toApp={APPS.PROTONACCOUNT} />}
            expanded={isHeaderExpanded}
            onToggleExpand={toggleHeaderExpanded}
            isNarrow={isNarrow}
            floatingButton={floatingPrimary}
        />
    );
};

export default DriveHeader;
