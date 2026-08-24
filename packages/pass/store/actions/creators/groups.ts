import { c } from 'ttag';

import identity from '@proton/utils/identity';

import type { Group, GroupMembersResponse, GroupsResponse } from '../../../lib/groups/groups.types';
import { UNIX_MINUTE } from '../../../utils/time/constants';
import { dataRequest, sessionRequest } from '../../request/configs';
import { requestActionsFactory } from '../../request/flow';
import { withNotification } from '../enhancers/notification';

export const getGroups = requestActionsFactory<void, GroupsResponse, void>('groups::get-all')({
    success: sessionRequest(15 * UNIX_MINUTE),
});

export const getGroup = requestActionsFactory<string, Group, void>('groups::get')({
    key: identity,
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
