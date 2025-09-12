import { useEffect } from 'react';

import { c, msgid } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import clsx from '@proton/utils/clsx';

import { useSharedWithMeListingStore } from '../../../zustand/sections/sharedWithMeListing.store';
import { useInvitationsLoader } from '../../sharedWith/loaders/useInvitationsLoader';
import { useLegacyLoader } from '../../sharedWith/loaders/useLegacyLoader';
import { DriveSidebarListItem } from '../DriveSidebarListItem';

interface DriveSidebarSharedWithMeProps {
    shareId?: string;
    collapsed: boolean;
}
export const DriveSidebarSharedWithMe = ({ shareId, collapsed }: DriveSidebarSharedWithMeProps) => {
    const { loadInvitations } = useInvitationsLoader();
    const { loadLegacyInvitations } = useLegacyLoader();

    const { subscribeToEvents, unsubscribeToEvents, invitationsCount } = useSharedWithMeListingStore(
        useShallow((state) => ({
            invitationsCount: state.getInvitationCount(),
            subscribeToEvents: state.subscribeToEvents,
            unsubscribeToEvents: state.unsubscribeToEvents,
        }))
    );

    useEffect(() => {
        const abortController = new AbortController();
        void loadInvitations(abortController.signal);
        void loadLegacyInvitations(abortController.signal);
        return () => {
            abortController.abort();
        };
    }, [loadLegacyInvitations, loadInvitations]);

    useEffect(() => {
        const abortController = new AbortController();
        void subscribeToEvents('driveSidebar', {
            onRefreshSharedWithMe: async () => {
                await loadInvitations(abortController.signal);
                await loadLegacyInvitations(abortController.signal);
            },
        });
        return () => {
            abortController.abort();
            void unsubscribeToEvents('driveSidebar');
        };
    }, [subscribeToEvents, unsubscribeToEvents, loadInvitations, loadLegacyInvitations]);

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
