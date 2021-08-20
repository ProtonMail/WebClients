import * as React from 'react';

import { Sidebar, SidebarNav } from '@proton/components';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import DriveSidebarFooter from './DriveSidebarFooter';
import DriveSidebarList from './DriveSidebarList';

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    primary: React.ReactNode;
    logo: React.ReactNode;
}

const DriveSidebar = ({ logo, primary, isHeaderExpanded, toggleHeaderExpanded }: Props) => {
    const { activeShareId } = useActiveShare();

    return (
        <Sidebar
            logo={logo}
            expanded={isHeaderExpanded}
            onToggleExpand={toggleHeaderExpanded}
            primary={primary}
            version={<DriveSidebarFooter />}
        >
            <SidebarNav>
                <DriveSidebarList shareId={activeShareId} />
            </SidebarNav>
        </Sidebar>
    );
};

export default DriveSidebar;
