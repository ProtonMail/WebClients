import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { type Meeting, useCreateMeeting, useGetMeetingDependencies } from '@proton/meet';
import { useGetActiveMeetings } from '@proton/meet/hooks/useGetActiveMeetings';
import { MeetingType } from '@proton/meet/types/response-types';
import { decryptMeetingName, decryptMeetingPassword } from '@proton/meet/utils/cryptoUtils';

export const useMeetingList = () => {
    const [user] = useUser();

    const [meetings, setMeetings] = useState<Meeting[] | null>(null);

    const { getActiveMeetings } = useGetActiveMeetings();

    const { createMeeting } = useCreateMeeting();

    const getMeetingDependencies = useGetMeetingDependencies();

    const handleFetch = async () => {
        const meetings = await getActiveMeetings();

        const { privateKey } = await getMeetingDependencies();

        const meetingsWithDecryptedPassword = await Promise.all(
            meetings.map(async (meeting) => {
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
            })
        );

        setMeetings(meetingsWithDecryptedPassword ?? []);
    };

    const setupPersonalMeeting = async () => {
        await createMeeting({
            meetingName: c('meet_2025 Title').t`${user.Name}'s Personal Meeting`,
            type: MeetingType.PERSONAL,
        });

        await handleFetch();
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
