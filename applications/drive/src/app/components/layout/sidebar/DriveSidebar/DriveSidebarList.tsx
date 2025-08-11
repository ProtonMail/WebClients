import { useEffect, useState } from 'react';

import { c, msgid } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { SidebarList } from '@proton/components';
import { useFlag } from '@proton/unleash';
import clsx from '@proton/utils/clsx';

import { DevicesSidebar as DevicesSidebarSDK } from '../../../../sections/devices/DevicesSidebar';
import { useInvitationsLoader } from '../../../../sections/sharedWith/loaders/useInvitationsLoader';
import { type ShareWithKey, useDriveSharingFlags, useInvitationsView, useUserSettings } from '../../../../store';
import { useSharedWithMeListingStore } from '../../../../zustand/sections/sharedWithMeListing.store';
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
    const { loadInvitations } = useInvitationsLoader();
    const shouldUseSDK = useFlag('DriveWebSDKSharedWithMe');

    const { getInvitiationCount } = useSharedWithMeListingStore(
        useShallow((state) => ({
            getInvitiationCount: state.getInvitiationCount,
        }))
    );

    const newInvitationsCount = getInvitiationCount();

    useEffect(() => {
        if (!shouldUseSDK) {
            return;
        }
        // TODO: Improve the loadInvitations, to prevent call twice quickly, we could add 30 seconds delay before allowing new request
        const abortController = new AbortController();
        void loadInvitations(abortController.signal);
        return () => {
            abortController.abort();
        };
    }, []);
    const [sidebarWidth, setSidebarWidth] = useState('100%');

    const useSdkDevices = useFlag('DriveWebSDKDevices');

    const setSidebarLevel = (level: number) => {
        const extraWidth = Math.floor(level / 7) * 50;
        setSidebarWidth(`${100 + extraWidth}%`);
    };

    const { isDirectSharingDisabled } = useDriveSharingFlags();
    const showSharedWithMeSection = !isDirectSharingDisabled;

    const invitationsCount = shouldUseSDK ? newInvitationsCount : invitations.length;

    const invitationsCountTitle = c('Info').ngettext(
        msgid`${invitationsCount} pending invitation`,
        `${invitationsCount} pending invitations`,
        invitationsCount
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
                    {!!invitationsCount && (
                        <span
                            className="navigation-counter-item px-1 ml-auto"
                            title={invitationsCountTitle}
                            aria-label={invitationsCountTitle}
                            data-testid="drive-navigation-link:invitations-count"
                        >
                            {invitationsCount}
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
