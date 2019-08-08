/**
 * @param {Object} organizationKey
 * @return {Object}
 */
export const getOrganizationKeyInfo = (organizationKey) => {
    return {
        hasOrganizationKey: !!organizationKey, // If the member has the organization key (not the organization itself).
        isOrganizationKeyActive: organizationKey && organizationKey.isDecrypted(),
        isOrganizationKeyInactive: organizationKey && !organizationKey.isDecrypted()
    };
};
