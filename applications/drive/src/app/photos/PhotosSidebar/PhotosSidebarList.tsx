import { c, msgid } from 'ttag';

import { SidebarList } from '@proton/components';

import { useDriveSharingFlags, useInvitationsView, useUserSettings } from '../../store';
import DriveSidebarListItem from './DriveSidebarListItem';

interface PhotosSidebarListProps {
    shareId?: string;
}

export const PhotosSidebarList = ({ shareId }: PhotosSidebarListProps) => {
    const { photosEnabled, photosWithAlbumsEnabled } = useUserSettings();
    const { invitations } = useInvitationsView();
    const { isDirectSharingDisabled } = useDriveSharingFlags();
    const showSharedWithMeSection = !isDirectSharingDisabled;

    const invitationsCountTitle = c('Info').ngettext(
        msgid`${invitations.length} pending invitation`,
        `${invitations.length} pending invitations`,
        invitations.length
    );

    return (
        <SidebarList style={{ width: '100%', maxWidth: '100%' }}>
            {photosEnabled && (
                <DriveSidebarListItem
                    to="/photos"
                    forceReload={photosWithAlbumsEnabled}
                    icon="image"
                    isActive={(match) => match?.url === '/photos'}
                >
                    <span className="text-ellipsis" title={c('Link').t`Photos`}>
                        {c('Link').t`Photos`}
                    </span>
                </DriveSidebarListItem>
            )}
            <DriveSidebarListItem
                to="/shared-urls"
                icon="link"
                shareId={shareId}
                isActive={(match) => match?.url === '/shared-urls'}
            >
                <span className="text-ellipsis" title={c('Link').t`Shared`}>{c('Link').t`Shared`}</span>
            </DriveSidebarListItem>
            {showSharedWithMeSection && (
                <DriveSidebarListItem
                    to="/shared-with-me"
                    icon="users"
                    shareId={shareId}
                    isActive={(match) => match?.url === '/shared-with-me'}
                >
                    <span className="text-ellipsis" title={c('Link').t`Shared with me`}>{c('Link')
                        .t`Shared with me`}</span>
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
            <DriveSidebarListItem
                to="/trash"
                icon="trash"
                shareId={shareId}
                isActive={(match) => match?.url === '/trash'}
            >
                <span className="text-ellipsis" title={c('Link').t`Trash`}>{c('Link').t`Trash`}</span>
            </DriveSidebarListItem>
        </SidebarList>
    );
};
