import { useState } from 'react';

import { c } from 'ttag';

import { SidebarList } from '@proton/components';
import { useFlag } from '@proton/unleash';
import clsx from '@proton/utils/clsx';

import { DevicesSidebar as DevicesSidebarSDK } from '../../../../sections/devices/DevicesSidebar';
import { type ShareWithKey, useDriveSharingFlags, useUserSettings } from '../../../../store';
import { DriveSidebarDevicesDeprecated } from './DriveSidebarDevices';
import DriveSidebarFolders from './DriveSidebarFolders/DriveSidebarFolders';
import DriveSidebarListItem from './DriveSidebarListItem';
import { DriveSidebarSharedWithMe } from './DriveSidebarSharedWithMe/DriveSidebarSharedWithMe';
import { DriveSidebarSharedWithMeDeprecated } from './DriveSidebarSharedWithMe/DriveSidebarSharedWithMeDeprecated';

interface DriveSidebarListProps {
    shareId?: string;
    userShares: ShareWithKey[];
    collapsed: boolean;
}

const DriveSidebarList = ({ shareId, userShares, collapsed }: DriveSidebarListProps) => {
    const { photosEnabled } = useUserSettings();
    const sdkSharedWithMe = useFlag('DriveWebSDKSharedWithMe');

    const [sidebarWidth, setSidebarWidth] = useState('100%');

    const useSdkDevices = useFlag('DriveWebSDKDevices');

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
            {useSdkDevices ? (
                <DevicesSidebarSDK collapsed={collapsed} setSidebarLevel={setSidebarLevel} />
            ) : (
                <DriveSidebarDevicesDeprecated collapsed={collapsed} setSidebarLevel={setSidebarLevel} />
            )}
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
            {showSharedWithMeSection &&
                (sdkSharedWithMe ? (
                    <DriveSidebarSharedWithMe shareId={shareId} collapsed={collapsed} />
                ) : (
                    <DriveSidebarSharedWithMeDeprecated shareId={shareId} collapsed={collapsed} />
                ))}
            <DriveSidebarListItem to="/trash" icon="trash" shareId={shareId} collapsed={collapsed}>
                <span className={clsx('text-ellipsis', collapsed && 'sr-only')} title={c('Link').t`Trash`}>{c('Link')
                    .t`Trash`}</span>
            </DriveSidebarListItem>
        </SidebarList>
    );
};

export default DriveSidebarList;
