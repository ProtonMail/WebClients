import { useCallback } from 'react';

import { c } from 'ttag';

import useApi from '@proton/components/hooks/useApi';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { useMeetErrorReporting } from '@proton/meet';
import {
    queryInitMeetSRPHandshake,
    queryMeetAccessToken,
    queryMeetAuth,
    queryMeetingInfo,
} from '@proton/shared/lib/api/meet';
import { getUIDHeaders } from '@proton/shared/lib/fetch/headers';
import type { AccessTokenResponse, MeetingInfoResponse } from '@proton/shared/lib/interfaces/Meet';
import { srpAuth } from '@proton/shared/lib/srp';
import type { AuthVersion } from '@proton/srp/lib/interface';

export interface SRPHandshakeInfo {
    Code: number;
    Modulus: string;
    ServerEphemeral: string;
    Salt: string;
    SRPSession: string;
    Version: AuthVersion;
    CustomPassword: MeetingInfoResponse['MeetingInfo']['CustomPassword'];
}

export const useMeetSrp = () => {
    const api = useApi();
    const auth = useAuthentication();

    const reportMeetError = useMeetErrorReporting();

    const initHandshake = useCallback(
        async (token: string) => {
            try {
                const response = await api<SRPHandshakeInfo>(queryInitMeetSRPHandshake(token));

                return response;
            } catch (error) {
                reportMeetError('Error initializing handshake', error);
                throw new Error(c('Error').t`Failed to initialize handshake`);
            }
        },
        [api]
    );

    const getSessionToken = useCallback(
        async (
            token: string,
            password: string,
            initHandshake: SRPHandshakeInfo
        ): Promise<{ ServerProof: string; UID: string; AccessToken: string; TokenType: string; Code: string }> => {
            const { Modulus, ServerEphemeral, Salt, SRPSession, Version } = initHandshake;

            const UID = auth.getUID();

            const response = await srpAuth({
                api,
                credentials: { password },
                info: {
                    Modulus,
                    ServerEphemeral,
                    Version,
                    Salt,
                    SRPSession,
                },
                config: {
                    ...(UID && { headers: getUIDHeaders(UID) }),
                    ...queryMeetAuth(token),
                },
            });

            return response.json();
        },
        [api, auth.getUID]
    );

    const getMeetingInfo = useCallback(
        async (meetingLinkName: string) => {
            try {
                const response = await api<MeetingInfoResponse>(queryMeetingInfo(meetingLinkName));

                return response;
            } catch (error) {
                throw new Error(c('Error').t`Failed to get meeting info`);
            }
        },
        [api]
    );

    const getAccessToken = useCallback(
        async (meetingLinkName: string, displayName: string) => {
            const result = {
                AccessToken: '',
                WebsocketUrl: '',
            };

            try {
                const { AccessToken, WebsocketUrl } = await api<AccessTokenResponse>({
                    ...queryMeetAccessToken(meetingLinkName),
                    data: {
                        DisplayName: displayName,
                    },
                });

                result.AccessToken = AccessToken;
                result.WebsocketUrl = WebsocketUrl;
            } catch (error) {
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
