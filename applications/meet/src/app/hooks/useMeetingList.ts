import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useNotifications } from '@proton/components';
import { type Meeting, useCreateMeeting, useGetMeetingDependencies } from '@proton/meet';
import { useGetActiveMeetings } from '@proton/meet/hooks/useGetActiveMeetings';
import { MeetingType } from '@proton/meet/types/response-types';
import { decryptMeetingName, decryptMeetingPassword } from '@proton/meet/utils/cryptoUtils';

export const useMeetingList = () => {
    const [user] = useUser();

    const [meetings, setMeetings] = useState<Meeting[] | null>(null);

    const notifications = useNotifications();

    const { getActiveMeetings } = useGetActiveMeetings();

    const { createMeeting } = useCreateMeeting();

    const getMeetingDependencies = useGetMeetingDependencies();

    const getEncryptedMeeting = async (meeting: Meeting) => {
        const { privateKey } = await getMeetingDependencies();

        const password = await decryptMeetingPassword(meeting.Password, privateKey);

        let meetingName = 'Secure meeting';

        try {
            meetingName = await decryptMeetingName({
                encryptedMeetingName: meeting.MeetingName,
                encryptedSessionKey: meeting.SessionKey,
                decryptedPassword: password,
                salt: meeting.Salt,
            });
        } catch (err) {
            console.error(err);
        }

        return {
            ...meeting,
            Password: password,
            MeetingName: meetingName,
        };
    };

    const handleFetch = async () => {
        try {
            const meetings = await getActiveMeetings();

            if (!meetings) {
                return;
            }

            const meetingsWithDecryptedPassword = await Promise.all(
                meetings.map(async (meeting) => {
                    return getEncryptedMeeting(meeting);
                })
            );

            setMeetings(meetingsWithDecryptedPassword ?? []);
        } catch (error) {
            console.error(error);
        }
    };

    const setupPersonalMeeting = async () => {
        if (!!meetings?.find((meeting) => meeting.Type === MeetingType.PERSONAL)) {
            return;
        }

        try {
            const { meeting } = await createMeeting({
                meetingName: c('meet_2025 Title').t`${user.Name}'s Personal Meeting`,
                type: MeetingType.PERSONAL,
            });

            const encryptedMeeting = await getEncryptedMeeting(meeting);

            setMeetings((prev) => [...(prev ?? []), encryptedMeeting]);
        } catch (error) {
            notifications.createNotification({
                type: 'error',
                text: c('meet_2025 Error').t`Failed to create personal meeting, please refresh the page`,
            });
        }
    };

    useEffect(() => {
        void handleFetch();
    }, []);

    useEffect(() => {
        if (meetings !== null && !meetings.find((meeting) => meeting.Type === MeetingType.PERSONAL)) {
            void setupPersonalMeeting();
        }
    }, [meetings]);

    return meetings;
};
