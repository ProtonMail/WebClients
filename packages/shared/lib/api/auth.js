export const PASSWORD_WRONG_ERROR = 8002;

export const auth = (Username, ClientID) => ({
    method: 'post',
    url: 'auth',
    data: { Username, ClientID }
});

export const revoke = () => ({
    method: 'delete',
    url: 'auth'
});

export const refresh = (ClientID) => ({
    method: 'post',
    url: 'auth/refresh',
    data: { ClientID }
});

export const cookies = ({ UID, ClientID, AuthToken, RefreshToken, State, RedirectURI = 'https://protonmail.com' }) => ({
    method: 'post',
    url: 'auth/cookies',
    data: {
        ClientID,
        UID,
        ResponseType: 'token',
        GrantType: 'refresh_token',
        RefreshToken,
        RedirectURI,
        State
    },
    headers: {
        Authorization: `Bearer ${AuthToken}`,
        'x-pm-uid': UID
    }
});

export const info = (Username, ClientID) => ({
    method: 'post',
    url: 'auth/info',
    data: { Username, ClientID }
});

export const modulus = () => ({
    method: 'get',
    url: 'auth/modulus'
});

export const querySessions = () => ({
    method: 'get',
    url: 'auth/sessions'
});

export const revokeOtherSessions = () => ({
    method: 'delete',
    url: 'auth/sessions'
});

export const revokeSession = (UID) => ({
    method: 'delete',
    url: `auth/sessions/${UID}`
});
