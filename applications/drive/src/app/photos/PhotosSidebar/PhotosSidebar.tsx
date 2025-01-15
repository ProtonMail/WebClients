import type { ReactNode } from 'react';
import React, { useEffect, useState } from 'react';

import { AppsDropdown, Sidebar, SidebarDrawerItems, SidebarNav } from '@proton/components';
import SidebarStorageUpsell from '@proton/components/containers/payments/subscription/SidebarStorageUpsell';
import useDisplayContactsWidget from '@proton/components/hooks/useDisplayContactsWidget';
import useEffectOnce from '@proton/hooks/useEffectOnce';
import { APPS } from '@proton/shared/lib/constants';
import isEqual from '@proton/shared/lib/helpers/isDeepEqual';

import { useActiveShare } from '../../hooks/drive/useActiveShare';
import type { ShareWithKey } from '../../store';
import { useDefaultShare } from '../../store';
import { logPerformanceMarker } from '../../utils/performance';
import DriveSidebarFooter from './DriveSidebarFooter';
import { PhotosSidebarList } from './PhotosSidebarList';

interface PhotosSidebarProps {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    primary: ReactNode;
    logo: ReactNode;
}

export const PhotosSidebar = ({ logo, primary, isHeaderExpanded, toggleHeaderExpanded }: PhotosSidebarProps) => {
    const { activeShareId } = useActiveShare();
    const { getDefaultShare } = useDefaultShare();
    const [defaultShare, setDefaultShare] = useState<ShareWithKey>();
    useEffectOnce(() => {
        logPerformanceMarker('drive_performance_clicktonavrendered_histogram');
    });

    useEffect(() => {
        void getDefaultShare().then((share) => {
            // This prevents some re-rendering
            // There is no point re-setting the default share if it has not changed
            if (!isEqual(defaultShare, share)) {
                setDefaultShare(share);
            }
        });
    }, [getDefaultShare]);

    const displayContactsInHeader = useDisplayContactsWidget();

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
                    <PhotosSidebarList shareId={activeShareId} />
                    {displayContactsInHeader && <SidebarDrawerItems toggleHeaderDropdown={toggleHeaderExpanded} />}
                </div>
            </SidebarNav>
        </Sidebar>
    );
};
