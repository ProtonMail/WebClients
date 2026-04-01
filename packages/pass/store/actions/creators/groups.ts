import { c } from 'ttag';

import type { Group, GroupMembersResponse, GroupsResponse } from '@proton/pass/lib/groups/groups.types';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { dataRequest, sessionRequest } from '@proton/pass/store/request/configs';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';
import identity from '@proton/utils/identity';

export const getGroups = requestActionsFactory<void, GroupsResponse, void>('groups::get-all')({
    success: sessionRequest(15 * UNIX_MINUTE),
});

export const getGroup = requestActionsFactory<string, Group, void>('groups::get')({
    key: identity,
    success: sessionRequest(15 * UNIX_MINUTE),
});

export const getGroupMembers = requestActionsFactory<string, GroupMembersResponse>('groups::members')({
    key: identity,
    success: dataRequest(15 * UNIX_MINUTE),
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Failed loading group members`,
                error,
            })({ payload }),
    },
});
