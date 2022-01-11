import * as React from 'react';
import { c } from 'ttag';

import {
    PrivateHeader,
    useActiveBreakpoint,
    TopNavbarListItemContactsDropdown,
    TopNavbarListItemSettingsDropdown,
} from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import { SearchField } from './SearchField';

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    floatingPrimary: React.ReactNode;
    logo: React.ReactNode;
    searchBox?: React.ReactNode;
    title?: string;
}

export const DriveHeader = ({
    logo,
    isHeaderExpanded,
    toggleHeaderExpanded,
    floatingPrimary,
    title = c('Title').t`Drive`,
    searchBox,
}: Props) => {
    const { isNarrow } = useActiveBreakpoint();

    return (
        <PrivateHeader
            logo={logo}
            title={title}
            contactsButton={<TopNavbarListItemContactsDropdown />}
            settingsButton={<TopNavbarListItemSettingsDropdown to="/drive" toApp={APPS.PROTONACCOUNT} />}
            expanded={isHeaderExpanded}
            onToggleExpand={toggleHeaderExpanded}
            isNarrow={isNarrow}
            floatingButton={floatingPrimary}
            searchBox={searchBox}
        />
    );
};

export const DriveHeaderPrivate = (props: Props) => {
    return <DriveHeader {...props} searchBox={<SearchField />} />;
};
