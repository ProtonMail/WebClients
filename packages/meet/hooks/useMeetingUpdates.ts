import { type Meeting, MeetingType, type WaitingRoomState } from '@proton/shared/lib/interfaces/Meet';

import { decryptMeetingPassword, decryptSessionKey } from '../utils/cryptoUtils';
import { useGetMeetingDependencies } from './useGetMeetingDependencies';
import { useUpdateMeetingName } from './useUpdateMeetingName';
import { useUpdateMeetingSchedule } from './useUpdateMeetingSchedule';
import { useUpdateMeetingWaitingRoom } from './useUpdateMeetingWaitingRoom';

// Check if the password is encrypted (PGP armored message)
const isPasswordEncrypted = (password: string): boolean => {
    return password.includes('-----BEGIN PGP MESSAGE-----');
};

export const useMeetingUpdates = () => {
    const getMeetingDependencies = useGetMeetingDependencies();

    const { updateMeetingName } = useUpdateMeetingName();

    const { updateMeetingSchedule } = useUpdateMeetingSchedule();

    const { updateMeetingWaitingRoom } = useUpdateMeetingWaitingRoom();

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

    const saveMeetingWaitingRoom = async ({
        meetingLinkName,
        waitingRoom,
    }: {
        meetingLinkName: string;
        waitingRoom: WaitingRoomState;
    }) => {
        return updateMeetingWaitingRoom({ meetingLinkName, waitingRoom: waitingRoom });
    };

    return { saveMeetingName, saveMeetingSchedule, saveMeetingWaitingRoom };
};
