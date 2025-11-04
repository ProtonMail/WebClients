import { useState } from 'react';

import { c } from 'ttag';

import { SidebarList } from '@proton/components';
import clsx from '@proton/utils/clsx';

import { DevicesSidebar as DevicesSidebarSDK } from '../../../../sections/devices/DevicesSidebar';
import { DriveSidebarSharedWithMe } from '../../../../sections/sidebar/DriveSidebarSharedWithMe/DriveSidebarSharedWithMe';
import { type ShareWithKey, useDriveSharingFlags, useUserSettings } from '../../../../store';
import DriveSidebarFolders from './DriveSidebarFolders/DriveSidebarFolders';
import DriveSidebarListItem from './DriveSidebarListItem';

interface DriveSidebarListProps {
    shareId?: string;
    userShares: ShareWithKey[];
    collapsed: boolean;
}

const DriveSidebarList = ({ shareId, userShares, collapsed }: DriveSidebarListProps) => {
    const { photosEnabled } = useUserSettings();

    const [sidebarWidth, setSidebarWidth] = useState('100%');

    const setSidebarLevel = (level: number) => {
        const extraWidth = Math.floor(level / 7) * 50;
        setSidebarWidth(`${100 + extraWidth}%`);
    };

    const { isDirectSharingDisabled } = useDriveSharingFlags();
    const showSharedWithMeSection = !isDirectSharingDisabled;

    return (
        <SidebarList style={{ width: sidebarWidth, maxWidth: sidebarWidth }}>
            {userShares.map((userShare) => (
                <DriveSidebarFolders
                    key={userShare.shareId}
                    shareId={userShare.shareId}
                    linkId={userShare.rootLinkId}
                    setSidebarLevel={setSidebarLevel}
                    collapsed={collapsed}
                />
            ))}
            <DevicesSidebarSDK collapsed={collapsed} />
            {photosEnabled && (
                <DriveSidebarListItem to="/photos" icon="image" collapsed={collapsed}>
                    <span className={clsx('text-ellipsis', collapsed && 'sr-only')} title={c('Link').t`Photos`}>
                        {c('Link').t`Photos`}
                    </span>
                </DriveSidebarListItem>
            )}
            <DriveSidebarListItem to="/shared-urls" icon="link" shareId={shareId} collapsed={collapsed}>
                <span className={clsx('text-ellipsis', collapsed && 'sr-only')} title={c('Link').t`Shared`}>{c('Link')
                    .t`Shared`}</span>
            </DriveSidebarListItem>
            {showSharedWithMeSection && <DriveSidebarSharedWithMe shareId={shareId} collapsed={collapsed} />}
            <DriveSidebarListItem to="/trash" icon="trash" shareId={shareId} collapsed={collapsed}>
                <span className={clsx('text-ellipsis', collapsed && 'sr-only')} title={c('Link').t`Trash`}>{c('Link')
                    .t`Trash`}</span>
            </DriveSidebarListItem>
        </SidebarList>
    );
};

export default DriveSidebarList;
