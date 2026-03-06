import { useEffect } from 'react';

import { c, msgid } from 'ttag';

import clsx from '@proton/utils/clsx';

import { useInvitationCountStore } from '../../../zustand/share/invitationCount.store';
import { useInvitationsLoader } from '../../sharedWith/loaders/useInvitationsLoader';
import { useSharedWithMeStore } from '../../sharedWith/useSharedWithMe.store';
import { DriveSidebarListItem } from '../DriveSidebarListItem';

interface DriveSidebarSharedWithMeProps {
    shareId?: string;
    collapsed: boolean;
}
export const DriveSidebarSharedWithMe = ({ shareId, collapsed }: DriveSidebarSharedWithMeProps) => {
    const { loadInvitations } = useInvitationsLoader();

    const invitationsCount = useInvitationCountStore((state) => state.invitationCount);

    useEffect(() => {
        const abortController = new AbortController();
        void loadInvitations(abortController.signal);
        return () => {
            abortController.abort();
        };
    }, [loadInvitations]);

    useEffect(() => {
        const abortController = new AbortController();
        // TODO: We need to remove dependency to shared with me store
        void useSharedWithMeStore.getState().subscribeToEvents('driveSidebar', {
            onRefreshSharedWithMe: async () => {
                await loadInvitations(abortController.signal);
            },
        });
        return () => {
            abortController.abort();
            void useSharedWithMeStore.getState().unsubscribeToEvents('driveSidebar');
        };
    }, [loadInvitations]);

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
