import { createSelector } from '@reduxjs/toolkit';

import { sortItems } from '@proton/pass/lib/items/item.utils';
import { PlanType } from '@proton/pass/types';

import { selectAliasItems, selectLoginItems } from './items';
import { selectAllVaults } from './shares';
import { selectUserPlan } from './user';

export const selectVaultLimits = createSelector([selectAllVaults, selectUserPlan], (vaults, plan) => {
    const vaultLimit = plan?.VaultLimit ?? Number.MAX_SAFE_INTEGER;

    return {
        vaultLimit,
        vaultTotalCount: vaults.length,
        vaultLimitReached: vaults.length >= vaultLimit,
        didDowngrade: vaults.length > vaultLimit && plan?.Type === PlanType.FREE,
    };
});

export const selectAliasLimits = createSelector([selectAliasItems, selectUserPlan], (aliases, plan) => {
    const aliasLimit = plan?.AliasLimit ?? Number.MAX_SAFE_INTEGER;

    return {
        aliasLimit,
        aliasLimited: typeof plan?.AliasLimit === 'number',
        aliasTotalCount: aliases.length,
        needsUpgrade: aliases.length >= aliasLimit,
        didDowngrade: aliases.length > aliasLimit,
    };
});

export const selectTOTPLimits = createSelector([selectLoginItems, selectUserPlan], (loginItems, plan) => {
    const totpLimit = plan?.TotpLimit;
    let needsUpgrade = false;
    let didDowngrade = false;
    let totpAllowed: (itemId: string) => boolean = () => true;

    if (typeof totpLimit === 'number') {
        const totpItems = loginItems.filter((item) => Boolean(item.data.content.totpUri.v));
        const totpTotalCount = totpItems.length;

        needsUpgrade = totpTotalCount >= totpLimit;
        didDowngrade = totpTotalCount > totpLimit;
        totpAllowed = (itemId: string) =>
            sortItems('createTimeASC')(totpItems)
                .slice(0, totpLimit)
                .some((item) => item.itemId === itemId);
    }

    return {
        totpLimit,
        needsUpgrade,
        didDowngrade,
        totpAllowed,
    };
});

export const selectExtraFieldLimits = createSelector([selectUserPlan], (plan) => {
    return {
        needsUpgrade: plan?.Type === PlanType.FREE,
    };
});
