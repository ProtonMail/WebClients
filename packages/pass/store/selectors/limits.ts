import { createSelector } from '@reduxjs/toolkit';

import { selectItemsByType, selectTotpItems, sortItems } from './items';
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

export const selectTOTPLimits = createSelector([selectTotpItems, selectUserPlan], (totps, plan) => {
    const totpLimit = plan?.TotpLimit ?? Number.MAX_SAFE_INTEGER;

    return {
        totpLimit,
        totpTotalCount: totps.length,
        needsUpgrade: totps.length >= totpLimit,
        didDowngrade: totps.length > totpLimit,
    };
});

export const selectCanGenerateTOTP = (shareId: string, itemId: string) =>
    createSelector(
        [() => shareId, () => itemId, selectTOTPLimits, selectTotpItems],
        (_shareId, _itemId, { didDowngrade, totpLimit }, totps) => {
            if (!didDowngrade) return true;

            const viewableTOTPItems = sortItems(totps, 'createTimeASC').slice(0, totpLimit);
            return viewableTOTPItems.some((totp) => totp.shareId === _shareId && totp.itemId === _itemId);
        }
    );
