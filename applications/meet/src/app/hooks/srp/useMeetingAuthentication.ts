import { useCallback } from 'react';

import { useApi } from '@proton/app-context/useApi';
import { requestAccessToken, requestHandshakeInfo } from '@proton/meet/api/meetSrpRequests';
import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';

import { markAccessTokenError } from '../../utils/accessTokenError';
import { isExpectedApiFailure } from '../../utils/isExpectedApiFailure';

export const useMeetingAuthentication = () => {
    const api = useApi();

    const { reportMeetError } = useMeetErrorReporting();

    const initHandshake = useCallback(
        async (meetingLinkName: string) => {
            try {
                return await requestHandshakeInfo(api, meetingLinkName);
            } catch (error) {
                if (!isExpectedApiFailure(error)) {
                    reportMeetError('Error initializing handshake', {
                        context: { error },
                    });
                }
                throw error;
            }
        },
        [api, reportMeetError]
    );

    const getAccessDetails = useCallback(
        async ({
            meetingLinkName,
            encryptedDisplayName,
            silence,
        }: {
            meetingLinkName: string;
            encryptedDisplayName: string;
            silence?: number[];
        }) => {
            try {
                const { AccessToken, WebsocketUrl } = await requestAccessToken(api, {
                    meetingLinkName,
                    encryptedDisplayName,
                    silence,
                });

                return {
                    accessToken: AccessToken,
                    websocketUrl: WebsocketUrl.replace('/rtc', ''),
                };
            } catch (error) {
                markAccessTokenError(error);
                if (!isExpectedApiFailure(error)) {
                    reportMeetError('Failed to get access details', {
                        context: { error },
                    });
                }
                throw error;
            }
        },
        [api, reportMeetError]
    );

    return { getAccessDetails, initHandshake };
};
