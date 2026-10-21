import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectOrganizationVaultCreationPolicy } from '../../store/selectors/organization';
import { selectOwnedVaults } from '../../store/selectors/shares';
import { OrganizationVaultCreateMode } from '../../types/api/pass';
import type { MaybeNull } from '../../types/utils';

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
