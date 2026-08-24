import { c } from 'ttag';

import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import identity from '@proton/utils/identity';

import type {
    AccessTokenAccessGrants,
    AccessTokenActionsPage,
    CreateAccessTokenIntent,
    CreateAccessTokenSuccess,
    GetAccessTokenActionsIntent,
    PersonalAccessToken,
    UpdateAccessTokenAccessIntent,
} from '../../../lib/access-token/access-token.types';
import { uniqueId } from '../../../utils/string/unique-id';
import { UNIX_HOUR, UNIX_MINUTE } from '../../../utils/time/constants';
import { dataRequest, sessionRequest } from '../../request/configs';
import { requestActionsFactory } from '../../request/flow';
import { withNotification } from '../enhancers/notification';

export const getAccessTokens = requestActionsFactory<void, PersonalAccessToken[]>('access-token::list')({
    success: sessionRequest(5 * UNIX_MINUTE),
    failure: {
        prepare: (error) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Failed to load access tokens`,
                error,
            })({ payload: getApiError(error) }),
    },
});

export const createAccessToken = requestActionsFactory<CreateAccessTokenIntent, CreateAccessTokenSuccess>('access-token::create')({
    key: () => uniqueId(),
    failure: {
        prepare: (error) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Failed to create access token`,
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
                text: c('Notification').t`Access token deleted`,
            })({ payload }),
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Failed to delete access token`,
                error,
            })({ payload, error }),
    },
});

export const getAccessTokenGrants = requestActionsFactory<string, AccessTokenAccessGrants>('access-token::access::list')({
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
                text: c('Error').t`Failed to update vault access`,
                error,
            })({ payload, error }),
    },
});

export const getAccessTokenActions = requestActionsFactory<GetAccessTokenActionsIntent, AccessTokenActionsPage>(
    'access-token::actions::list'
)({
    key: ({ tokenId, since }) => `${tokenId}::${since ?? 'first'}`,
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Failed to load token actions`,
                error,
            })({ payload, error }),
    },
});

export const getAgentInstructions = requestActionsFactory<void, string>('access-token::agent-instructions')({
    success: dataRequest(UNIX_HOUR),
});
