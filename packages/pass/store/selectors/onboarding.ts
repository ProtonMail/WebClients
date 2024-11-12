import { createSelector } from '@reduxjs/toolkit';

import { selectLatestImport } from '@proton/pass/store/selectors/import';
import { selectWritableSharedVaults, selectWritableVaults } from '@proton/pass/store/selectors/shares';
import { selectPassPlan, selectUser } from '@proton/pass/store/selectors/user';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { isAdmin } from '@proton/shared/lib/user/helpers';

export type OnboardingStatus = {
    vaultCreated: boolean;
    vaultImported: boolean;
    vaultShared: boolean;
};

export const selectOnboardingState = createSelector(
    [selectWritableVaults, selectWritableSharedVaults, selectLatestImport],
    (vaults, sharedVaults, lastImport): OnboardingStatus => ({
        vaultCreated: vaults.length > 1,
        vaultImported: lastImport !== null,
        vaultShared: sharedVaults.length > 0,
    })
);

export const selectOnboardingComplete = (extensionInstalled: boolean) =>
    createSelector(selectOnboardingState, (state): boolean => extensionInstalled && Object.values(state).every(truthy));

export const selectB2BOnboardingEnabled = (extensionInstalled: boolean) =>
    createSelector(
        [selectUser, selectPassPlan, selectOnboardingComplete(extensionInstalled)],
        (user, plan, complete) => user && isAdmin(user) && plan === UserPassPlan.BUSINESS && !complete
    );
