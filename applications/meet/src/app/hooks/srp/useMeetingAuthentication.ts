import { useCallback } from 'react';

import { useMeetErrorReporting } from '@proton/meet';
import { decryptMeetingName, getCombinedPassword } from '@proton/meet/utils/cryptoUtils';

import type { SRPHandshakeInfo } from './useMeetSrp';
import { useMeetSrp } from './useMeetSrp';

export const useMeetingAuthentication = () => {
    const { initHandshake, getSessionToken, getMeetingInfo, getAccessToken } = useMeetSrp();

    const reportMeetError = useMeetErrorReporting();
    const getMeetingDetails = useCallback(
        async ({
            customPassword,
            urlPassword,
            token,
            handshakeInfo,
        }: {
            customPassword: string;
            urlPassword: string;
            token: string;
            handshakeInfo?: SRPHandshakeInfo;
        }) => {
            let meetingName = '';

            if (!handshakeInfo) {
                return {
                    locked: false,
                    maxDuration: 0,
                    maxParticipants: 0,
                    expirationTime: 0,
                    roomName: '',
                };
            }

            try {
                await getSessionToken(token, getCombinedPassword(urlPassword, customPassword), handshakeInfo);

                const meetingInfo = await getMeetingInfo(token);

                meetingName = await decryptMeetingName({
                    password: getCombinedPassword(urlPassword, customPassword),
                    encryptedSessionKey: meetingInfo.MeetingInfo.SessionKey,
                    encryptedMeetingName: meetingInfo.MeetingInfo.MeetingName,
                    salt: meetingInfo.MeetingInfo.Salt,
                });

                return {
                    roomName: meetingName,
                    locked: !!meetingInfo.MeetingInfo.Locked,
                    maxDuration: meetingInfo.MeetingInfo.MaxDuration,
                    maxParticipants: meetingInfo.MeetingInfo.MaxParticipants,
                    expirationTime: meetingInfo.MeetingInfo.ExpirationTime ?? 0,
                };
            } catch (error) {
                reportMeetError('Failed to get meeting info', error);
                throw error;
            }
        },
        [getSessionToken, getMeetingInfo]
    );

    const getAccessDetails = useCallback(async ({ displayName, token }: { displayName: string; token: string }) => {
        try {
            const data = await getAccessToken(token, displayName);
            return {
                accessToken: data.AccessToken,
                websocketUrl: data.WebsocketUrl.replace('/rtc', ''),
            };
        } catch (error: any) {
            reportMeetError('Failed to get access details', error);
            throw error;
        }
    }, []);

    return { getMeetingDetails, getAccessDetails, initHandshake, getMeetingInfo };
};
