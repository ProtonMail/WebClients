import { CLIENT_ID_KEYS } from '../constants';

export const PASSWORD_WRONG_ERROR = 8002;

export const auth = (data: any) => ({
    method: 'post',
    url: 'auth',
    data,
});

export const auth2FA = ({ totp, u2f }: any) => ({
    method: 'post',
    url: 'auth/2fa',
    data: {
        TwoFactorCode: totp,
        U2F: u2f,
    },
});

export const revoke = () => ({
    method: 'delete',
    url: 'auth',
});

interface RefreshArgs {
    RefreshToken: string;
    RedirectURI?: string;
}
export const setRefreshCookies = (data?: RefreshArgs) => {
    const config = {
        method: 'post',
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
}
export const setCookies = ({ UID, RefreshToken, State, RedirectURI = 'https://protonmail.com' }: CookiesArgs) => ({
    method: 'post',
    url: 'auth/cookies',
    data: {
        UID,
        ResponseType: 'token',
        GrantType: 'refresh_token',
        RefreshToken,
        RedirectURI,
        State,
    },
});

export const getLocalKey = () => ({
    method: 'get',
    url: 'auth/sessions/local/key',
});
export const setLocalKey = (Key: string) => ({
    method: 'put',
    url: 'auth/sessions/local/key',
    data: {
        Key,
    },
});
export const pushForkSession = (data: {
    Payload?: string;
    ChildClientID: CLIENT_ID_KEYS;
    Independent: 0 | 1;
    Selector?: string;
    UserCode?: string;
}) => ({
    method: 'post',
    url: 'auth/sessions/forks',
    data,
});

export const pullForkSession = (selector: string) => ({
    method: 'get',
    url: `auth/sessions/forks/${selector}`,
});

export const getLocalSessions = () => ({
    method: 'get',
    url: `auth/sessions/local`,
});

export const getInfo = (Username?: string) => ({
    method: 'post',
    url: 'auth/info',
    data: Username ? { Username } : undefined,
});

export const getModulus = () => ({
    method: 'get',
    url: 'auth/modulus',
});

export const querySessions = () => ({
    method: 'get',
    url: 'auth/sessions',
});

export const revokeOtherSessions = () => ({
    method: 'delete',
    url: 'auth/sessions',
});

export const revokeSession = (UID: string | number) => ({
    method: 'delete',
    url: `auth/sessions/${UID}`,
});

export const queryScopes = () => ({
    method: 'get',
    url: 'auth/scopes',
});
