import { useCallback } from 'react';

import { CustomPasswordState, type Meeting } from '../types/response-types';
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

    const saveMeetingPassword = useCallback(
        async ({
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
            const { privateKey } = await getMeetingDependencies();

            const previousPassword = await decryptMeetingPassword(meetingObject?.Password as string, privateKey);

            const sessionKey = (await decryptSessionKey({
                encryptedSessionKey: meetingObject?.SessionKey as string,
                password: previousPassword,
                salt: meetingObject?.Salt as string,
            })) as Uint8Array;

            const updatedMeeting = await updateMeetingPassword({
                meetingId: id,
                password: getCombinedPassword(passwordBase, passphrase),
                sessionKey,
                customPassword: !!passphrase ? CustomPasswordState.PASSWORD_SET : CustomPasswordState.NO_PASSWORD,
                salt: meetingObject?.Salt as string,
            });

            return updatedMeeting;
        },
        [getMeetingDependencies]
    );

    const saveMeetingName = useCallback(
        async ({ newTitle, id, meetingObject }: { newTitle: string; id: string; meetingObject: Meeting }) => {
            const { privateKey } = await getMeetingDependencies();

            const decryptedPassword = await decryptMeetingPassword(meetingObject?.Password as string, privateKey);

            const sessionKey = (await decryptSessionKey({
                encryptedSessionKey: meetingObject?.SessionKey as string,
                password: decryptedPassword,
                salt: meetingObject?.Salt as string,
            })) as Uint8Array;

            const encryptedConferenceName = await encryptMeetingName(newTitle, sessionKey);

            const updatedMeeting = await updateMeetingName(id, encryptedConferenceName, sessionKey);

            return updatedMeeting;
        },
        [getMeetingDependencies]
    );

    return { saveMeetingPassword, saveMeetingName };
};
