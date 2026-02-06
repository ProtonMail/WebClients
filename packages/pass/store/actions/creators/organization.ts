import { c } from 'ttag';

import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { withNotification } from '@proton/pass/store/actions/enhancers/notification';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { OrganizationGetResponse } from '@proton/pass/types';
import type { GroupMembersGetResponse, GroupsGetResponse } from '@proton/pass/types/api/core';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';

export const getOrganizationSettings = requestActionsFactory<void, OrganizationGetResponse, unknown>('organization::settings::get')({
    success: {
        prepare: (payload) => withCache({ payload }),
        config: { maxAge: 15 * UNIX_MINUTE, data: null },
    },
    failure: { prepare: (error, payload) => ({ payload, error }) },
});

export const getOrganizationGroups = requestActionsFactory<void, GroupsGetResponse, unknown>('organization::groups::get')({
    success: {
        prepare: (payload) => withCache({ payload }),
        config: { maxAge: 15 * UNIX_MINUTE, data: null },
    },
    failure: { prepare: (error, payload) => ({ payload, error }) },
});

export const groupMembers = requestActionsFactory<string, GroupMembersGetResponse>('organization::group::members')({
    key: (groupId: string) => groupId,
    success: {
        prepare: (payload) => withCache({ payload }),
        config: { maxAge: 15 * UNIX_MINUTE },
    },
    failure: {
        prepare: (error, payload) =>
            withNotification({
                type: 'error',
                text: c('Error').t`Failed loading group members`,
                error,
            })({ payload }),
    },
});
