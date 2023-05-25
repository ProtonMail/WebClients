import { createSelector } from '@reduxjs/toolkit';

import type { Maybe, OtpRequest } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp';

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
    const totpTotalCount = totps.reduce<number>(
        (total, item) =>
            total +
            (item.data.content.totpUri ? 1 : 0) +
            item.data.extraFields.filter((field) => field.type === 'totp' && field.data.totpUri).length,
        0
    );

    return {
        totpLimit,
        totpTotalCount,
        needsUpgrade: totpTotalCount >= totpLimit,
        didDowngrade: totpTotalCount > totpLimit,
    };
});

/* disable extra field TOTP generation if
 * if user has downgraded */
export const selectCanGenerateTOTP = (otpRequest: OtpRequest) =>
    createSelector(
        [
            () => otpRequest.shareId,
            () => otpRequest.itemId,
            () => otpRequest.type,
            () => (otpRequest.type === 'extraField' ? otpRequest.index : undefined),
            selectTOTPLimits,
            selectTotpItems,
        ],
        (shareId, itemId, type, index, { didDowngrade, totpLimit }, totps) => {
            if (!didDowngrade) return true;

            const { valid: validOTPRequests } = sortItems(totps, 'createTimeASC').reduce<{
                remaining: number;
                valid: OtpRequest[];
            }>(
                (result, item) => {
                    if (result.remaining > 0 && item.data.content.totpUri) {
                        result.valid.push({ shareId: item.shareId, itemId: item.itemId, type: 'item' });
                        result.remaining -= 1;
                    }

                    if (result.remaining > 0) {
                        const extraTotps = item.data.extraFields
                            .map<Maybe<OtpRequest>>((field, index) =>
                                field.type === 'totp' && field.data.totpUri
                                    ? { shareId: item.shareId, itemId: item.itemId, type: 'extraField', index }
                                    : undefined
                            )
                            .filter(truthy)
                            .slice(0, result.remaining);
                        result.valid.push(...extraTotps);
                        result.remaining -= extraTotps.length;
                    }

                    return result;
                },
                { remaining: totpLimit, valid: [] }
            );

            return validOTPRequests.some(
                (req) =>
                    req.shareId === shareId &&
                    req.itemId === itemId &&
                    req.type === type &&
                    (req.type === 'item' || req.index === index)
            );
        }
    );
