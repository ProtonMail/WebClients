import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useCreateMeeting, useGetMeetingDependencies } from '@proton/meet';
import { decryptMeetingName, decryptMeetingPassword } from '@proton/meet/utils/cryptoUtils';
import { CacheType } from '@proton/redux-utilities';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';
import { MeetingType } from '@proton/shared/lib/interfaces/Meet';

import { useGetMeetings, useMeetings } from '../store';

export const useMeetingList = (): [Meeting[] | null, Meeting | null] => {
    const [user] = useUser();

    const [meetings, setMeetings] = useState<Meeting[] | null>(null);
    const [personalMeeting, setPersonalMeeting] = useState<Meeting | null>(null);

    const notifications = useNotifications();

    const [activeMeetings] = useMeetings();

    const getMeetings = useGetMeetings();

    const { createMeeting } = useCreateMeeting();

    const getMeetingDependencies = useGetMeetingDependencies();

    const getDecryptedMeeting = async (meeting: Meeting) => {
        const { userKeys } = await getMeetingDependencies();

        const password = await decryptMeetingPassword(meeting.Password as string, userKeys);

        let meetingName = c('Title').t`Secure meeting`;

        try {
            if (meeting.MeetingName) {
                meetingName = await decryptMeetingName({
                    encryptedMeetingName: meeting.MeetingName,
                    encryptedSessionKey: meeting.SessionKey,
                    password,
                    salt: meeting.Salt,
                });
            }
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
            if (!activeMeetings) {
                return;
            }

            const filteredMeetings = activeMeetings.filter((meeting) =>
                [MeetingType.PERSONAL, MeetingType.RECURRING, MeetingType.SCHEDULED].includes(meeting.Type)
            );

            const meetingsWithDecryptedPassword = await Promise.all(
                filteredMeetings.map(async (meeting) => {
                    return getDecryptedMeeting(meeting);
                })
            );

            setMeetings(meetingsWithDecryptedPassword ?? []);

            const personalMeeting =
                (meetingsWithDecryptedPassword ?? []).find((m) => m.Type === MeetingType.PERSONAL) || null;
            setPersonalMeeting(personalMeeting);
        } catch (error) {
            console.error(error);
        }
    };

    const setupPersonalMeeting = async () => {
        if (
            !meetings ||
            meetings.find((meeting) => meeting.Type === MeetingType.PERSONAL) ||
            (activeMeetings && activeMeetings.find((meeting) => meeting.Type === MeetingType.PERSONAL))
        ) {
            return;
        }

        try {
            const displayName = user?.DisplayName || user?.Name || user?.Email || '';
            const { meeting } = await createMeeting({
                meetingName: c('Title').t`${displayName}'s personal meeting`,
                type: MeetingType.PERSONAL,
            });

            const decryptedPersonalMeeting = await getDecryptedMeeting(meeting);

            setPersonalMeeting(decryptedPersonalMeeting);

            setMeetings((prev) => [...(prev ?? []), decryptedPersonalMeeting]);

            void getMeetings({ cache: CacheType.None });
        } catch (error) {
            notifications.createNotification({
                type: 'error',
                text: c('Error').t`Failed to create personal meeting, please refresh the page`,
            });
        }
    };

    useEffect(() => {
        void handleFetch();
    }, [activeMeetings]);

    useEffect(() => {
        void setupPersonalMeeting();
    }, [meetings]);

    return [meetings, personalMeeting] as const;
};
