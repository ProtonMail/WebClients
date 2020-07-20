import { OrganizationKey } from '../../../hooks/useGetOrganizationKeyRaw';

export const getOrganizationKeyInfo = (organizationKey?: OrganizationKey) => {
    // If the member has the organization key (not the organization itself).
    const hasOrganizationKey = !!organizationKey?.Key.PrivateKey;
    return {
        hasOrganizationKey,
        // It's active if it has been successfully decrypted
        isOrganizationKeyActive: !!organizationKey?.privateKey,
        // It's inactive if it exists, but not decrypted
        isOrganizationKeyInactive: hasOrganizationKey && !organizationKey?.privateKey,
    };
};
