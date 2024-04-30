import { isB2BAdmin } from '@proton/pass/lib/organization/helpers';
import { type MaybeNull } from '@proton/pass/types';
import type { Organization } from '@proton/shared/lib/interfaces';

import { INITIAL_ORGANIZATION_SETTINGS } from './reducers/organization';
import { INITIAL_HIGHSECURITY_SETTINGS } from './reducers/user';
import { selectPassPlan, selectUser } from './selectors';
import type { State } from './types';

export const migrate = (state: State) => {
    const user = selectUser(state);
    const plan = selectPassPlan(state);

    if ('organization' in state.user) {
        const organization = state.user.organization as MaybeNull<Organization>;
        delete state.user.organization;

        if (!state.organization) {
            state.organization = organization
                ? {
                      organization,
                      canUpdate: user ? isB2BAdmin(user, plan) : false,
                      settings: INITIAL_ORGANIZATION_SETTINGS,
                  }
                : null;
        }
    }
    if (state.user.userSettings && !state.user.userSettings.HighSecurity) {
        state.user.userSettings.HighSecurity = INITIAL_HIGHSECURITY_SETTINGS;
    }

    return state;
};
