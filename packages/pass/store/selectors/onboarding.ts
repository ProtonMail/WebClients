import { createSelector } from '@reduxjs/toolkit';

import { selectImportReport } from '@proton/pass/store/selectors/import';
import { selectWritableSharedVaults, selectWritableVaults } from '@proton/pass/store/selectors/shares';
import { selectPassPlan, selectUser } from '@proton/pass/store/selectors/user';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { isAdmin } from '@proton/shared/lib/user/helpers';

type B2BOnboardingStatus = {
    vaultCreated: boolean;
    vaultImported: boolean;
    vaultShared: boolean;
};

export const selectB2BOnboardingState = createSelector(
    [selectWritableVaults, selectWritableSharedVaults, selectImportReport],
    (vaults, sharedVaults, lastImport): B2BOnboardingStatus => ({
        vaultCreated: vaults.length > 1,
        vaultImported: lastImport !== null,
        vaultShared: sharedVaults.length > 0,
    })
);

export const selectB2BOnboardingComplete = (extensionInstalled: boolean) =>
    createSelector(
        selectB2BOnboardingState,
        (state): boolean => extensionInstalled && Object.values(state).every(truthy)
    );

export const selectB2BOnboardingEnabled = (extensionInstalled: boolean) =>
    createSelector(
        [selectUser, selectPassPlan, selectB2BOnboardingComplete(extensionInstalled)],
        (user, plan, complete) => user && isAdmin(user) && plan === UserPassPlan.BUSINESS && !complete
    );
