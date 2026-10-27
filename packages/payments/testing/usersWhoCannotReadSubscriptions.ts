import { USER_ROLES } from '@proton/shared/lib/constants';

export const organizationMember = {
    user: { Role: USER_ROLES.MEMBER_ROLE },
    organization: { IsSubsidiary: false },
} as const;

export const mspSubsidiaryMember = {
    user: { Role: USER_ROLES.MEMBER_ROLE },
    organization: { IsSubsidiary: true },
} as const;

export const mspSubsidiaryAdmin = {
    user: { Role: USER_ROLES.ADMIN_ROLE },
    organization: { IsSubsidiary: true },
} as const;

export const usersWhoCannotReadSubscriptions = [
    { case: 'a member', ...organizationMember },
    { case: 'a member of an MSP subsidiary', ...mspSubsidiaryMember },
    { case: 'an admin of an MSP subsidiary', ...mspSubsidiaryAdmin },
] as const;
