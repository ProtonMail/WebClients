import { MEMBER_ROLE, MEMBER_SUBSCRIBER, PLANS } from '../constants';
import { CachedOrganizationKey, Member, Organization } from '../interfaces';

export const isSuperAdmin = (members: Member[]) =>
    (members || []).some(({ Subscriber, Self }) => Self === 1 && Subscriber === MEMBER_SUBSCRIBER.PAYER);

export const getHasOtherAdmins = (members: Member[]) =>
    members.some(({ Role, Self }) => Self !== 1 && Role === MEMBER_ROLE.ORGANIZATION_ADMIN);

export const getNonPrivateMembers = (members: Member[]) => members.filter(({ Private }) => Private === 0);

export const isOrganizationFamily = (organization: Organization) => organization.PlanName === PLANS.FAMILY;
export const isOrganizationVisionary = (organization: Organization) => organization.PlanName === PLANS.NEW_VISIONARY;

export const isOrganizationB2B = (organization: Organization) => {
    return [PLANS.MAIL_PRO, PLANS.DRIVE_PRO, PLANS.BUNDLE_PRO, PLANS.ENTERPRISE].includes(organization.PlanName);
};

export const getOrganizationKeyInfo = (
    organization: Organization | undefined,
    organizationKey?: CachedOrganizationKey
) => {
    const organizationHasKeys = !!organization?.HasKeys;
    // If the user has the organization key (not the organization itself).
    const userHasActivatedOrganizationKeys = !!organizationKey?.Key?.PrivateKey;
    return {
        // If the user does not have the organization key but the organization has keys setup, it's inactive
        userNeedsToActivateKey: organizationHasKeys && !userHasActivatedOrganizationKeys,
        // If the user has the organization key, but it's not decrypted. Typically following a password reset
        userNeedsToReactivateKey:
            organizationHasKeys && userHasActivatedOrganizationKeys && !organizationKey?.privateKey,
    };
};
