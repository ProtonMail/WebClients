import { useState } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { SidebarList } from '@proton/components';

import { ShareWithKey, useDriveSharingFlags, usePhotos, usePhotosFeatureFlag } from '../../../../store';
//TODO: This should be removed after full sharing rollout
import { useSharedWithMeWithoutFF } from '../../../../store/_shares/useSharedWithMeWithoutFF';
import { DriveSectionRouteProps } from '../../../sections/Drive/DriveView';
import DriveSidebarDevices from './DriveSidebarDevices';
import DriveSidebarFolders from './DriveSidebarFolders/DriveSidebarFolders';
import DriveSidebarListItem from './DriveSidebarListItem';

interface Props {
    shareId?: string;
    userShares: ShareWithKey[];
}

const DriveSidebarList = ({ shareId, userShares }: Props) => {
    const match = useRouteMatch<DriveSectionRouteProps>();
    const isPhotosEnabled = usePhotosFeatureFlag();
    const { hasPhotosShare } = usePhotos();

    const [sidebarWidth, setSidebarWidth] = useState('100%');
    const setSidebarLevel = (level: number) => {
        const extraWidth = Math.floor(level / 7) * 50;
        setSidebarWidth(`${100 + extraWidth}%`);
    };

    const { isSharingInviteAvailable, isDirectSharingDisabled } = useDriveSharingFlags();
    // We prevent list shared with me items if kill switch enabled (isDirectSharingDisabled)
    const { haveSharedWithMeItems } = useSharedWithMeWithoutFF(isSharingInviteAvailable || isDirectSharingDisabled);
    const showSharedWithMeSection = (isSharingInviteAvailable || haveSharedWithMeItems) && !isDirectSharingDisabled;
    return (
        <SidebarList style={{ width: sidebarWidth, maxWidth: sidebarWidth }}>
            {userShares.map((userShare) => (
                <DriveSidebarFolders
                    key={userShare.shareId}
                    path={match.url}
                    shareId={userShare.shareId}
                    linkId={userShare.rootLinkId}
                    setSidebarLevel={setSidebarLevel}
                />
            ))}
            <DriveSidebarDevices path={match.url} setSidebarLevel={setSidebarLevel} />
            {(isPhotosEnabled || hasPhotosShare) && (
                <DriveSidebarListItem to="/photos" icon="image" isActive={match.url === '/photos'}>
                    <span className="text-ellipsis" title={c('Link').t`Photos`}>
                        {c('Link').t`Photos`}
                    </span>
                </DriveSidebarListItem>
            )}
            <DriveSidebarListItem
                to="/shared-urls"
                icon="link"
                shareId={shareId}
                isActive={match.url === '/shared-urls'}
            >
                <span className="text-ellipsis" title={c('Link').t`Shared`}>{c('Link').t`Shared`}</span>
            </DriveSidebarListItem>
            {showSharedWithMeSection && (
                <DriveSidebarListItem
                    to="/shared-with-me"
                    icon="users"
                    shareId={shareId}
                    isActive={match.url === '/shared-with-me'}
                >
                    <span className="text-ellipsis" title={c('Link').t`Shared with me`}>{c('Link')
                        .t`Shared with me`}</span>
                </DriveSidebarListItem>
            )}
            <DriveSidebarListItem to="/trash" icon="trash" shareId={shareId} isActive={match.url === '/trash'}>
                <span className="text-ellipsis" title={c('Link').t`Trash`}>{c('Link').t`Trash`}</span>
            </DriveSidebarListItem>
        </SidebarList>
    );
};

export default DriveSidebarList;
