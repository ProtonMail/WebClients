import { useEffect, useState } from 'react';
import * as React from 'react';

import { Sidebar, SidebarNav } from '@proton/components';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import { useDebug } from '../../../hooks/drive/useDebug';
import { ShareWithKey, useDefaultShare } from '../../../store';
import { useCreateDevice } from '../../../store/_shares/useCreateDevice';
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
    const { getDefaultShare } = useDefaultShare();
    const debug = useDebug();

    const [defaultShare, setDefaultShare] = useState<ShareWithKey>();
    const { createDevice } = useCreateDevice();

    useEffect(() => {
        void getDefaultShare().then(setDefaultShare);
    }, [getDefaultShare]);

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
            {debug ? <button onClick={createDevice}>Create device</button> : null}
        </Sidebar>
    );
};

export default DriveSidebar;
