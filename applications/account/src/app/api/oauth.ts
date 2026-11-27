export const getOAuthLastAccess = (ClientID: string) => ({
    method: 'get',
    url: `oauth/v1/last_access`,
    params: {
        ClientID,
    },
});

export interface OAuthLastAccess {
    Accepted: boolean;
    LastAccess: number | null;
    AcceptanceTime: number | null;
}

export const getOAuthClientInfo = (clientID: string) => ({
    method: 'get',
    url: `oauth/v1/client/${clientID}`,
});

export interface OAuthClientInfo {
    ClientID: string;
    Name: string;
    Logo: string;
    ModifyTime: number;
    CreateTime: number;
}

export interface OAuthForkResponse {
    Code: string;
    RedirectUri: string;
}

export const postOAuthFork = (data: { ClientID: string; OaSession: string }) => ({
    method: 'post',
    url: 'oauth/v1/fork',
    data,
});
