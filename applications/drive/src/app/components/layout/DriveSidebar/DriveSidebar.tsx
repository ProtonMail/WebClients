import * as React from 'react';

import { Sidebar, SidebarNav } from '@proton/components';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import DriveSidebarFooter from './DriveSidebarFooter';
import DriveSidebarList from './DriveSidebarList';
import { useDriveCache } from '../../DriveCache/DriveCacheProvider';

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    primary: React.ReactNode;
    logo: React.ReactNode;
}

const DriveSidebar = ({ logo, primary, isHeaderExpanded, toggleHeaderExpanded }: Props) => {
    const { activeShareId } = useActiveShare();
    const cache = useDriveCache();

    const defaultShare = cache.get.defaultShareMeta();

    /*
     * The sidebar supports multiple shares, but as we currently have
     * only one main share in use, we gonna use the default share only,
     * unless the opposite is decided.
     */
    const shares = defaultShare ? [defaultShare] : [];
    return (
        <Sidebar
            logo={logo}
            expanded={isHeaderExpanded}
            onToggleExpand={toggleHeaderExpanded}
            primary={primary}
            version={<DriveSidebarFooter />}
        >
            <SidebarNav>
                <DriveSidebarList shareId={activeShareId} userShares={shares} />
            </SidebarNav>
        </Sidebar>
    );
};

export default DriveSidebar;
