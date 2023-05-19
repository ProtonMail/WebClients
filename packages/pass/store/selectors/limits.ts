import { createSelector } from '@reduxjs/toolkit';

import { selectItemsByType, selectTotpItems, sortItems } from './items';
import { selectAllVaults } from './shares';
import { selectUserPlan } from './user';

export const selectVaultLimits = createSelector([selectAllVaults, selectUserPlan], (vaults, plan) => {
    const vaultLimit = plan?.VaultLimit ?? Number.MAX_SAFE_INTEGER;

    return {
        vaultAllowCreate: vaults.length < vaultLimit,
        vaultCountExcess: vaults.length > vaultLimit,
    };
});

export const selectAliasLimits = createSelector([selectItemsByType('alias'), selectUserPlan], (alias, plan) => {
    const aliasLimit = plan?.AliasLimit ?? Number.MAX_SAFE_INTEGER;

    return {
        aliasLimit,
        aliasLimited: typeof plan?.AliasLimit === 'number',
        aliasTotalCount: alias.length,
        aliasAllowCreate: alias.length < aliasLimit,
        aliasCountExcess: alias.length > aliasLimit,
    };
});

export const selectTOTPLimits = createSelector([selectTotpItems, selectUserPlan], (totps, plan) => {
    const totpLimit = plan?.TotpLimit ?? Number.MAX_SAFE_INTEGER;

    return {
        totpLimit,
        totpTotalCount: totps.length,
        totpAllowCreate: totps.length < totpLimit,
        totpCountExcess: totps.length > totpLimit,
    };
});

export const selectCanGenerateTOTP = (shareId: string, itemId: string) =>
    createSelector(
        [() => shareId, () => itemId, selectTOTPLimits, selectTotpItems],
        (_shareId, _itemId, { totpCountExcess, totpLimit }, totps) => {
            if (!totpCountExcess) return true;

            const viewableTOTPItems = sortItems(totps, 'createTimeASC').slice(0, totpLimit);
            return viewableTOTPItems.some((totp) => totp.shareId === _shareId && totp.itemId === _itemId);
        }
    );
