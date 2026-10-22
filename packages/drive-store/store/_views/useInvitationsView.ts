import { useEffect } from 'react';

import useLoading from '@proton/hooks/useLoading';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';

import { sendErrorReport } from '../../utils/errorHandling';
import { useDriveEventManager } from '../_events/useDriveEventManager';
import { useInvitationsListing } from '../_invitations/useInvitationsListing';
import { useMemoArrayNoMatterTheOrder } from './utils/objectId';

export const useInvitationsView = () => {
    const [isLoading, withLoading] = useLoading(true);
    const { getCachedInvitations, loadInvitations } = useInvitationsListing();
    const driveEventManager = useDriveEventManager();
    const cachedInvitations = getCachedInvitations();

    const invitations = useMemoArrayNoMatterTheOrder(
        cachedInvitations.filter((invitation) => invitation.link.type !== LinkType.ALBUM)
    );

    useEffect(() => {
        const abortController = new AbortController();
        const unsubscribe = driveEventManager.eventHandlers.subscribeToCore((event) => {
            if (event.DriveShareRefresh?.Action === EVENT_ACTIONS.UPDATE) {
                loadInvitations(abortController.signal).catch(sendErrorReport);
            }
        });
        return () => {
            unsubscribe();
            abortController.abort();
        };
    }, [driveEventManager.eventHandlers.subscribeToCore]);

    useEffect(() => {
        const abortController = new AbortController();
        void withLoading(loadInvitations(abortController.signal).catch(sendErrorReport));

        return () => {
            abortController.abort();
        };
    }, []);

    return { invitations, isLoading };
};
