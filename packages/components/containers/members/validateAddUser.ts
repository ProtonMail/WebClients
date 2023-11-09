import { c } from 'ttag';

import { CachedOrganizationKey, Domain, Organization } from '@proton/shared/lib/interfaces';
import { getOrganizationKeyInfo } from '@proton/shared/lib/organization/helper';

import { UserManagementMode } from './types';

export const getDomainError = () => {
    return c('Error').t`Please configure a custom domain before adding users to your organization.`;
};

const validateAddUser = ({
    privateUser,
    organization,
    organizationKey,
    verifiedDomains,
    mode,
}: {
    privateUser: boolean;
    organization: Organization;
    organizationKey: CachedOrganizationKey | undefined;
    verifiedDomains: Domain[];
    mode: UserManagementMode;
}) => {
    const organizationKeyInfo = getOrganizationKeyInfo(organization, organizationKey);
    const { MaxMembers, HasKeys, UsedMembers, MaxAddresses, UsedAddresses, MaxSpace, AssignedSpace } = organization;
    const shouldValidateSpace = mode === UserManagementMode.DEFAULT;
    const shouldValidateDomain = mode === UserManagementMode.DEFAULT;
    if (MaxMembers === 1) {
        return c('Error').t`Please upgrade to a business plan with more than 1 user to manage multiple users.`;
    }
    if (!HasKeys) {
        return c('Error').t`Please enable multi-user support before adding users to your organization.`;
    }
    if (shouldValidateDomain && !verifiedDomains.length) {
        return getDomainError();
    }
    if (MaxMembers - UsedMembers < 1) {
        return c('Error').t`You have used all users in your plan. Please upgrade your plan to add a new user.`;
    }
    if (MaxAddresses - UsedAddresses < 1) {
        return c('Error').t`You have used all addresses in your plan. Please upgrade your plan to add a new address.`;
    }
    if (shouldValidateSpace && MaxSpace - AssignedSpace < 1) {
        return c('Error').t`All storage space has been allocated. Please reduce storage allocated to other users.`;
    }
    if (!privateUser) {
        if (organizationKeyInfo.userNeedsToActivateKey) {
            return c('Error').t`The organization key must be activated first.`;
        }
        if (organizationKeyInfo.userNeedsToReactivateKey) {
            return c('Error').t`The organization key must be activated first.`;
        }
        if (!organizationKey?.privateKey) {
            return c('Error').t`Organization key is not decrypted.`;
        }
    }
};

export default validateAddUser;
