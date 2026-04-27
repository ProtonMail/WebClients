import { useCallback } from 'react';

import { c } from 'ttag';

import useNotifications from '@proton/components/hooks/useNotifications';
import { useMeetErrorReporting } from '@proton/meet';
import { decryptMeetingName, getCombinedPassword } from '@proton/meet/utils/cryptoUtils';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { INVALID_SRP_PARAMS_ERROR_CODE } from '../../constants';
import type { SRPHandshakeInfo } from './useMeetSrp';
import { useMeetSrp } from './useMeetSrp';

export const useMeetingAuthentication = () => {
    const { initHandshake, getSessionToken, getMeetingInfo, getAccessToken } = useMeetSrp();
    const { createNotification } = useNotifications();
    const { reportMeetError } = useMeetErrorReporting();

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
            } catch (error) {
                const { code, message } = getApiError(error);

                if (code !== INVALID_SRP_PARAMS_ERROR_CODE) {
                    reportMeetError(`Failed to get session token: ${code} - ${message}`, {
                        context: { error },
                        tags: { meetingLinkName: token },
                    });
                } else {
                    createNotification({
                        type: 'error',
                        text: c('Error').t`The meeting password is incorrect`,
                    });
                }

                throw error;
            }

            try {
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
                const { code, message } = getApiError(error);

                reportMeetError(`Failed to get meeting info: ${code} - ${message}`, {
                    context: { error },
                    tags: { meetingLinkName: token },
                });

                throw error;
            }
        },
        [getSessionToken, getMeetingInfo]
    );

    const getAccessDetails = useCallback(
        async ({
            displayName,
            token,
            encryptedDisplayName,
        }: {
            displayName: string;
            token: string;
            encryptedDisplayName: string;
        }) => {
            try {
                const data = await getAccessToken(token, displayName, encryptedDisplayName);
                return {
                    accessToken: data.AccessToken,
                    websocketUrl: data.WebsocketUrl.replace('/rtc', ''),
                };
            } catch (error: any) {
                reportMeetError('Failed to get access details', {
                    context: { error },
                    tags: { meetingLinkName: token },
                });
                throw error;
            }
        },
        [getAccessToken, reportMeetError]
    );

    return { getMeetingDetails, getAccessDetails, initHandshake, getMeetingInfo };
};
