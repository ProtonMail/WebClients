import React from 'react';
import { match as Match } from 'react-router-dom';
import { Location } from 'history';
import { c } from 'ttag';

import { Sidebar, AppVersion, SidebarNav, SidebarList, SimpleSidebarListItemLink, Icon } from 'react-components';

const getSidebarLinks = () => {
    return [
        {
            text: c('Link').t`My files`,
            to: '/',
            isActive: (match: Match<any>, location: Location) =>
                !!match && (match.isExact || !location.pathname.includes('trash')),
            icon: 'inbox',
        },
        {
            text: c('Link').t`Trash`,
            to: '/trash',
            icon: 'trash',
        },
    ];
};

const DriveSidebarDescription = () => {
    return (
        <div className="aligncenter opacity-50 mr4 ml4">
            <Icon name="lock-check" size={20} />
            <div className="small m0">{c('Label').t`Encrypted with Zero Access by Proton`}</div>
            <hr className="opacity-30 m0-25" />
        </div>
    );
};

const DriveSidebarVersion = () => <AppVersion appName="ProtonDrive" />;

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
    logo: React.ReactNode;
}

const AppSidebar = ({
    logo,
    primary,
    isHeaderExpanded,
    toggleHeaderExpanded,
    links = <DriveSidebarLinks />,
}: Props) => (
    <Sidebar
        logo={logo}
        expanded={isHeaderExpanded}
        onToggleExpand={toggleHeaderExpanded}
        primary={primary}
        version={
            <>
                <DriveSidebarDescription />
                <DriveSidebarVersion />
            </>
        }
    >
        <SidebarNav>
            <SidebarList>{links}</SidebarList>
        </SidebarNav>
    </Sidebar>
);

export default AppSidebar;
