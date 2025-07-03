import { useState } from 'react';

import { c, msgid } from 'ttag';

import { SidebarList } from '@proton/components';
import { useFlag } from '@proton/unleash';
import clsx from '@proton/utils/clsx';

import { DevicesSidebar as DevicesSidebarSDK } from '../../../../sections/devices/DevicesSidebar';
import { type ShareWithKey, useDriveSharingFlags, useInvitationsView, useUserSettings } from '../../../../store';
import { DriveSidebarDevicesDeprecated } from './DriveSidebarDevices';
import DriveSidebarFolders from './DriveSidebarFolders/DriveSidebarFolders';
import DriveSidebarListItem from './DriveSidebarListItem';

interface DriveSidebarListProps {
    shareId?: string;
    userShares: ShareWithKey[];
    collapsed: boolean;
}

const DriveSidebarList = ({ shareId, userShares, collapsed }: DriveSidebarListProps) => {
    const { photosEnabled } = useUserSettings();
    const { invitations } = useInvitationsView();
    const [sidebarWidth, setSidebarWidth] = useState('100%');

    const useSdkDevices = useFlag('DriveWebSDKDevices');

    const setSidebarLevel = (level: number) => {
        const extraWidth = Math.floor(level / 7) * 50;
        setSidebarWidth(`${100 + extraWidth}%`);
    };

    const { isDirectSharingDisabled } = useDriveSharingFlags();
    const showSharedWithMeSection = !isDirectSharingDisabled;

    const invitationsCountTitle = c('Info').ngettext(
        msgid`${invitations.length} pending invitation`,
        `${invitations.length} pending invitations`,
        invitations.length
    );

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
            {showSharedWithMeSection && (
                <DriveSidebarListItem to="/shared-with-me" icon="users" shareId={shareId} collapsed={collapsed}>
                    <span
                        className={clsx('text-ellipsis', collapsed && 'sr-only')}
                        title={c('Link').t`Shared with me`}
                    >{c('Link').t`Shared with me`}</span>
                    {!!invitations.length && (
                        <span
                            className="navigation-counter-item px-1 ml-auto"
                            title={invitationsCountTitle}
                            aria-label={invitationsCountTitle}
                            data-testid="drive-navigation-link:invitations-count"
                        >
                            {invitations.length}
                        </span>
                    )}
                </DriveSidebarListItem>
            )}
            <DriveSidebarListItem to="/trash" icon="trash" shareId={shareId} collapsed={collapsed}>
                <span className={clsx('text-ellipsis', collapsed && 'sr-only')} title={c('Link').t`Trash`}>{c('Link')
                    .t`Trash`}</span>
            </DriveSidebarListItem>
        </SidebarList>
    );
};

export default DriveSidebarList;
