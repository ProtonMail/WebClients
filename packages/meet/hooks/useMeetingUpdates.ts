import { type Meeting, MeetingType } from '@proton/shared/lib/interfaces/Meet';

import { decryptMeetingPassword, decryptSessionKey } from '../utils/cryptoUtils';
import { useGetMeetingDependencies } from './useGetMeetingDependencies';
import { useUpdateMeetingName } from './useUpdateMeetingName';
import { useUpdateMeetingSchedule } from './useUpdateMeetingSchedule';

// Check if the password is encrypted (PGP armored message)
const isPasswordEncrypted = (password: string): boolean => {
    return password.includes('-----BEGIN PGP MESSAGE-----');
};

export const useMeetingUpdates = () => {
    const getMeetingDependencies = useGetMeetingDependencies();

    const { updateMeetingName } = useUpdateMeetingName();

    const { updateMeetingSchedule } = useUpdateMeetingSchedule();

    const saveMeetingName = async ({
        newTitle,
        id,
        meetingObject,
    }: {
        newTitle: string;
        id: string;
        meetingObject: Meeting;
    }) => {
        if (!meetingObject.Password) {
            throw new Error('Missing meeting password');
        }

        let decryptedPassword = meetingObject.Password;

        if (isPasswordEncrypted(decryptedPassword)) {
            const { userKeys } = await getMeetingDependencies();
            decryptedPassword = await decryptMeetingPassword(decryptedPassword, userKeys);
        }

        const sessionKey = await decryptSessionKey({
            encryptedSessionKey: meetingObject.SessionKey,
            password: decryptedPassword,
            salt: meetingObject.Salt,
        });

        if (!sessionKey) {
            throw new Error('Missing session key');
        }

        return updateMeetingName(id, newTitle, sessionKey);
    };

    const saveMeetingSchedule = async ({
        startTime,
        endTime,
        timezone,
        recurrence,
        id,
        meetingObject,
    }: {
        startTime: string;
        endTime: string;
        timezone: string;
        recurrence: string | null;
        id: string;
        meetingObject: Meeting;
    }) => {
        if (meetingObject.Type !== MeetingType.SCHEDULED && meetingObject.Type !== MeetingType.RECURRING) {
            throw new Error('Meeting must be of type scheduled or recurring');
        }

        return updateMeetingSchedule(id, startTime, endTime, recurrence, timezone);
    };

    return { saveMeetingName, saveMeetingSchedule };
};
