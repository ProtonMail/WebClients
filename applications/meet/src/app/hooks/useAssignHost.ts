import { c } from 'ttag';

import { useApi, useNotifications } from '@proton/components';
import { updateParticipantPermissions } from '@proton/shared/lib/api/meet';

import { useUIStateContext } from '../contexts/UIStateContext';
import { MeetingSideBars, ParticipantCapabilityPermission } from '../types';

export const useAssignHost = (accessToken: string, meetingLinkName: string) => {
    const api = useApi();

    const notifications = useNotifications();

    const { toggleSideBarState } = useUIStateContext();

    const assignHost = async (participantUuid: string) => {
        try {
            await api(
                updateParticipantPermissions(meetingLinkName, participantUuid, {
                    Publish: ParticipantCapabilityPermission.Allowed,
                    PublishData: ParticipantCapabilityPermission.Allowed,
                    Subscribe: ParticipantCapabilityPermission.Allowed,
                    Admin: ParticipantCapabilityPermission.Allowed,
                    AccessToken: accessToken,
                })
            );
            toggleSideBarState(MeetingSideBars.AssignHost);

            notifications.createNotification({
                type: 'success',
                text: c('Success').t`Assigned new host`,
            });
        } catch (err) {
            notifications.createNotification({
                type: 'error',
                text: c('Error').t`Failed to assign host`,
            });
        }
    };

    return assignHost;
};
