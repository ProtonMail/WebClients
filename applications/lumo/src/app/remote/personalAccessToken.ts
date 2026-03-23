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

export interface RenewPersonalAccessTokenResponse {
    Code: number;
    PersonalAccessToken: Pick<PersonalAccessToken, 'PersonalAccessTokenID' | 'ExpireTime' | 'ModifyTime' | 'Token'>;
}

export interface PersonalAccessTokenUsageDay {
    /** ISO date string e.g. "2026-03-11" */
    Date: string;
    /** Total LLM tokens consumed on this day */
    TokenCount: number;
    /** Number of API calls made on this day */
    ApiCalls: number;
}

export interface PersonalAccessTokenUsageResponse {
    Code: number;
    Usage: PersonalAccessTokenUsageDay[];
}

const PAT_BASE_URL = 'account/4/personal-access-token';
const LUMO_PAT_BASE_URL = 'lumo/v1/personal-access-token';

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

export const getPersonalAccessTokenUsageRequest = (id: string, params?: { from?: string; to?: string }) => ({
    url: `${LUMO_PAT_BASE_URL}/${id}/usage`,
    method: 'get' as const,
    params,
});
