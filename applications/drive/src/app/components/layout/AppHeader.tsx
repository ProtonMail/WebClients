import React from 'react';
import { PrivateHeader, useActiveBreakpoint } from 'react-components';
import { c } from 'ttag';

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    floatingPrimary: React.ReactNode;
    base?: string;
    title?: string;
}

const AppHeader = ({
    isHeaderExpanded,
    toggleHeaderExpanded,
    floatingPrimary,
    base = 'drive',
    title = c('Title').t`Drive`,
}: Props) => {
    const { isNarrow } = useActiveBreakpoint();
    return (
        <PrivateHeader
            url={base}
            title={title}
            expanded={isHeaderExpanded}
            onToggleExpand={toggleHeaderExpanded}
            isNarrow={isNarrow}
            floatingButton={floatingPrimary}
        />
    );
};

export default AppHeader;
