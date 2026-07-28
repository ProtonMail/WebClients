import { useCallback } from 'react';

import useApi from '@proton/components/hooks/useApi';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { useMeetErrorReporting } from '@proton/meet';

import type { SRPHandshakeInfo } from './meetSrpRequests';
import { requestAccessToken, requestHandshakeInfo, requestMeetingInfo, requestSessionToken } from './meetSrpRequests';

export type { SRPHandshakeInfo } from './meetSrpRequests';

export const useMeetSrp = () => {
    const api = useApi();
    const auth = useAuthentication();

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

    const getSessionToken = useCallback(
        async (token: string, password: string, initHandshake: SRPHandshakeInfo) => {
            return requestSessionToken(api, {
                token,
                password,
                handshakeInfo: initHandshake,
                uid: auth.getUID(),
            });
        },
        [api, auth]
    );

    const getMeetingInfo = useCallback(
        async (meetingLinkName: string) => {
            try {
                return await requestMeetingInfo(api, meetingLinkName);
            } catch (error) {
                reportMeetError('Failed to get meeting info', {
                    context: { error },
                    tags: { meetingLinkName },
                });
                throw error;
            }
        },
        [api, reportMeetError]
    );

    const getAccessToken = useCallback(
        async (meetingLinkName: string, displayName: string, encryptedDisplayName: string) => {
            const result = {
                AccessToken: '',
                WebsocketUrl: '',
            };

            try {
                const { AccessToken, WebsocketUrl } = await requestAccessToken(api, {
                    meetingLinkName,
                    displayName,
                    encryptedDisplayName,
                });

                result.AccessToken = AccessToken;
                result.WebsocketUrl = WebsocketUrl;
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
                throw error;
            }

            return result;
        },
        [api]
    );

    return {
        initHandshake,
        getSessionToken,
        getMeetingInfo,
        getAccessToken,
    };
};
