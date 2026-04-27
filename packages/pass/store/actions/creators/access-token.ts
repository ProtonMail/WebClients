import { c } from 'ttag';

import type {
    DecodedPatMonitorRecord,
    PersonalAccessToken,
    PersonalAccessTokenAccessGrant,
} from '@proton/pass/lib/access-token/access-token.types';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { sessionRequest } from '@proton/pass/store/request/configs';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import identity from '@proton/utils/identity';

export type CreateAccessTokenIntent = {
    name: string;
    expirationMinutes: number;
    isAgent: boolean;
    shareIds: string[];
};

export type CreateAccessTokenSuccess = {
    pat: PersonalAccessToken;
    /** One-shot env-var (`<token>::<b64url(raw-key)>`) — never persisted in state. */
    envVar: string;
    isAgent: boolean;
};

export type UpdateAccessTokenAccessIntent = {
    tokenId: string;
    /** The complete set of vault `shareId` values the token should have access
     * to after the update. The saga diffs this against the current grants. */
    shareIds: string[];
};

export type AccessTokenAccessGrants = {
    tokenId: string;
    grants: PersonalAccessTokenAccessGrant[];
};

export const getAccessTokens = requestActionsFactory<void, PersonalAccessToken[]>('access-token::list')({
    success: sessionRequest(5 * UNIX_MINUTE),
    failure: {
        prepare: (error) =>
            withNotification({
                type: 'error',
                text: c('pass_2026: Error').t`Failed to load access tokens`,
                error,
            })({ payload: getApiError(error) }),
    },
});

export const createAccessToken = requestActionsFactory<CreateAccessTokenIntent, CreateAccessTokenSuccess>('access-token::create')({
    failure: {
        prepare: (error) =>
            withNotification({
                type: 'error',
                text: c('pass_2026: Error').t`Failed to create access token`,
                error,
            })({ payload: getApiError(error) }),
    },
});

export const deleteAccessToken = requestActionsFactory<string, string>('access-token::delete')({
    key: identity,
    success: {
        prepare: (payload) =>
            withNotification({
                type: 'success',
                text: c('pass_2026: Notification').t`Access token deleted`,
            })({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('pass_2026: Error').t`Failed to delete access token`,
                error,
            })({ payload, error }),
    },
});

export const getAccessTokenAccess = requestActionsFactory<string, AccessTokenAccessGrants>('access-token::access::list')({
    key: identity,
    success: sessionRequest(5 * UNIX_MINUTE),
});

export const updateAccessTokenAccess = requestActionsFactory<UpdateAccessTokenAccessIntent, AccessTokenAccessGrants>(
    'access-token::access::update'
)({
    key: ({ tokenId }) => tokenId,
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('pass_2026: Error').t`Failed to update vault access`,
                error,
            })({ payload, error }),
    },
});

export type GetAccessTokenActionsIntent = {
    tokenId: string;
    /** Cursor — pass the previous response's `nextSince`, or omit for the
     * first page. The reducer appends when this is set, replaces otherwise. */
    since?: string;
};

export type AccessTokenActionsPage = {
    tokenId: string;
    records: DecodedPatMonitorRecord[];
    nextSince: string | null;
    /** Mirrors whether the intent had a `since` cursor — tells the reducer
     * to append vs. replace. */
    append: boolean;
};

export const getAccessTokenActions = requestActionsFactory<GetAccessTokenActionsIntent, AccessTokenActionsPage>(
    'access-token::actions::list'
)({
    key: ({ tokenId, since }) => `${tokenId}::${since ?? 'first'}`,
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('pass_2026: Error').t`Failed to load token actions`,
                error,
            })({ payload, error }),
    },
});
