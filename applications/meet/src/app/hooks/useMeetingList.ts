import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { useCreateMeeting, useGetMeetingDependencies } from '@proton/meet';
import { useGetMeetings, useMeetings } from '@proton/meet/store/hooks/useMeetings';
import { decryptMeetingName, decryptMeetingPassword } from '@proton/meet/utils/cryptoUtils';
import { CacheType } from '@proton/redux-utilities';
import { HOUR } from '@proton/shared/lib/constants';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import type { Meeting } from '@proton/shared/lib/interfaces/Meet';
import { MeetingType } from '@proton/shared/lib/interfaces/Meet';
import isTruthy from '@proton/utils/isTruthy';

import { saveRotatePersonalMeetingDisable } from '../utils/disableRotatePersonalMeeting';
import { useRotatePersonalMeetingLink } from './useRotatePersonalMeetingLink';

const DECRYPTION_BATCH_SIZE = 5;
export enum MeetingListStatus {
    InitialLoading = 0,
    InitialDecrypting = 1,
    Done = 2,
    Error = 3,
}

export const useMeetingList = (): [Meeting[] | null, Meeting | null, () => void, boolean, MeetingListStatus] => {
    const personalMeetingName = c('Title').t`Personal meeting room`;

    const [meetings, setMeetings] = useState<Meeting[] | null>(null);
    const [personalMeeting, setPersonalMeeting] = useState<Meeting | null>(null);
    const [status, setStatus] = useState<MeetingListStatus>(MeetingListStatus.InitialLoading);

    const notifications = useNotifications();
    const [loadingRotatePersonalMeeting, withLoadingRotatePersonalMeeting] = useLoading();

    const [activeMeetings]: [Meeting[] | undefined, boolean] = useMeetings();

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

        try {
            const password = await decryptMeetingPassword(meeting.Password as string, userKeys);

            let meetingName = c('Title').t`Secure meeting`;

            if (meeting.MeetingName) {
                meetingName = await decryptMeetingName({
                    encryptedMeetingName: meeting.MeetingName,
                    encryptedSessionKey: meeting.SessionKey,
                    password,
                    salt: meeting.Salt,
                });
            }

            return {
                ...meeting,
                Password: password,
                MeetingName: meetingName,
            };
        } catch (err) {
            return null;
        }
    };

    const handleFetch = async () => {
        try {
            if (!activeMeetings) {
                return;
            }

            const filteredMeetings = activeMeetings.filter((meeting: Meeting) =>
                [MeetingType.PERSONAL, MeetingType.RECURRING, MeetingType.SCHEDULED, MeetingType.PERMANENT].includes(
                    meeting.Type
                )
            );

            if (MeetingListStatus.InitialLoading === status) {
                setStatus(MeetingListStatus.InitialDecrypting);
            }
            const decryptionTasks = filteredMeetings.map((meeting: Meeting) => () => getDecryptedMeeting(meeting));
            const decryptedMeetings = await runInQueue(decryptionTasks, DECRYPTION_BATCH_SIZE);

            const validDecryptedMeetings: Meeting[] = decryptedMeetings.filter(isTruthy) as Meeting[];

            setMeetings(validDecryptedMeetings);
            setStatus(MeetingListStatus.Done);
            const personalMeeting =
                validDecryptedMeetings.find((m: Meeting) => m.Type === MeetingType.PERSONAL) || null;
            setPersonalMeeting(personalMeeting);
        } catch (error) {
            setPersonalMeeting(null);
            setMeetings([]);
            setStatus(MeetingListStatus.Error);
        }
    };

    const persistPersonalMeetingIntoStore = async (meeting: Meeting) => {
        const decryptedPersonalMeeting = await getDecryptedMeeting(meeting);

        if (!decryptedPersonalMeeting) {
            return;
        }

        setPersonalMeeting(decryptedPersonalMeeting);

        setMeetings((prev) => {
            const prevMeetings = prev ?? [];
            // Replace existing personal meeting instead of appending
            const withoutPersonalMeeting = prevMeetings.filter((m) => m.Type !== MeetingType.PERSONAL);
            return [...withoutPersonalMeeting, decryptedPersonalMeeting];
        });

        void getMeetings({ cache: CacheType.None });
    };

    const setupPersonalMeeting = async () => {
        if (
            !meetings ||
            meetings.find((meeting: Meeting) => meeting.Type === MeetingType.PERSONAL) ||
            (activeMeetings && activeMeetings.find((meeting: Meeting) => meeting.Type === MeetingType.PERSONAL))
        ) {
            return;
        }

        try {
            const { meeting } = await createMeeting({
                meetingName: personalMeetingName,
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
                    meetingName: personalMeetingName,
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

    return [meetings, personalMeeting, setupNewPersonalMeeting, loadingRotatePersonalMeeting, status] as const;
};
