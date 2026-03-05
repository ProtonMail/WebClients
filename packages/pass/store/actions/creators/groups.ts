import { c } from 'ttag';

import type { Group, GroupMembersResponse, GroupsResponse } from '@proton/pass/lib/groups/groups.types';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';
import identity from '@proton/utils/identity';

export const getGroups = requestActionsFactory<void, GroupsResponse, unknown>('groups::get-all')({
    success: { config: { maxAge: 15 * UNIX_MINUTE, data: null, hot: true } },
    failure: { prepare: (error, payload) => ({ payload, error }) },
});

export const getGroup = requestActionsFactory<string, Group, unknown>('groups::get')({
    key: identity,
    success: { config: { maxAge: 15 * UNIX_MINUTE, data: null, hot: true } },
    failure: { prepare: (error, payload) => ({ payload, error }) },
});

export const getGroupMembers = requestActionsFactory<string, GroupMembersResponse>('groups::members')({
    key: identity,
    success: { config: { maxAge: 15 * UNIX_MINUTE, data: null, hot: true } },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Failed loading group members`,
                error,
            })({ payload }),
    },
});
