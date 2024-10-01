import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { AppsDropdown, Sidebar, SidebarDrawerItems, SidebarNav } from '@proton/components';
import SidebarStorageUpsell from '@proton/components/containers/payments/subscription/SidebarStorageUpsell';
import useDisplayContactsWidget from '@proton/components/hooks/useDisplayContactsWidget';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import { APPS } from '@proton/shared/lib/constants';

import useActiveShare from '../../../../hooks/drive/useActiveShare';
import { useDebug } from '../../../../hooks/drive/useDebug';
import type { ShareWithKey } from '../../../../store';
import { useDefaultShare } from '../../../../store';
import { useCreateDevice } from '../../../../store/_shares/useCreateDevice';
import { useCreatePhotos } from '../../../../store/_shares/useCreatePhotos';
import { logPerformanceMarker } from '../../../../utils/performance';
import DriveSidebarFooter from './DriveSidebarFooter';
import DriveSidebarList from './DriveSidebarList';

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    primary: ReactNode;
    logo: ReactNode;
}

const DriveSidebar = ({ logo, primary, isHeaderExpanded, toggleHeaderExpanded }: Props) => {
    const { activeShareId } = useActiveShare();
    const { getDefaultShare } = useDefaultShare();
    const debug = useDebug();

    const [defaultShare, setDefaultShare] = useState<ShareWithKey>();
    const { createDevice } = useCreateDevice();
    const { createPhotosShare } = useCreatePhotos();

    useEffectOnce(() => {
        logPerformanceMarker('drive_performance_clicktonavrendered_histogram');
    });
    useEffect(() => {
        void getDefaultShare().then(setDefaultShare);
    }, [getDefaultShare]);

    const displayContactsInHeader = useDisplayContactsWidget();

    /*
     * The sidebar supports multiple shares, but as we currently have
     * only one main share in use, we gonna use the default share only,
     * unless the opposite is decided.
     */
    const shares = defaultShare ? [defaultShare] : [];
    return (
        <Sidebar
            app={APPS.PROTONDRIVE}
            appsDropdown={<AppsDropdown app={APPS.PROTONDRIVE} />}
            logo={logo}
            expanded={isHeaderExpanded}
            onToggleExpand={toggleHeaderExpanded}
            primary={primary}
            version={<DriveSidebarFooter />}
            growContent={false}
            postFooter={<SidebarStorageUpsell app={APPS.PROTONDRIVE} />}
        >
            <SidebarNav>
                <div>
                    <DriveSidebarList shareId={activeShareId} userShares={shares} />
                    {displayContactsInHeader && <SidebarDrawerItems toggleHeaderDropdown={toggleHeaderExpanded} />}
                </div>
            </SidebarNav>
            {debug ? <button onClick={createDevice}>Create device</button> : null}
            {debug ? <button onClick={createPhotosShare}>Create photos</button> : null}
        </Sidebar>
    );
};

export default DriveSidebar;
