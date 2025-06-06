import { useApi, useAuthentication } from '@proton/components';
import { getUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { srpAuth } from '@proton/shared/lib/srp';
import type { AuthVersion } from '@proton/srp/lib/interface';

export const ERROR_CODE_INVALID_SRP_PARAMS = 2026;

export const queryInitSRPHandshake = (meetingLinkName: string) => {
    return {
        method: 'get',
        url: `meet/v1/meetings/links/${meetingLinkName.at(-1) === '/' ? meetingLinkName.slice(0, -1) : meetingLinkName}/info`,
        silence: true,
    };
};

export const queryAuth = (meetingLinkName: string) => {
    return {
        method: 'post',
        url: `meet/v1/meetings/links/${meetingLinkName.at(-1) === '/' ? meetingLinkName.slice(0, -1) : meetingLinkName}/auth`,
        silence: true,
    };
};

export const queryMeetingInfo = (meetingLinkName: string) => {
    return {
        method: 'get',
        url: `meet/v1/meetings/links/${meetingLinkName.at(-1) === '/' ? meetingLinkName.slice(0, -1) : meetingLinkName}`,
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
        return api<any>(queryMeetingInfo(meetingLinkName));
    };

    return {
        initHandshake,
        getSessionToken,
        getMeetingInfo,
    };
};
