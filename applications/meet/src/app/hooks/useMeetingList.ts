import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useCreateMeeting, useGetMeetingDependencies } from '@proton/meet';
import { decryptMeetingName, decryptMeetingPassword } from '@proton/meet/utils/cryptoUtils';
import { CacheType } from '@proton/redux-utilities';
import { HOUR } from '@proton/shared/lib/constants';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';
import { MeetingType } from '@proton/shared/lib/interfaces/Meet';

import { useGetMeetings, useMeetings } from '../store';
import { saveRotatePersonalMeetingDisable } from '../utils/disableRotatePersonalMeeting';
import { useRotatePersonalMeetingLink } from './useRotatePersonalMeetingLink';

export const useMeetingList = (): [Meeting[] | null, Meeting | null, () => void, boolean] => {
    const [user] = useUser();

    const [meetings, setMeetings] = useState<Meeting[] | null>(null);
    const [personalMeeting, setPersonalMeeting] = useState<Meeting | null>(null);

    const notifications = useNotifications();
    const [loadingRotatePersonalMeeting, withLoadingRotatePersonalMeeting] = useLoading();

    const [activeMeetings] = useMeetings();

    const disableRotateButton = useCallback(() => {
        const disabledUntil = Date.now() + HOUR;
        saveRotatePersonalMeetingDisable(disabledUntil);
    }, []);

    const getMeetings = useGetMeetings();

    const { createMeeting } = useCreateMeeting();

    const { rotatePersonalMeeting } = useRotatePersonalMeetingLink();

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

    const getDefaultPersonalMeetingName = () => {
        const displayName = user?.DisplayName || user?.Name || user?.Email || '';
        return c('Title').t`${displayName}'s personal meeting`;
    };

    const persistPersonalMeetingIntoStore = async (meeting: Meeting) => {
        const decryptedPersonalMeeting = await getDecryptedMeeting(meeting);

        setPersonalMeeting(decryptedPersonalMeeting);

        setMeetings((prev) => [...(prev ?? []), decryptedPersonalMeeting]);

        void getMeetings({ cache: CacheType.None });
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
            const { meeting } = await createMeeting({
                meetingName: getDefaultPersonalMeetingName(),
                type: MeetingType.PERSONAL,
            });

            await persistPersonalMeetingIntoStore(meeting);
        } catch (error) {
            notifications.createNotification({
                type: 'error',
                text: c('Error').t`Failed to create personal meeting, please refresh the page`,
            });
        }
    };

    const setupNewPersonalMeeting = () => {
        return withLoadingRotatePersonalMeeting(async () => {
            try {
                const { meeting } = await rotatePersonalMeeting({
                    meetingName: getDefaultPersonalMeetingName(),
                });

                await persistPersonalMeetingIntoStore(meeting);

                notifications.createNotification({
                    type: 'info',
                    text: c('Notification').t`Successfully rotated your personal meeting`,
                });
            } catch (error) {
                throw error;
            } finally {
                disableRotateButton();
            }
        });
    };

    useEffect(() => {
        void handleFetch();
    }, [activeMeetings]);

    useEffect(() => {
        void setupPersonalMeeting();
    }, [meetings]);

    return [meetings, personalMeeting, setupNewPersonalMeeting, loadingRotatePersonalMeeting] as const;
};
