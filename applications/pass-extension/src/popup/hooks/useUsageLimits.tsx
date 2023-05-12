import { useSelector } from 'react-redux';

import { selectAllVaults, selectItemsByType, selectUserPlan } from '@proton/pass/store';

export const useUsageLimits = () => {
    const plan = useSelector(selectUserPlan);
    const aliasUsed = useSelector(selectItemsByType('alias')).length;
    const totpItems = useSelector(selectItemsByType('login', 'createTimeASC')).filter(
        (item) => !!item.data.content.totpUri
    );
    const totpUsed = totpItems.length;
    const vaultUsed = useSelector(selectAllVaults).length;

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
};
