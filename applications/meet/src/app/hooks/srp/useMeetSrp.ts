import { useCallback } from 'react';

import { c } from 'ttag';

import { useApi, useAuthentication } from '@proton/components';
import type { AccessTokenResponse, MeetingInfoResponse } from '@proton/meet/types/response-types';
import { getUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { srpAuth } from '@proton/shared/lib/srp';
import type { AuthVersion } from '@proton/srp/lib/interface';

import { removeTrailingSlash } from '../../utils/remove-trailing-slash';

export const queryInitSRPHandshake = (meetingLinkName: string) => {
    return {
        method: 'get',
        url: `meet/v1/meetings/links/${removeTrailingSlash(meetingLinkName)}/info`,
        silence: true,
    };
};

export const queryAuth = (meetingLinkName: string) => {
    return {
        method: 'post',
        url: `meet/v1/meetings/links/${removeTrailingSlash(meetingLinkName)}/auth`,
        silence: true,
    };
};

export const queryMeetingInfo = (meetingLinkName: string) => {
    return {
        method: 'get',
        url: `meet/v1/meetings/links/${removeTrailingSlash(meetingLinkName)}`,
        silence: true,
    };
};

export const queryAccessToken = (meetingLinkName: string) => {
    return {
        method: 'post',
        url: `meet/v1/meetings/links/${removeTrailingSlash(meetingLinkName)}/access-tokens`,
        silence: true,
    };
};

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

    const initHandshake = useCallback(
        async (token: string) => {
            try {
                const response = await api<SRPHandshakeInfo>(queryInitSRPHandshake(token));

                return response;
            } catch (error) {
                throw new Error(c('l10n_nightly Error').t`Failed to initialize handshake`);
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
                    ...queryAuth(token),
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
                throw new Error(c('l10n_nightly Error').t`Failed to get meeting info`);
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
                    ...queryAccessToken(meetingLinkName),
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
