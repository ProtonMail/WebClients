import { isB2BAdmin } from '@proton/pass/lib/organization/helpers';
import { type MaybeNull } from '@proton/pass/types';
import { objectFilter } from '@proton/pass/utils/object/filter';
import { objectMap } from '@proton/pass/utils/object/map';
import type { Organization } from '@proton/shared/lib/interfaces';

import { unwrapOptimisticState } from './optimistic/utils/transformers';
import { INITIAL_ORGANIZATION_SETTINGS } from './reducers/organization';
import { INITIAL_HIGHSECURITY_SETTINGS } from './reducers/user';
import { selectPassPlan, selectUser } from './selectors';
import type { State } from './types';

export const migrate = (state: State) => {
    const user = selectUser(state);
    const plan = selectPassPlan(state);

    /** Sanitize the item state to ensure we have no invalid item
     * data - FIXME: remove when pin-pointing the faulty partial
     * item update causing this edge-case error */
    state.items.byShareId = {
        ...state.items.byShareId,
        ...objectMap(unwrapOptimisticState(state.items.byShareId), (_, items) =>
            objectFilter(items, (_, item) => item && ['itemId', 'shareId', 'data'].every((key) => key in item))
        ),
    };

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
