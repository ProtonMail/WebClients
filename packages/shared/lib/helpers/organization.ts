import { ORGANIZATION_FLAGS, ORGANIZATION_TWOFA_SETTING } from '../constants';
import type { Organization } from '../interfaces';
import { hasBit } from './bitset';

export const isLoyal = (organization: Partial<Organization> = {}) => {
    return hasBit(organization.Flags, ORGANIZATION_FLAGS.LOYAL);
};

export const hasCovid = (organization: Partial<Organization> = {}) => {
    return hasBit(organization.Flags, ORGANIZATION_FLAGS.COVID);
};

export const hasSMTPSubmission = (organization: Partial<Organization> = {}) => {
    return hasBit(organization.Flags, ORGANIZATION_FLAGS.SMTP_SUBMISSION);
};

export const isDissident = (organization: Partial<Organization> = {}) => {
    return hasBit(organization.Flags, ORGANIZATION_FLAGS.DISSIDENT);
};

export const hasNoCycleScheduled = (organization: Partial<Organization> = {}) => {
    return hasBit(organization.Flags, ORGANIZATION_FLAGS.NO_CYCLE_SCHEDULED);
};

export const isProtoneer = (organization: Partial<Organization> = {}) => {
    return hasBit(organization.Flags, ORGANIZATION_FLAGS.PROTON);
};

export const hasPhoneSupport = (organization: Partial<Organization> = {}) => {
    return hasBit(organization.Flags, ORGANIZATION_FLAGS.PHONE_SUPPORT);
};

export const hasToMigrateOrgKey = (organization: Partial<Organization> = {}) => {
    return hasBit(organization.Flags, ORGANIZATION_FLAGS.TO_MIGRATE_ORG_KEY);
};

export const hasDeletionWhitelisted = (organization: Partial<Organization> = {}) => {
    return hasBit(organization.Flags, ORGANIZATION_FLAGS.DELETION_WHITELISTED);
};

export const hasBonuses = (organization: Partial<Organization> = {}) => {
    return !!organization.Flags || !!organization.LoyaltyCounter;
};

export const hasTwoFARequiredForAdminOnly = (organization: Partial<Organization> = {}) => {
    return organization.TwoFactorRequired === ORGANIZATION_TWOFA_SETTING.REQUIRED_ADMIN_ONLY;
};

export const hasTwoFARequiredForAll = (organization: Partial<Organization> = {}) => {
    return organization.TwoFactorRequired === ORGANIZATION_TWOFA_SETTING.REQUIRED_ALL;
};

export const hasFlag = (organization: Partial<Organization> = {}, mask: number) => {
    return hasBit(Number(organization.Flags), Number(mask));
};

export const hasPermission = (organization: Partial<Organization> = {}, mask: number) => {
    return hasBit(Number(organization.Permissions), Number(mask));
};

export const hasOrganizationSetup = (organization: Partial<Organization> = {}) => {
    return !organization.RequiresKey && !!organization.Name;
};

export const hasOrganizationSetupWithKeys = (organization: Partial<Organization> = {}) => {
    return !!organization.RequiresKey && !!organization.HasKeys;
};
