import { useRef } from 'react';

import { useApi } from '@proton/components';
import { queryShareURLAuth, queryInitSRPHandshake } from '@proton/shared/lib/api/drive/sharing';
import { srpAuth } from '@proton/shared/lib/srp';
import { SRPHandshakeInfo } from '@proton/shared/lib/interfaces/drive/sharing';
import { withAuthHeaders } from '@proton/shared/lib/fetch/headers';

export interface SessionInfo {
    accessToken: string;
    sessionUID: string;
}

type AuthenticatePublicSession = (token: string) => Promise<SRPHandshakeInfo>;
type FetchSessionInfo = (token: string, password: string, handshakeInfo: SRPHandshakeInfo) => Promise<SessionInfo>;

export type AuthenticatePublicSesstion = (token: string) => Promise<SRPHandshakeInfo>;
export type QueryWithSessionInfo = (config: any) => {
    headers: {
        [x: string]: any;
    };
    [key: string]: any;
};

/**
 * usePublicSession hook is used to store session token
 * to futher request SharedURL payload or link children.
 *
 * The authentication steps are as follows:
 *
 * - `init` – SRP handshake; return handshare info required to retrieve session information
 * - `fetchSessionInfo` – retrieve session information; AccessToken response field is used as a Bearer token
 *   authorization header. UID is used as 'x-pm-uid' for subsequent data requests
 *
 * After executing the said steps SharedUrl data can be requested using `queryWithSessionInfo`
 */
const usePublicSession = () => {
    const api = useApi();
    const sessionInfo = useRef<SessionInfo>();

    const initSRPHandshake = async (token: string) => {
        return api<SRPHandshakeInfo>(queryInitSRPHandshake(token));
    };

    const getSessionToken = async (token: string, password: string, initHandshake: SRPHandshakeInfo) => {
        const { Modulus, ServerEphemeral, UrlPasswordSalt, SRPSession, Version } = initHandshake;
        return srpAuth<{ AccessToken: string; UID: string }>({
            api,
            credentials: { password },
            info: {
                Modulus,
                ServerEphemeral,
                Version,
                Salt: UrlPasswordSalt,
                SRPSession,
            },
            config: queryShareURLAuth(token),
        });
    };

    const init: AuthenticatePublicSession = async (token) => {
        const handshakeInfo = await initSRPHandshake(token);
        return handshakeInfo;
    };

    const fetchSessionInfo: FetchSessionInfo = async (token, password, handshakeInfo) => {
        return getSessionToken(token, password, handshakeInfo).then(({ AccessToken, UID }) => {
            sessionInfo.current = {
                accessToken: AccessToken,
                sessionUID: UID,
            };
            return sessionInfo.current;
        });
    };

    const queryWithSessionInfo: QueryWithSessionInfo = (query) => {
        if (!sessionInfo.current) {
            /*
             * This should not happend and must not be proparated to the UI
             * If you see this, the initialization order wasn't followed correctly
             */
            throw new Error('Unauthenticated session');
        }

        return withAuthHeaders(sessionInfo.current.sessionUID, sessionInfo.current.accessToken, query);
    };

    return {
        queryWithSessionInfo,
        init,
        fetchSessionInfo,
    };
};

export default usePublicSession;
