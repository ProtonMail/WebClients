import { AGENT_INSTRUCTIONS_URL } from '@proton/pass/constants';
import { api } from '@proton/pass/lib/api/api';

import type {
    CreatePersonalAccessTokenPayload,
    CreatePersonalAccessTokenResponse,
    GrantPersonalAccessTokenAccessPayload,
    ListPatMonitorResponse,
    ListPersonalAccessTokensResponse,
    PatMonitorRecord,
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

/** Page size matching the rust CLI's `PAGE_SIZE` constant in
 * `pass/src/monitor.rs`. Used to detect "short page = last page". */
const PAT_MONITOR_PAGE_SIZE = 100;

/** Returns one page of audit records for actions made by a PAT.
 * Pass `since` (the previous response's `NextSince`) for subsequent pages.
 * A null `nextSince` in the result means there are no more pages.
 *
 * The server may return a non-null `NextSince` even on the final page; we
 * normalise that to `null` whenever we got fewer records than `PageSize`,
 * mirroring the rust CLI's `fetched == 0 || next_since.is_none()` loop
 * termination. */
export const listPatMonitorRecords = async (
    id: string,
    since?: string
): Promise<{ records: PatMonitorRecord[]; nextSince: string | null }> => {
    const response = await api<ListPatMonitorResponse>({
        url: `pass/v1/pat/monitor/${id}`,
        method: 'get',
        params: { PageSize: PAT_MONITOR_PAGE_SIZE, ...(since ? { Since: since } : {}) },
    });
    const records = response.Actions.Records ?? [];
    const serverNextSince = response.Actions.NextSince;
    const hasMore = records.length === PAT_MONITOR_PAGE_SIZE && typeof serverNextSince === 'string';
    return {
        records,
        nextSince: hasMore ? serverNextSince : null,
    };
};

export const fetchAgentInstructions = async (): Promise<string> => {
    const response = await fetch(AGENT_INSTRUCTIONS_URL);
    if (!response.ok) throw new Error(`Failed to fetch agent instructions (${response.status})`);
    return response.text();
};
