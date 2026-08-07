import { useCallback } from 'react';

import useApi from '@proton/components/hooks/useApi';
import { useMeetErrorReporting } from '@proton/meet';
import { requestAccessToken, requestHandshakeInfo } from '@proton/meet/api/meetSrpRequests';

export const useMeetingAuthentication = () => {
    const api = useApi();

    const { reportMeetError } = useMeetErrorReporting();

    const initHandshake = useCallback(
        async (token: string) => {
            try {
                return await requestHandshakeInfo(api, token);
            } catch (error) {
                reportMeetError('Error initializing handshake', {
                    context: { error },
                    tags: { meetingLinkName: token },
                });
                throw error;
            }
        },
        [api, reportMeetError]
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
                const { AccessToken, WebsocketUrl } = await requestAccessToken(api, {
                    meetingLinkName: token,
                    displayName,
                    encryptedDisplayName,
                });

                return {
                    accessToken: AccessToken,
                    websocketUrl: WebsocketUrl.replace('/rtc', ''),
                };
            } catch (error: any) {
                reportMeetError('Failed to get access details', {
                    context: { error },
                    tags: { meetingLinkName: token },
                });
                throw error;
            }
        },
        [api, reportMeetError]
    );

    return { getAccessDetails, initHandshake };
};
