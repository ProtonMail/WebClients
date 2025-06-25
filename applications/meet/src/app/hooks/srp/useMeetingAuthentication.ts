import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { decryptMeetingName, getCombinedPassword } from '../../utils/cryptoUtils';
import type { SRPHandshakeInfo } from './useMeetSrp';
import { useMeetSrp } from './useMeetSrp';

export const useMeetingAuthentication = (token: string, urlPassword: string) => {
    const [handshakeInfo, setHandshakeInfo] = useState<SRPHandshakeInfo | null>(null);

    const { initHandshake: initHandshakeFromSrp, getSessionToken, getMeetingInfo, getAccessToken } = useMeetSrp();

    const initHandshake = useCallback(async () => {
        const handshakeInfoResult = await initHandshakeFromSrp(token);

        if (!handshakeInfoResult) {
            return null;
        }

        setHandshakeInfo(handshakeInfoResult);
        return handshakeInfoResult.CustomPassword;
    }, [initHandshakeFromSrp]);

    const getRoomName = useCallback(
        async (customPassword: string): Promise<string> => {
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
                console.log(error);
            }

            return meetingName;
        },
        [token, urlPassword, handshakeInfo]
    );

    const getAcccessDetails = useCallback(
        async (displayName: string) => {
            try {
                const data = await getAccessToken(token, displayName);
                return {
                    accessToken: data.AccessToken,
                    websocketUrl: data.WebsocketUrl.replace('/rtc', ''),
                };
            } catch (error) {
                throw new Error(c('l10n_nightly Error').t`Failed to get access details`);
            }
        },
        [token]
    );

    return { getRoomName, getAcccessDetails, initHandshake, getHandshakeInfo: initHandshake };
};
