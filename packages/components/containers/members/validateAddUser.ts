import { c } from 'ttag';

import { CachedOrganizationKey, Domain, Organization } from '@proton/shared/lib/interfaces';
import { getOrganizationKeyInfo } from '@proton/shared/lib/organization/helper';

const validateAddUser = (
    organization: Organization,
    organizationKey: CachedOrganizationKey | undefined,
    verifiedDomains: Domain[]
) => {
    const organizationKeyInfo = getOrganizationKeyInfo(organization, organizationKey);
    const { MaxMembers, HasKeys, UsedMembers, MaxAddresses, UsedAddresses, MaxSpace, AssignedSpace } = organization;
    if (MaxMembers === 1) {
        return c('Error').t`Please upgrade to a business plan with more than 1 user to manage multiple users.`;
    }
    if (!HasKeys) {
        return c('Error').t`Please enable multi-user support before adding users to your organization.`;
    }
    if (!verifiedDomains.length) {
        return c('Error').t`Please configure a custom domain before adding users to your organization.`;
    }
    if (MaxMembers - UsedMembers < 1) {
        return c('Error').t`You have used all users in your plan. Please upgrade your plan to add a new user.`;
    }
    if (MaxAddresses - UsedAddresses < 1) {
        return c('Error').t`You have used all addresses in your plan. Please upgrade your plan to add a new address.`;
    }
    if (MaxSpace - AssignedSpace < 1) {
        return c('Error').t`All storage space has been allocated. Please reduce storage allocated to other users.`;
    }
    if (organizationKeyInfo.userNeedsToActivateKey) {
        return c('Error').t`The organization key must be activated first.`;
    }
    if (organizationKeyInfo.userNeedsToReactivateKey) {
        return c('Error').t`Permission denied, administrator privileges have been restricted.`;
    }
    if (!organizationKey?.privateKey) {
        return c('Error').t`Organization key is not decrypted.`;
    }
};

export default validateAddUser;
