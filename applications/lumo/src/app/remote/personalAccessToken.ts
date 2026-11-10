export interface PersonalAccessToken {
    PersonalAccessTokenID: string;
    Name: string;
    PersonalAccessTokenKey: string;
    ExpireTime: number;
    CreateTime: number;
    ModifyTime: number;
    TokenMask: number;
    Token?: string;
}

export interface CreatePersonalAccessTokenPayload {
    Name: string;
    Products: string[];
    PersonalAccessTokenKey: string;
    ExpireTime: number;
}

export interface CreatePersonalAccessTokenResponse {
    Code: number;
    PersonalAccessToken: PersonalAccessToken;
}

export interface ListPersonalAccessTokensResponse {
    Code: number;
    PersonalAccessTokens: {
        PersonalAccessTokens: PersonalAccessToken[];
        Total: number;
        LastToken: string | null;
    };
}

const PAT_BASE_URL = 'account/4/personal-access-token';

export const createPersonalAccessTokenRequest = (payload: CreatePersonalAccessTokenPayload) => ({
    url: PAT_BASE_URL,
    method: 'post' as const,
    data: payload,
});

export const listPersonalAccessTokensRequest = (params?: { Since?: string; PageSize?: number }) => ({
    url: PAT_BASE_URL,
    method: 'get' as const,
    params,
});

export const deletePersonalAccessTokenRequest = (id: string) => ({
    url: `${PAT_BASE_URL}/${id}`,
    method: 'delete' as const,
});
