import React from 'react';
import { match as Match } from 'react-router-dom';
import { Location } from 'history';
import { Sidebar, AppVersion, SidebarNav, SidebarList, SimpleSidebarListItemLink } from 'react-components';
import { c } from 'ttag';

const getSidebarLinks = () => {
    return [
        {
            text: c('Link').t`My files`,
            to: '/drive',
            isActive: (match: Match<any>, location: Location) =>
                !!match && (match.isExact || !location.pathname.includes('trash')),
            icon: 'inbox',
        },
        {
            text: c('Link').t`Trash`,
            to: '/drive/trash',
            icon: 'trash',
        },
    ];
};

const DriveSidebarVersion = () => {
    return <AppVersion appName="ProtonDrive" />;
};

const DriveSidebarLinks = () => (
    <>
        {getSidebarLinks().map(({ text, to, isActive, icon }) => (
            <SimpleSidebarListItemLink key={to} to={to} isActive={isActive} icon={icon}>
                {text}
            </SimpleSidebarListItemLink>
        ))}
    </>
);

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    primary: React.ReactNode;
    links?: React.ReactNode;
    base?: string;
}

const AppSidebar = ({
    primary,
    isHeaderExpanded,
    toggleHeaderExpanded,
    base = '/drive',
    links = <DriveSidebarLinks />,
}: Props) => (
    <Sidebar
        url={base}
        expanded={isHeaderExpanded}
        onToggleExpand={toggleHeaderExpanded}
        primary={primary}
        version={<DriveSidebarVersion />}
    >
        <SidebarNav>
            <SidebarList>{links}</SidebarList>
        </SidebarNav>
    </Sidebar>
);

export default AppSidebar;
