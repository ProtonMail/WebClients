import {
    queryInitMeetSRPHandshake,
    queryMeetAccessToken,
    queryMeetAuth,
    queryMeetingInfo,
} from '@proton/shared/lib/api/meet';
import type { AuthVersion } from '@proton/shared/lib/authentication/interface';
import { getUIDHeaders } from '@proton/shared/lib/fetch/headers';
import type { Api } from '@proton/shared/lib/interfaces';
import type { AccessTokenResponse, MeetingInfoResponse } from '@proton/shared/lib/interfaces/Meet';
import { srpAuth } from '@proton/shared/lib/srp';

import { INVALID_SRP_PARAMS_ERROR_CODE } from '../../constants';

export interface SRPHandshakeInfo {
    Code: number;
    Modulus: string;
    ServerEphemeral: string;
    Salt: string;
    SRPSession: string;
    Version: AuthVersion;
}

export interface SessionTokenResponse {
    ServerProof: string;
    UID: string;
    AccessToken: string;
    TokenType: string;
    Code: string;
}

export const requestHandshakeInfo = (api: Api, token: string) =>
    api<SRPHandshakeInfo>({ ...queryInitMeetSRPHandshake(token), silence: true });

export const requestSessionToken = async (
    api: Api,
    {
        token,
        password,
        handshakeInfo,
        uid,
    }: { token: string; password: string; handshakeInfo: SRPHandshakeInfo; uid?: string }
): Promise<SessionTokenResponse> => {
    const { Modulus, ServerEphemeral, Salt, SRPSession, Version } = handshakeInfo;

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
            ...(uid && { headers: getUIDHeaders(uid) }),
            ...queryMeetAuth(token),
            // Silence the wrong-password error so the generic API layer does not
            // auto-show "Invalid SRP parameter"; we render a friendlier message ourselves.
            silence: [INVALID_SRP_PARAMS_ERROR_CODE],
        },
    });

    return response.json();
};

export const requestMeetingInfo = (api: Api, meetingLinkName: string) =>
    api<MeetingInfoResponse>(queryMeetingInfo(meetingLinkName));

export const requestAccessToken = (
    api: Api,
    {
        meetingLinkName,
        displayName,
        encryptedDisplayName,
    }: { meetingLinkName: string; displayName: string; encryptedDisplayName: string }
) =>
    api<AccessTokenResponse>({
        ...queryMeetAccessToken(meetingLinkName),
        data: {
            DisplayName: displayName,
            EncryptedDisplayName: encryptedDisplayName,
        },
    });
