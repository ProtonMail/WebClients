import React from 'react';
import { Sidebar, SidebarNav } from 'react-components';
import DriveSidebarFooter from './DriveSidebarFooter';
import DriveSidebarList from './DriveSidebarList';

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    primary: React.ReactNode;
    logo: React.ReactNode;
}

const DriveSidebar = ({ logo, primary, isHeaderExpanded, toggleHeaderExpanded }: Props) => (
    <Sidebar
        logo={logo}
        expanded={isHeaderExpanded}
        onToggleExpand={toggleHeaderExpanded}
        primary={primary}
        version={<DriveSidebarFooter />}
    >
        <SidebarNav>
            <DriveSidebarList />
        </SidebarNav>
    </Sidebar>
);

export default DriveSidebar;
