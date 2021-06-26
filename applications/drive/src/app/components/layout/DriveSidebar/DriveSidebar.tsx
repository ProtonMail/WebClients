import React from 'react';
import { Sidebar, SidebarNav } from '@proton/components';
import { useDriveActiveFolder } from '../../Drive/DriveFolderProvider';
import DriveSidebarFooter from './DriveSidebarFooter';
import DriveSidebarList from './DriveSidebarList';

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    primary: React.ReactNode;
    logo: React.ReactNode;
    shareId?: string;
}

const DriveSidebar = ({ shareId, logo, primary, isHeaderExpanded, toggleHeaderExpanded }: Props) => {
    const { folder } = useDriveActiveFolder();

    return (
        <Sidebar
            logo={logo}
            expanded={isHeaderExpanded}
            onToggleExpand={toggleHeaderExpanded}
            primary={primary}
            version={<DriveSidebarFooter />}
        >
            <SidebarNav>
                <DriveSidebarList shareId={shareId ?? folder?.shareId} />
            </SidebarNav>
        </Sidebar>
    );
};

export default DriveSidebar;
