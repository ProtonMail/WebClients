import { AGENT_INSTRUCTIONS_URL } from '@proton/pass/constants.runtime';
import { PAT_PRODUCT, decodePatRecord } from '@proton/pass/lib/access-token/access-token.utils';
import { api } from '@proton/pass/lib/api/api';
import { PassCrypto } from '@proton/pass/lib/crypto';
import type { GrantAccessRequest, PersonalAccessTokenShareResponse, ShareId } from '@proton/pass/types';
import { ShareRole, ShareType } from '@proton/pass/types';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';
import { getEpoch } from '@proton/pass/utils/time/epoch';

import type {
    AccessTokenActionsPage,
    CreateAccessTokenIntent,
    CreatePersonalAccessTokenPayload,
    CreatePersonalAccessTokenResponse,
    ListPersonalAccessTokensResponse,
    PersonalAccessToken,
    PersonalAccessTokenWithKey,
} from './access-token.types';

const PAT_BASE_URL = 'account/v4/personal-access-token';
const PASS_PAT_BASE_URL = 'pass/v1/personal-access-token';

/** Lists all access tokens  */
export const listPersonalAccessTokens = async (): Promise<PersonalAccessToken[]> => {
    const response = await api<ListPersonalAccessTokensResponse>({
        url: PAT_BASE_URL,
        method: 'get',
        params: { IncludeExpired: 1, Product: PAT_PRODUCT },
    });
    return response.PersonalAccessTokens.PersonalAccessTokens ?? [];
};

/** Creates a fresh access token key and registers the PAT */
export const createPersonalAccessToken = async ({
    name,
    isAgent,
    expirationMinutes,
}: CreateAccessTokenIntent): Promise<PersonalAccessTokenWithKey> => {
    const { encrypted, raw: rawPatKey } = await PassCrypto.createAccessTokenKey();

    const { PersonalAccessToken } = await api<CreatePersonalAccessTokenResponse>({
        url: PAT_BASE_URL,
        method: 'post',
        data: {
            Name: name,
            Products: [PAT_PRODUCT],
            PersonalAccessTokenKey: encrypted,
            ExpireTime: getEpoch() + expirationMinutes * UNIX_MINUTE,
            Flags: isAgent ? { PassAgent: true } : null,
        } satisfies CreatePersonalAccessTokenPayload,
    });

    if (!PersonalAccessToken.Token) throw new Error('Token not returned by server');
    return { data: PersonalAccessToken, rawPatKey };
};

/** Deletes a personal access token by tokenId */
export const deletePersonalAccessToken = async (tokenId: string): Promise<void> => {
    await api({
        url: `${PAT_BASE_URL}/${tokenId}`,
        method: 'delete',
    });
};

/** Grants the PAT access to the provided payload  */
export const grantPersonalAccessTokenAccess = async (tokenId: string, payload: GrantAccessRequest): Promise<void> => {
    await api({
        url: `${PASS_PAT_BASE_URL}/${tokenId}/access`,
        method: 'post',
        data: payload,
    });
};

/** Grants the PAT access to the provided Pass vaults. Each entry carries the
 * vault's share keys (one per rotation) wrapped with the PAT's symmetric key.
 * Note: assumes `shareId` is of type vault */
export const grantPersonalAccessTokenVaultAccess = async (
    tokenId: string,
    shareId: ShareId,
    rawPatKey: Uint8Array<ArrayBuffer>
) => {
    const Keys = await PassCrypto.createAccessTokenShareKeys({ rawPatKey, shareId });
    await grantPersonalAccessTokenAccess(tokenId, {
        ShareID: shareId,
        TargetType: ShareType.Vault,
        ShareRoleID: ShareRole.READ,
        Keys,
    });
};

export const listPersonalAccessTokenAccess = async (id: string): Promise<PersonalAccessTokenShareResponse[]> => {
    const response = await api({
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
 * A null `nextSince` in the result means there are no more pages. */
export const listPatMonitorRecords = async (
    pat: PersonalAccessToken,
    since?: string
): Promise<AccessTokenActionsPage> => {
    const response = await api({
        url: `pass/v1/pat/monitor/${pat.PersonalAccessTokenID}`,
        method: 'get',
        params: { PageSize: PAT_MONITOR_PAGE_SIZE, ...(since ? { Since: since } : {}) },
    });

    const rawPatKey = await PassCrypto.openAccessTokenKey(pat.PersonalAccessTokenKey);
    const records = await Promise.all(response.Actions.Records.map((record) => decodePatRecord(record, rawPatKey)));

    // Workaround for BE issue: NextSince is always returned on the initial request
    // even if there is no next page. If we see less than PAT_MONITOR_PAGE_SIZE records,
    // then we can safely assume there is no next page.
    const nextSince =
        response.Actions.Records.length >= PAT_MONITOR_PAGE_SIZE ? (response.Actions.NextSince ?? null) : null;

    return {
        records,
        nextSince,
        append: Boolean(since),
        tokenId: pat.PersonalAccessTokenID,
    };
};

export const fetchAgentInstructions = async (): Promise<string> => {
    const response = await fetch(AGENT_INSTRUCTIONS_URL);
    if (!response.ok) throw new Error(`Failed to fetch agent instructions (${response.status})`);
    return response.text();
};
