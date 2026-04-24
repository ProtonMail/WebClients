import { api } from '@proton/pass/lib/api/api';

import type {
    CreatePersonalAccessTokenPayload,
    CreatePersonalAccessTokenResponse,
    GrantPersonalAccessTokenAccessPayload,
    ListPersonalAccessTokensResponse,
    PersonalAccessToken,
    PersonalAccessTokenAccessGrant,
} from './access-token.types';

const PAT_BASE_URL = 'account/v4/personal-access-token';
const PASS_PAT_BASE_URL = 'pass/v1/personal-access-token';

export const listPersonalAccessTokens = async (): Promise<PersonalAccessToken[]> => {
    const response = await api<ListPersonalAccessTokensResponse>({
        url: PAT_BASE_URL,
        method: 'get',
    });
    return response.PersonalAccessTokens.PersonalAccessTokens ?? [];
};

export const createPersonalAccessToken = async (
    payload: CreatePersonalAccessTokenPayload
): Promise<PersonalAccessToken> => {
    const response = await api<CreatePersonalAccessTokenResponse>({
        url: PAT_BASE_URL,
        method: 'post',
        data: payload,
    });
    return response.PersonalAccessToken;
};

export const deletePersonalAccessToken = async (id: string): Promise<void> => {
    await api({
        url: `${PAT_BASE_URL}/${id}`,
        method: 'delete',
    });
};

/** Grants the PAT access to the provided Pass vaults. Each entry carries the
 * vault's share keys (one per rotation) wrapped with the PAT's symmetric key. */
export const grantPersonalAccessTokenAccess = async (
    id: string,
    payload: GrantPersonalAccessTokenAccessPayload
): Promise<void> => {
    await api({
        url: `${PASS_PAT_BASE_URL}/${id}/access`,
        method: 'post',
        data: payload,
    });
};

interface ListPersonalAccessTokenAccessResponse {
    Code: number;
    Shares: PersonalAccessTokenAccessGrant[];
    LastToken: string | null;
}

export const listPersonalAccessTokenAccess = async (id: string): Promise<PersonalAccessTokenAccessGrant[]> => {
    const response = await api<ListPersonalAccessTokenAccessResponse>({
        url: `${PASS_PAT_BASE_URL}/${id}/access`,
        method: 'get',
    });
    return response.Shares ?? [];
};

/** Revokes a single PAT access grant. `shareId` here is the PAT-scoped
 * `ShareID` from the list-access response, not the user's `vault.shareId`. */
export const revokePersonalAccessTokenAccess = async (id: string, shareId: string): Promise<void> => {
    await api({
        url: `${PASS_PAT_BASE_URL}/${id}/access/${shareId}`,
        method: 'delete',
    });
};
