import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectOrganizationVaultCreationPolicy, selectOwnedVaults } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { OrganizationVaultCreateMode } from '@proton/pass/types';

export const useVaultCreationPolicy = (): {
    /** True if the organization policy is preventing vault creation, else false */
    vaultCreationDisabled: boolean;
    /** Number of vaults that can still be created, null if policy not set / allowed */
    vaultRemainingCount: MaybeNull<number>;
} => {
    const vaultCreationPolicy = useSelector(selectOrganizationVaultCreationPolicy);
    const reachedVaultLimit = useSelector(selectOwnedVaults).length >= 1;

    return useMemo(() => {
        switch (vaultCreationPolicy) {
            case null:
            case OrganizationVaultCreateMode.ALLOWED:
                return { vaultCreationDisabled: false, vaultRemainingCount: null };
            case OrganizationVaultCreateMode.ONLYORGADMINS:
                return { vaultCreationDisabled: true, vaultRemainingCount: 0 };
            case OrganizationVaultCreateMode.ONLYORGADMINSANDPERSONALVAULT:
                return { vaultCreationDisabled: reachedVaultLimit, vaultRemainingCount: reachedVaultLimit ? 0 : 1 };
        }
    }, [vaultCreationPolicy, reachedVaultLimit]);
};
