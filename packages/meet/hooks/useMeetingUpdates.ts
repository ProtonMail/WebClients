import { CustomPasswordState, type Meeting } from '@proton/shared/lib/interfaces/Meet';

import {
    decryptMeetingPassword,
    decryptSessionKey,
    encryptMeetingName,
    getCombinedPassword,
} from '../utils/cryptoUtils';
import { useGetMeetingDependencies } from './useGetMeetingDependencies';
import { useUpdateMeetingName } from './useUpdateMeetingName';
import { useUpdateMeetingPassword } from './useUpdateMeetingPassword';

export const useMeetingUpdates = () => {
    const getMeetingDependencies = useGetMeetingDependencies();

    const { updateMeetingName } = useUpdateMeetingName();

    const { updateMeetingPassword } = useUpdateMeetingPassword();

    const saveMeetingPassword = async ({
        passphrase,
        id,
        passwordBase,
        meetingObject,
    }: {
        passphrase: string;
        id: string;
        passwordBase: string;
        meetingObject: Meeting;
    }) => {
        const { userKeys } = await getMeetingDependencies();

        const previousPassword = await decryptMeetingPassword(meetingObject?.Password as string, userKeys);

        const sessionKey = await decryptSessionKey({
            encryptedSessionKey: meetingObject?.SessionKey as string,
            password: previousPassword,
            salt: meetingObject?.Salt as string,
        });

        if (!sessionKey) {
            throw new Error('Missing session key');
        }

        const updatedMeeting = await updateMeetingPassword({
            meetingId: id,
            password: getCombinedPassword(passwordBase, passphrase),
            sessionKey,
            customPassword: !!passphrase ? CustomPasswordState.PASSWORD_SET : CustomPasswordState.NO_PASSWORD,
            salt: meetingObject?.Salt as string,
        });

        return updatedMeeting;
    };

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

        const { userKeys } = await getMeetingDependencies();

        const decryptedPassword = await decryptMeetingPassword(meetingObject.Password, userKeys);

        const sessionKey = await decryptSessionKey({
            encryptedSessionKey: meetingObject.SessionKey,
            password: decryptedPassword,
            salt: meetingObject.Salt,
        });

        if (!sessionKey) {
            throw new Error('Missing session key');
        }

        const encryptedConferenceName = await encryptMeetingName(newTitle, sessionKey);

        const updatedMeeting = await updateMeetingName(id, encryptedConferenceName, sessionKey);

        return updatedMeeting;
    };

    return { saveMeetingPassword, saveMeetingName };
};
