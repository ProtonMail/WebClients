import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectMeetingLinkName } from '@proton/meet/store/slices/currentMeeting';
import { selectSubscriptionStatus } from '@proton/meet/store/slices/userSlice';

import { SettingToggle } from '../../atoms/SettingToggle/SettingToggle';
import { useMeetCoreClient } from '../../contexts/MeetCoreClientContext';
import { useCaptionsAvailability } from '../../hooks/captions/useCaptionsAvailability';

export const LiveCaptionsHostAvailabilityToggle = () => {
    const meetCoreClient = useMeetCoreClient();
    const meetingLinkName = useMeetSelector(selectMeetingLinkName);
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { isCaptionsDisabled } = useCaptionsAvailability();
    const available = !isCaptionsDisabled;
    const { isPaidUser } = useMeetSelector(selectSubscriptionStatus);

    const getLiveCaptionsHostAvailabilityDescription = () => {
        if (!isPaidUser) {
            return c('Info').t`Available with a paid plan`;
        }

        if (available) {
            return c('Info').t`Participants can turn live captions on. Turn on your own under Display.`;
        }

        return c('Info').t`Participants can’t use live captions`;
    };

    const handleChange = () => {
        if (!isPaidUser) {
            return;
        }

        const next = !available;
        void withLoading(
            meetCoreClient.setClosedCaptionsAvailabilityAsHost(meetingLinkName, next).catch((error: unknown) => {
                createNotification({
                    type: 'error',
                    text:
                        (error instanceof Error && error.message) ||
                        c('Error').t`Failed to update live captions availability`,
                });
            })
        );
    };

    return (
        <SettingToggle
            id="live-captions-host-availability"
            label={c('Action').t`Allow live captions`}
            ariaLabel={c('Alt').t`Allow live captions`}
            description={getLiveCaptionsHostAvailabilityDescription()}
            onChange={handleChange}
            checked={available}
            disabled={!isPaidUser}
            loading={loading}
        />
    );
};
