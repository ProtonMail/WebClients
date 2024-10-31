import type { ChallengePayload } from '../authentication/interface';
import type { APP_CLIENT_IDS } from '../constants';
import { HTTP_ERROR_CODES } from '../errors';
import type { AuthenticationCredentialsPayload } from '../webauthn/interface';

export const PASSWORD_WRONG_ERROR = 8002;
export const SCOPE_REAUTH_SSO = 9107;

export const auth = (
    data:
        | {
              Username: string;
              Payload?: ChallengePayload;
          }
        | {
              SSOResponseToken: string;
          },
    persistent: boolean
) => ({
    method: 'post',
    url: 'core/v4/auth',
    data: {
        ...data,
        PersistentCookies: Number(persistent),
    },
    ignoreHandler: [HTTP_ERROR_CODES.TOO_MANY_REQUESTS],
});

export const auth2FA = (data: { TwoFactorCode: string } | { FIDO2: AuthenticationCredentialsPayload }) => ({
    method: 'post',
    url: 'core/v4/auth/2fa',
    data: data,
});

export const authJwt = (data: { Token: String; ClientSecret?: String }) => ({
    method: 'post',
    url: 'core/v4/auth/jwt',
    data,
});

export const revoke = (params?: { Child?: 1 }) => ({
    method: 'delete',
    url: 'core/v4/auth',
    params,
});

interface RefreshArgs {
    RefreshToken: string;
    RedirectURI?: string;
}

export const setRefreshCookies = (data?: RefreshArgs) => {
    const config = {
        method: 'post',
        // WARNING: The refresh cookie is set with `path=/api/auth/refresh;`
        url: 'auth/refresh',
    };
    if (!data) {
        return config;
    }
    return {
        ...config,
        data: {
            ResponseType: 'token',
            GrantType: 'refresh_token',
            RefreshToken: data.RefreshToken,
            RedirectURI: data.RedirectURI || 'https://protonmail.com',
        },
    };
};

interface CookiesArgs {
    UID: string;
    RefreshToken: string;
    State: string;
    RedirectURI?: string;
    Persistent?: boolean;
}

export const setCookies = ({
    UID,
    RefreshToken,
    State,
    RedirectURI = 'https://protonmail.com',
    Persistent = false,
}: CookiesArgs) => ({
    method: 'post',
    url: 'core/v4/auth/cookies',
    data: {
        UID,
        ResponseType: 'token',
        GrantType: 'refresh_token',
        RefreshToken,
        RedirectURI,
        Persistent: Number(Persistent),
        State,
    },
});

export const getLocalKey = () => ({
    method: 'get',
    url: 'auth/v4/sessions/local/key',
});
export const setLocalKey = (Key: string) => ({
    method: 'put',
    url: 'auth/v4/sessions/local/key',
    data: {
        Key,
    },
});
export const pushForkSession = (data: {
    Payload?: string;
    ChildClientID: APP_CLIENT_IDS;
    Independent: 0 | 1;
    Selector?: string;
    UserCode?: string;
}) => ({
    method: 'post',
    url: 'auth/v4/sessions/forks',
    data,
});

export const pullForkSession = (selector: string) => ({
    method: 'get',
    url: `auth/v4/sessions/forks/${selector}`,
});

export const getLocalSessions = (params?: { Email: string }) => ({
    method: 'get',
    url: `auth/v4/sessions/local`,
    params,
});

export const getInfo = ({
    username,
    intent = 'Proton',
    isTesting,
    reauthScope,
}: {
    username?: string;
    intent?: 'Proton' | 'Auto' | 'SSO';
    isTesting?: boolean;
    reauthScope?: 'password' | 'locked';
}) => ({
    method: 'post',
    url: 'core/v4/auth/info',
    data: {
        ...(username ? { Username: username } : undefined),
        Intent: intent,
        ...(isTesting ? { IsTesting: isTesting } : undefined),
        ...(reauthScope ? { ReauthScope: reauthScope } : undefined),
    },
});

export const getModulus = () => ({
    method: 'get',
    url: 'core/v4/auth/modulus',
});

export const createSession = (data?: { ClientSecret?: string; Payload?: ChallengePayload }) => ({
    method: 'post',
    url: 'auth/v4/sessions',
    data,
});

export const querySessions = () => ({
    method: 'get',
    url: 'auth/v4/sessions',
});

export const revokeOtherSessions = () => ({
    method: 'delete',
    url: 'auth/v4/sessions',
});

export const revokeSession = (UID: string | number) => ({
    method: 'delete',
    url: `auth/v4/sessions/${UID}`,
});

export const queryScopes = () => ({
    method: 'get',
    url: 'core/v4/auth/scopes',
});

export const getMnemonicAuthInfo = (Username?: string) => ({
    method: 'post',
    url: 'auth/v4/mnemonic/info',
    data: Username ? { Username } : undefined,
});

export const authMnemonic = (Username: string, persistent: boolean) => ({
    method: 'post',
    url: 'auth/v4/mnemonic',
    data: { Username, PersistentCookies: Number(persistent) },
    ignoreHandler: [HTTP_ERROR_CODES.TOO_MANY_REQUESTS],
});

export const payload = (data: ChallengePayload) => ({
    method: 'post',
    url: `auth/v4/sessions/payload`,
    data: {
        Payload: data,
    },
});

export const reauthMnemonic = (data: { Username: string; PersistentCookies: boolean }) => ({
    method: 'post',
    url: 'auth/v4/mnemonic/reauth',
    data: {
        ...data,
        PersistentCookies: Number(data.PersistentCookies),
    },
});
