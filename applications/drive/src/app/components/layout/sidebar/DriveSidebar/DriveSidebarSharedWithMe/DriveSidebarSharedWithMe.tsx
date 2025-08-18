import { useEffect } from 'react';

import { c, msgid } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { DriveEventType, useDrive } from '@proton/drive/index';
import clsx from '@proton/utils/clsx';

import { useBookmarksLoader } from '../../../../../sections/sharedWith/loaders/useBookmarksLoader';
import { useInvitationsLoader } from '../../../../../sections/sharedWith/loaders/useInvitationsLoader';
import { useLegacyLoader } from '../../../../../sections/sharedWith/loaders/useLegacyLoader';
import { useSharedWithMeNodesLoader } from '../../../../../sections/sharedWith/loaders/useSharedWithMeNodesLoader';
import { useSharedWithMeListingStore } from '../../../../../zustand/sections/sharedWithMeListing.store';
import DriveSidebarListItem from '../DriveSidebarListItem';

interface DriveSidebarSharedWithMeProps {
    shareId?: string;
    collapsed: boolean;
}
export const DriveSidebarSharedWithMe = ({ shareId, collapsed }: DriveSidebarSharedWithMeProps) => {
    const { loadSharedWithMeNodes } = useSharedWithMeNodesLoader();
    const { loadInvitations } = useInvitationsLoader();
    const { loadBookmarks } = useBookmarksLoader();
    const { loadLegacySharedWithMeAlbums, loadLegacyInvitations } = useLegacyLoader();
    const { drive } = useDrive();

    const { invitationsCount } = useSharedWithMeListingStore(
        useShallow((state) => ({
            invitationsCount: state.getInvitiationCount(),
        }))
    );

    useEffect(() => {
        const abortController = new AbortController();
        void loadInvitations(abortController.signal);
        return () => {
            abortController.abort();
        };
    }, [loadInvitations]);

    // This needs to be moved inside the store, to match the new SDK Event Manager system
    useEffect(() => {
        const abortController = new AbortController();
        const eventSubscriptionPromise = drive.subscribeToDriveEvents(async (event) => {
            if (event.type === DriveEventType.SharedWithMeUpdated) {
                await Promise.all([
                    loadSharedWithMeNodes(abortController.signal),
                    loadInvitations(abortController.signal),
                    loadLegacySharedWithMeAlbums(abortController.signal),
                    loadLegacyInvitations(abortController.signal),
                ]);
            }
        });
        return () => {
            abortController.abort();
            void eventSubscriptionPromise.then((eventSubscription) => eventSubscription.dispose());
        };
    }, [
        drive,
        loadBookmarks,
        loadInvitations,
        loadLegacyInvitations,
        loadLegacySharedWithMeAlbums,
        loadSharedWithMeNodes,
    ]);

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
