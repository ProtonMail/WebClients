import { USER_ROLES } from '../constants';
import { CachedOrganizationKey, Member } from '../interfaces';

export const getHasOtherAdmins = (members: Member[]) =>
    members.some(({ Role, Self }) => Self !== 1 && Role === USER_ROLES.ADMIN_ROLE);

export const getNonPrivateMembers = (members: Member[]) => members.filter(({ Private }) => Private === 0);

export const getOrganizationKeyInfo = (organizationKey?: CachedOrganizationKey) => {
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
