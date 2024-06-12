import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';

import { DriveEvents } from '../_events';
import { useShareInvitation } from '../_shares';

export const useShareBackgroundActions = () => {
    const { convertExternalInvitation } = useShareInvitation();
    const convertExternalInvitationsFromEvents = ({ events }: DriveEvents) => {
        const abortController = new AbortController();
        for (let event of events) {
            if (event.eventType === EVENT_TYPES.UPDATE_METADATA && event.data?.externalInvitationSignup) {
                void convertExternalInvitation(abortController.signal, {
                    externalInvitationId: event.data.externalInvitationSignup,
                    linkId: event.encryptedLink.linkId,
                });
            }
        }
    };

    return { convertExternalInvitationsFromEvents };
};
