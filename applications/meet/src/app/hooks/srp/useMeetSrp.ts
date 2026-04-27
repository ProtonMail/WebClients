import { useCallback } from 'react';

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

import { INVALID_SRP_PARAMS_ERROR_CODE } from '../../constants';

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

    const { reportMeetError } = useMeetErrorReporting();

    const initHandshake = useCallback(
        async (token: string) => {
            try {
                return await api<SRPHandshakeInfo>(queryInitMeetSRPHandshake(token));
            } catch (error) {
                reportMeetError('Error initializing handshake', {
                    context: { error },
                    tags: { meetingLinkName: token },
                });
                throw error;
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
                    // Silence the wrong-password error so the generic API layer does not
                    // auto-show "Invalid SRP parameter"; we render a friendlier message ourselves.
                    silence: [INVALID_SRP_PARAMS_ERROR_CODE],
                },
            });

            return response.json();
        },
        [api, auth.getUID]
    );

    const getMeetingInfo = useCallback(
        async (meetingLinkName: string) => {
            try {
                return await api<MeetingInfoResponse>(queryMeetingInfo(meetingLinkName));
            } catch (error) {
                reportMeetError('Failed to get meeting info', {
                    context: { error },
                    tags: { meetingLinkName },
                });
                throw error;
            }
        },
        [api]
    );

    const getAccessToken = useCallback(
        async (meetingLinkName: string, displayName: string, encryptedDisplayName: string) => {
            const result = {
                AccessToken: '',
                WebsocketUrl: '',
            };

            try {
                const { AccessToken, WebsocketUrl } = await api<AccessTokenResponse>({
                    ...queryMeetAccessToken(meetingLinkName),
                    data: {
                        DisplayName: displayName,
                        EncryptedDisplayName: encryptedDisplayName,
                    },
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
