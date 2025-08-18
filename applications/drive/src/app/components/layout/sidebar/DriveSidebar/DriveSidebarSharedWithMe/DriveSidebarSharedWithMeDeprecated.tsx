import { c, msgid } from 'ttag';

import clsx from '@proton/utils/clsx';

import { useInvitationsView } from '../../../../../store';
import DriveSidebarListItem from '../DriveSidebarListItem';

interface DriveSidebarSharedWithMeDeprecatedProps {
    shareId?: string;
    collapsed: boolean;
}

export const DriveSidebarSharedWithMeDeprecated = ({ shareId, collapsed }: DriveSidebarSharedWithMeDeprecatedProps) => {
    const { invitations } = useInvitationsView();
    const invitationsCount = invitations.length;

    const invitationsCountTitle = c('Info').ngettext(
        msgid`${invitationsCount} pending invitation`,
        `${invitationsCount} pending invitations`,
        invitationsCount
    );
    return (
        <DriveSidebarListItem to="/shared-with-me" icon="users" shareId={shareId} collapsed={collapsed}>
            <span className={clsx('text-ellipsis', collapsed && 'sr-only')} title={c('Link').t`Shared with me`}>{c(
                'Link'
            ).t`Shared with me`}</span>
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
    );
};
