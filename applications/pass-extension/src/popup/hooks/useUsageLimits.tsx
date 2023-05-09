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
        aliasLimitExceeded: typeof plan?.AliasLimit === 'number' && aliasUsed >= plan.AliasLimit,
        totpLimitExceeded: typeof plan?.TotpLimit === 'number' && totpUsed >= plan.TotpLimit,
        vaultLimitExceeded: typeof plan?.VaultLimit === 'number' && vaultUsed >= plan.VaultLimit,
    };
};
