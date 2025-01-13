import { createSelector } from '@reduxjs/toolkit';

import { isAutofillableShare } from '@proton/pass/lib/shares/share.predicates';
import { selectVaultLimits } from '@proton/pass/store/selectors/limits';
import { selectAllShares } from '@proton/pass/store/selectors/shares';
import { selectPassPlan } from '@proton/pass/store/selectors/user';
import type { ShareId } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { prop } from '@proton/pass/utils/fp/lens';

import type { State } from '../types';

export const selectAutofillableShareIDs = createSelector(
    [selectAllShares, selectVaultLimits, selectPassPlan, (_: State, writableFilter?: boolean) => writableFilter],
    (shares, { didDowngrade }, plan, writableFilter): ShareId[] => {
        const writableOnly = writableFilter || didDowngrade || plan === UserPassPlan.FREE;
        return shares.filter((share) => isAutofillableShare(share, writableOnly)).map(prop('shareId'));
    }
);
