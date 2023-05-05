import { useSelector } from 'react-redux';

import { selectAllVaults, selectItemsByType, selectUserPlan } from '@proton/pass/store';

export const useUsageLimits = () => {
    const plan = useSelector(selectUserPlan);
    const aliasUsed = useSelector(selectItemsByType('alias')).length;
    const totpUsed = useSelector(selectItemsByType('login')).filter((item) => !!item.data.content.totpUri).length;
    const vaultUsed = useSelector(selectAllVaults).length;

    return {
        aliasUsed,
        aliasLimit: plan?.AliasLimit,
        aliasLimitExceeded: !!plan?.AliasLimit && aliasUsed >= plan.AliasLimit,
        totpLimitExceeded: !!plan?.TotpLimit && totpUsed >= plan.TotpLimit,
        vaultLimitExceeded: !!plan?.VaultLimit && vaultUsed >= plan.VaultLimit,
    };
};
