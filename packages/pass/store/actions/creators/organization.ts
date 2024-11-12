import { withCache } from '@proton/pass/store/actions/enhancers/cache';
import { requestActionsFactory } from '@proton/pass/store/request/flow';
import type { OrganizationGetResponse } from '@proton/pass/types';
import { UNIX_MINUTE } from '@proton/pass/utils/time/constants';

export const getOrganizationSettings = requestActionsFactory<void, OrganizationGetResponse, unknown>(
    'organization::settings::get'
)({
    success: {
        prepare: (payload) => withCache({ payload }),
        config: { maxAge: 15 * UNIX_MINUTE },
    },
    failure: { prepare: (error) => ({ payload: {}, error }) },
});
