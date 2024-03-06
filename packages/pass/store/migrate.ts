import { isB2BAdmin } from '@proton/pass/lib/organization/helpers';
import { type MaybeNull } from '@proton/pass/types';
import type { Organization } from '@proton/shared/lib/interfaces';

import { INITIAL_ORGANIZATION_SETTINGS } from './reducers/organization';
import { selectPassPlan, selectUser } from './selectors';
import type { State } from './types';

export const migrate = (state: State) => {
    if ('organization' in state.user) {
        const organization = state.user.organization as MaybeNull<Organization>;
        delete state.user.organization;

        if (!state.organization) {
            const user = selectUser(state);
            const plan = selectPassPlan(state);

            state.organization = organization
                ? {
                      organization,
                      canUpdate: user ? isB2BAdmin(user, plan) : false,
                      settings: INITIAL_ORGANIZATION_SETTINGS,
                  }
                : null;
        }
    }

    return state;
};
