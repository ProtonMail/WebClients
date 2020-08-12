import React from 'react';
import { PrivateHeader, useActiveBreakpoint } from 'react-components';
import { c } from 'ttag';

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    floatingPrimary: React.ReactNode;
    logo: React.ReactNode;
    title?: string;
}

const AppHeader = ({
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
            expanded={isHeaderExpanded}
            onToggleExpand={toggleHeaderExpanded}
            isNarrow={isNarrow}
            floatingButton={floatingPrimary}
        />
    );
};

export default AppHeader;
