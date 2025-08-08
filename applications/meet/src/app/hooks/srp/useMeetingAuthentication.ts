import { useCallback } from 'react';

import { c } from 'ttag';

import { decryptMeetingName, getCombinedPassword } from '@proton/meet/utils/cryptoUtils';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { type SRPHandshakeInfo, useMeetSrp } from './useMeetSrp';

export const useMeetingAuthentication = () => {
    const { initHandshake: initHandshakeFromSrp, getSessionToken, getMeetingInfo, getAccessToken } = useMeetSrp();

    const initHandshake = useCallback(
        async (token: string) => {
            const handshakeInfoResult = await initHandshakeFromSrp(token);

            if (!handshakeInfoResult) {
                return null;
            }

            return handshakeInfoResult;
        },
        [initHandshakeFromSrp]
    );

    const getRoomName = useCallback(
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
        }): Promise<string> => {
            let meetingName = '';

            if (!handshakeInfo) {
                return '';
            }

            try {
                await getSessionToken(token, getCombinedPassword(urlPassword, customPassword), handshakeInfo);

                const meetingInfo = await getMeetingInfo(token);

                meetingName = await decryptMeetingName({
                    urlPassword,
                    customPassword,
                    encryptedSessionKey: meetingInfo.MeetingInfo.SessionKey,
                    encryptedMeetingName: meetingInfo.MeetingInfo.MeetingName,
                    salt: meetingInfo.MeetingInfo.Salt,
                });
            } catch (error) {
                throw new Error(c('meet_2025 Error').t`Failed to get room name`);
            }

            return meetingName;
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
            console.log('Failed to get access details');
            throw new Error(getApiError(error)?.message ?? c('meet_2025 Error').t`Failed to get access details`);
        }
    }, []);

    return { getRoomName, getAccessDetails, initHandshake, getHandshakeInfo: initHandshake };
};
