import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useNotifications } from '@proton/components';
import { type Meeting, useCreateMeeting, useGetMeetingDependencies } from '@proton/meet';
import { MeetingType } from '@proton/meet/types/response-types';
import { decryptMeetingName, decryptMeetingPassword } from '@proton/meet/utils/cryptoUtils';

import { useMeetings } from '../store';

export const useMeetingList = (): [Meeting[] | null, Meeting | null] => {
    const [user] = useUser();

    const [meetings, setMeetings] = useState<Meeting[] | null>(null);
    const [personalMeeting, setPersonalMeeting] = useState<Meeting | null>(null);

    const notifications = useNotifications();

    const [activeMeetings] = useMeetings();

    const { createMeeting } = useCreateMeeting();

    const getMeetingDependencies = useGetMeetingDependencies();

    const getDecryptedMeeting = async (meeting: Meeting) => {
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
        if (!meetings) {
            return;
        }

        const personalMeeting = meetings.find((meeting) => meeting.Type === MeetingType.PERSONAL);
        if (personalMeeting) {
            const decryptedPersonalMeeting = await getDecryptedMeeting(personalMeeting);
            setPersonalMeeting(decryptedPersonalMeeting);
            return;
        }

        try {
            const { meeting } = await createMeeting({
                meetingName: c('meet_2025 Title').t`${user.Name}'s Personal Meeting`,
                type: MeetingType.PERSONAL,
            });

            const decryptedPersonalMeeting = await getDecryptedMeeting(meeting);

            setPersonalMeeting(decryptedPersonalMeeting);

            setMeetings((prev) => [...(prev ?? []), decryptedPersonalMeeting]);
        } catch (error) {
            notifications.createNotification({
                type: 'error',
                text: c('meet_2025 Error').t`Failed to create personal meeting, please refresh the page`,
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
