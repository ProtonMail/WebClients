import { createSelector } from '@reduxjs/toolkit';

import type { State } from '../types';
import { selectAllItems, sortItems } from './items';
import { selectAllVaults } from './shares';

export const selectLimits = createSelector(
    [selectAllItems, selectAllVaults, ({ user }: State) => user.plan],
    (items, vaults, plan) => {
        const aliasUsed = items.filter((item) => item.data.type === 'alias').length;
        const totpItems = sortItems(
            items.filter((item) => item.data.type === 'login' && Boolean(item.data.content.totpUri)),
            'createTimeASC'
        );
        const totpUsed = totpItems.length;
        const vaultUsed = vaults.length;

        let aliasLimitFilled = false;
        let aliasLimitOver = false;
        let totpLimitFilled = false;
        let totpLimitOver = false;
        let totpInLimitItemIds: string[] = [];
        let vaultLimitFilled = false;
        let vaultLimitOver = false;

        if (typeof plan?.AliasLimit === 'number') {
            aliasLimitFilled = aliasUsed >= plan.AliasLimit;
            aliasLimitOver = aliasUsed > plan.AliasLimit;
        }

        if (typeof plan?.TotpLimit === 'number') {
            totpLimitFilled = totpUsed >= plan.TotpLimit;
            totpLimitOver = totpUsed > plan.TotpLimit;
            totpInLimitItemIds = totpItems.slice(0, plan.TotpLimit).map((item) => item.itemId);
        }

        if (typeof plan?.VaultLimit === 'number') {
            vaultLimitFilled = vaultUsed >= plan.VaultLimit;
            vaultLimitOver = vaultUsed > plan.VaultLimit;
        }

        const isOverLimits = aliasLimitOver || totpLimitOver || vaultLimitOver;

        return {
            aliasUsed,
            aliasLimit: plan?.AliasLimit,
            aliasLimitFilled,
            totpLimitFilled,
            totpInLimitItemIds,
            vaultLimitFilled,
            isOverLimits,
        };
    }
);
