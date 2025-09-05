import { useCallback } from 'react';

import { c } from 'ttag';

import { useMeetErrorReporting } from '@proton/meet';
import { decryptMeetingName, getCombinedPassword } from '@proton/meet/utils/cryptoUtils';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import type { SRPHandshakeInfo } from './useMeetSrp';
import { useMeetSrp } from './useMeetSrp';

export const useMeetingAuthentication = () => {
    const { initHandshake, getSessionToken, getMeetingInfo, getAccessToken } = useMeetSrp();

    const reportMeetError = useMeetErrorReporting();
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
                reportMeetError('Failed to get meeting info', error);
                throw new Error(c('Error').t`Failed to get room name`);
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
            reportMeetError('Failed to get access details', error);
            throw new Error(getApiError(error)?.message ?? c('Error').t`Failed to get access details`);
        }
    }, []);

    return { getRoomName, getAccessDetails, initHandshake };
};
