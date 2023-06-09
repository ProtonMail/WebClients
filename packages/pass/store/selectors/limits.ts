import { createSelector } from '@reduxjs/toolkit';

import { PlanType } from '@proton/pass/types';

import { selectItemsByType, sortItems } from './items';
import { selectAllVaults } from './shares';
import { selectUserPlan } from './user';

export const selectVaultLimits = createSelector([selectAllVaults, selectUserPlan], (vaults, plan) => {
    const vaultLimit = plan?.VaultLimit ?? Number.MAX_SAFE_INTEGER;

    return {
        vaultLimit,
        vaultTotalCount: vaults.length,
        needsUpgrade: vaults.length >= vaultLimit,
        didDowngrade: vaults.length > vaultLimit,
    };
});

export const selectAliasLimits = createSelector([selectItemsByType('alias'), selectUserPlan], (alias, plan) => {
    const aliasLimit = plan?.AliasLimit ?? Number.MAX_SAFE_INTEGER;

    return {
        aliasLimit,
        aliasLimited: typeof plan?.AliasLimit === 'number',
        aliasTotalCount: alias.length,
        needsUpgrade: alias.length >= aliasLimit,
        didDowngrade: alias.length > aliasLimit,
    };
});

export const selectTOTPLimits = createSelector([selectItemsByType('login'), selectUserPlan], (loginItems, plan) => {
    const totpLimit = plan?.TotpLimit ?? Number.MAX_SAFE_INTEGER;
    const totpItems = loginItems.filter((item) => Boolean(item.data.content.totpUri));
    const totpTotalCount = totpItems.length;

    return {
        totpLimit,
        totpTotalCount,
        needsUpgrade: totpTotalCount >= totpLimit,
        didDowngrade: totpTotalCount > totpLimit,
        totpAllowed: (itemId: string) =>
            sortItems(totpItems, 'createTimeASC')
                .slice(0, totpLimit)
                .some((item) => item.itemId === itemId),
    };
});

export const selectExtraFieldLimits = createSelector([selectUserPlan], (plan) => {
    return {
        needsUpgrade: plan?.Type === PlanType.free,
    };
});
