import { useApi, useAuthentication } from '@proton/components';
import { getUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { srpAuth } from '@proton/shared/lib/srp';
import type { AuthVersion } from '@proton/srp/lib/interface';

export const ERROR_CODE_INVALID_SRP_PARAMS = 2026;

const removeTrailingSlash = (meetingLinkName: string) => {
    return meetingLinkName.at(-1) === '/' ? meetingLinkName.slice(0, -1) : meetingLinkName;
};

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
}

export const useMeetSrp = () => {
    const api = useApi();
    const auth = useAuthentication();

    const initHandshake = async (token: string) => {
        return api<SRPHandshakeInfo>(queryInitSRPHandshake(token)).then((handshakeInfo) => {
            return {
                handshakeInfo,
            };
        });
    };

    const getSessionToken = async (
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
    };

    const getMeetingInfo = async (meetingLinkName: string) => {
        const response = await api<{ MeetingInfo: { Salt: string; SessionKey: string; MeetingName: string } }>(
            queryMeetingInfo(meetingLinkName)
        );

        return response;
    };

    const getAccessToken = async (meetingLinkName: string, displayName: string) => {
        const result = {
            AccessToken: '',
            WebsocketUrl: '',
        };

        try {
            const response = await api({
                ...queryAccessToken(meetingLinkName),
                data: {
                    DisplayName: displayName,
                },
            });

            result.AccessToken = response.AccessToken;
            result.WebsocketUrl = response.WebsocketUrl;
        } catch (error) {
            console.error(error);
        }

        return result;
    };

    return {
        initHandshake,
        getSessionToken,
        getMeetingInfo,
        getAccessToken,
    };
};
