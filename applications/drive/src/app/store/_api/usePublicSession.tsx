import { createContext, useContext, useRef, useState } from 'react';

import { useApi } from '@proton/components';
import metrics from '@proton/metrics';
import { queryInitSRPHandshake, queryShareURLAuth } from '@proton/shared/lib/api/drive/sharing';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { getUIDHeaders, withAuthHeaders } from '@proton/shared/lib/fetch/headers';
import type { SRPHandshakeInfo } from '@proton/shared/lib/interfaces/drive/sharing';
import { srpAuth } from '@proton/shared/lib/srp';

import { getLastActivePersistedUserSessionUID } from '../../utils/lastActivePersistedUserSession';
import retryOnError from '../../utils/retryOnError';
import { hasCustomPassword, hasGeneratedPasswordIncluded } from '../_shares';
import useDebouncedRequest from './useDebouncedRequest';

export const ERROR_CODE_INVALID_SRP_PARAMS = 2026;
const AUTH_RETRY_COUNT = 2;

interface SessionInfo {
    token: string;
    password: string;
    accessToken: string;
    sessionUid: string;
}

/**
 * usePublicSession maintain authentication of public session for shared links.
 * To properly authenticate, user should first init SRP handshake, followed by
 * unlocking session with password. Then any allowed request for this session
 * can be made. In case the access token expires, request will automatically
 * reauth with the same token and password and retry.
 */
function usePublicSessionProvider() {
    const api = useApi();
    const debouncedRequest = useDebouncedRequest();
    const [hasSession, setHasSession] = useState(false);
    const sessionInfo = useRef<SessionInfo>();

    const initHandshake = async (token: string) => {
        /*
            initHandshake is the first request, which can fail, so we set the auth headers for the metrics.
            Metrics to be authenticated either needs a persisted session (default, as below) or an access token set in initSession().
            In case you neither have persisted session or access token, you will be 401 Unauthorized to call metrics.
        */
        const UID = getLastActivePersistedUserSessionUID();
        if (UID) {
            metrics.setAuthHeaders(UID);
        }

        return api<SRPHandshakeInfo>(queryInitSRPHandshake(token)).then((handshakeInfo) => {
            return {
                handshakeInfo,
                hasCustomPassword: hasCustomPassword({ flags: handshakeInfo.Flags }),
                hasGeneratedPasswordIncluded: hasGeneratedPasswordIncluded({ flags: handshakeInfo.Flags }),
            };
        });
    };

    const getSessionToken = async (
        token: string,
        password: string,
        initHandshake: SRPHandshakeInfo
    ): Promise<{ AccessToken: string; UID: string }> => {
        const { Modulus, ServerEphemeral, UrlPasswordSalt, SRPSession, Version } = initHandshake;

        /*
            If user is logged-in, re-use the current session UID
            This inform the backend of who is accessing the public session
        */
        const UID = getLastActivePersistedUserSessionUID();

        const response = await srpAuth({
            api,
            credentials: { password },
            info: {
                Modulus,
                ServerEphemeral,
                Version,
                Salt: UrlPasswordSalt,
                SRPSession,
            },
            config: {
                ...(UID && { headers: getUIDHeaders(UID) }),
                ...queryShareURLAuth(token),
            },
        });
        return response.json();
    };

    const initSession = async (token: string, password: string, handshakeInfo: SRPHandshakeInfo) => {
        return getSessionToken(token, password, handshakeInfo).then(({ AccessToken, UID }) => {
            setHasSession(true);
            sessionInfo.current = {
                token,
                password,
                accessToken: AccessToken,
                sessionUid: UID,
            };
            // This enables metrics to work for both auth and un-auth customers
            metrics.setAuthHeaders(UID, AccessToken);
            return sessionInfo.current;
        });
    };

    const queryWithHeaders = (query: any) => {
        if (!sessionInfo.current) {
            // This should not happend. If you see this, it indicate wrong flow.
            throw new Error('Cannot query unauthenticated session');
        }

        return withAuthHeaders(sessionInfo.current.sessionUid, sessionInfo.current.accessToken, query);
    };

    const shouldReauth = (error: any) => {
        const apiError = getApiError(error);
        return apiError.status === HTTP_ERROR_CODES.UNAUTHORIZED;
    };

    const reauth = async () => {
        if (!sessionInfo.current) {
            // This should not happend. If you see this, it indicate wrong flow.
            throw new Error('Cannot reauth unauthenticated session');
        }

        const { handshakeInfo } = await initHandshake(sessionInfo.current.token);
        await initSession(sessionInfo.current.token, sessionInfo.current.password, handshakeInfo).catch((err) => {
            // Custom password was changed probably, lets refresh and ask again.
            if (err?.data?.Code === ERROR_CODE_INVALID_SRP_PARAMS) {
                setHasSession(false);
            }
            throw err;
        });
    };

    const request = <T,>(args: any, abortSignal?: AbortSignal) => {
        const fn = () => debouncedRequest<T>(queryWithHeaders(args), abortSignal);

        return retryOnError<T>({
            fn,
            shouldRetryBasedOnError: shouldReauth,
            beforeRetryCallback: reauth,
            maxRetriesNumber: AUTH_RETRY_COUNT,
        })();
    };

    const getSessionInfo = () => sessionInfo.current;

    /*
     *   If sessionInfo includes accessToken and UID, the customer is not a logged in Proton user
     *   If sessionInfo includes only UID, the customer is logged in Proton user (cookie based authentification)
     */
    const isSessionProtonUser = (): boolean =>
        Boolean(sessionInfo.current && !sessionInfo.current.accessToken && sessionInfo.current.sessionUid);

    return {
        hasSession,
        initHandshake,
        initSession,
        request,
        getSessionInfo,
        isSessionProtonUser,
    };
}

const PublicSessionContext = createContext<ReturnType<typeof usePublicSessionProvider> | null>(null);

export function PublicSessionProvider({ children }: { children: React.ReactNode }) {
    const value = usePublicSessionProvider();
    return <PublicSessionContext.Provider value={value}>{children}</PublicSessionContext.Provider>;
}

export default function usePublicSession() {
    const state = useContext(PublicSessionContext);
    if (!state) {
        throw new Error('Trying to use uninitialized PublicSessionProvider');
    }
    return state;
}
