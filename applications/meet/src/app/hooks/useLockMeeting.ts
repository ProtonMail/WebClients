import { useState } from 'react';

import { c } from 'ttag';

import { useApi, useNotifications } from '@proton/components';
import { lockMeetingCall, unlockMeetingCall } from '@proton/shared/lib/api/meet';

export const useLockMeeting = () => {
    const api = useApi();
    const { createNotification } = useNotifications();

    const [isMeetingLocked, setIsMeetingLocked] = useState(false);

    const toggleMeetingLock = async (enable: boolean, meetingLinkName: string, accessToken: string) => {
        const call = enable ? lockMeetingCall : unlockMeetingCall;

        try {
            await api(call(meetingLinkName, { AccessToken: accessToken }));
            setIsMeetingLocked(enable);

            createNotification({
                type: 'info',
                text: enable
                    ? c('Info').t`Meeting locked. No new participants can join`
                    : c('Info').t`Meeting unlocked. Participants can join again.`,
            });
        } catch (error) {
            createNotification({
                type: 'error',
                text: enable ? c('Error').t`Failed to lock meeting` : c('Error').t`Failed to unlock meeting`,
            });
        }
    };

    return {
        toggleMeetingLock,
        isMeetingLocked,
    };
};
