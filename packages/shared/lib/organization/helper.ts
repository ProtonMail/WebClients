import { c } from 'ttag';

import { PLANS } from '@proton/payments';
import { getIsPasswordless } from '@proton/shared/lib/keys';

import { MEMBER_ROLE, MEMBER_SUBSCRIBER } from '../constants';
import type { Address, CachedOrganizationKey, Domain, Member, Organization } from '../interfaces';
import { DOMAIN_STATE, MEMBER_ORG_KEY_STATE } from '../interfaces';

export const isSuperAdmin = (members: Member[]) =>
    (members || []).some(({ Subscriber, Self }) => Self === 1 && Subscriber === MEMBER_SUBSCRIBER.PAYER);

export const getHasOtherAdmins = (members: Member[]) =>
    members.some(({ Role, Self }) => Self !== 1 && Role === MEMBER_ROLE.ORGANIZATION_ADMIN);

export const getNonPrivateMembers = (members: Member[]) => members.filter(({ Private }) => Private === 0);
export const getMemberHasAccessToOrgKey = (member: Member) =>
    member.AccessToOrgKey === MEMBER_ORG_KEY_STATE.Active || member.AccessToOrgKey === MEMBER_ORG_KEY_STATE.Pending;

export const getMemberHasMissingOrgKey = (member: Member) => member.AccessToOrgKey === MEMBER_ORG_KEY_STATE.Missing;

export const isOrganizationDuo = (organization?: Organization) => organization?.PlanName === PLANS.DUO;
export const isOrganizationFamily = (organization?: Organization) => organization?.PlanName === PLANS.FAMILY;
export const isOrganizationPassFamily = (organization?: Organization) => organization?.PlanName === PLANS.PASS_FAMILY;
export const isOrganizationVisionary = (organization?: Organization) => organization?.PlanName === PLANS.VISIONARY;

export const getOrganizationDenomination = (organization?: Organization) => {
    if (
        isOrganizationDuo(organization) ||
        isOrganizationFamily(organization) ||
        isOrganizationPassFamily(organization)
    ) {
        return 'familyGroup';
    }
    return 'organization';
};

export const isOrganizationB2B = (organization?: Organization) => {
    return [
        PLANS.MAIL_PRO,
        PLANS.MAIL_BUSINESS,
        PLANS.DRIVE_PRO,
        PLANS.DRIVE_BUSINESS,
        PLANS.PASS_PRO,
        PLANS.PASS_BUSINESS,
        PLANS.VPN_PRO,
        PLANS.VPN_BUSINESS,
        PLANS.BUNDLE_PRO,
        PLANS.BUNDLE_PRO_2024,
        PLANS.ENTERPRISE,
    ].includes(organization?.PlanName as PLANS);
};

export const getIsSMPTEligible = (organization?: Organization) => {
    return [
        PLANS.MAIL_PRO,
        PLANS.MAIL_BUSINESS,
        PLANS.DRIVE_PRO,
        PLANS.BUNDLE_PRO,
        PLANS.BUNDLE_PRO_2024,
        PLANS.ENTERPRISE,
        PLANS.FAMILY,
        PLANS.PASS_FAMILY,
        PLANS.DUO,
        PLANS.VISIONARY,
    ].includes(organization?.PlanName as PLANS);
};

/** True if user is part of an organization (works also for org admins) */
export const isOrganization = (organization?: Organization) =>
    isOrganizationFamily(organization) ||
    isOrganizationPassFamily(organization) ||
    isOrganizationDuo(organization) ||
    isOrganizationB2B(organization) ||
    isOrganizationVisionary(organization);

export enum OrganizationKeyState {
    NoKey,
    Setup,
    Activate,
    Inactive,
    Active,
}

export enum OrganizationKeyMode {
    Legacy,
    Passwordless,
}

export const getOrganizationKeyInfo = (
    organization: Organization | undefined,
    organizationKey: CachedOrganizationKey | undefined,
    addresses: Address[] | undefined
) => {
    const organizationHasKeys = !!organization?.HasKeys && !organizationKey?.placeholder;
    // If the user has the organization key (not the organization itself).
    const userHasActivatedOrganizationKeys = !!organizationKey?.Key?.PrivateKey;
    // If the user has the organization key, but it's not decrypted. Typically following a password reset
    const userHasInactiveKey = userHasActivatedOrganizationKeys && !organizationKey?.privateKey;
    const userHasActiveKey = organizationHasKeys && !!organizationKey?.privateKey;
    const userHasNoKey = organizationKey?.Key.AccessToOrgKey === MEMBER_ORG_KEY_STATE.NoKey;
    const userHasMissingKey = organizationKey?.Key.AccessToOrgKey === MEMBER_ORG_KEY_STATE.Missing;

    if (getIsPasswordless(organizationKey?.Key)) {
        const hasActivation = organizationHasKeys && !!organizationKey?.Key.SignatureAddress;
        const hasActivationAddress = organizationKey?.Key.EncryptionAddressID
            ? addresses?.find((address) => address.ID === organizationKey.Key.EncryptionAddressID)
            : undefined;

        return {
            mode: OrganizationKeyMode.Passwordless,
            state: (() => {
                if (userHasNoKey) {
                    return OrganizationKeyState.NoKey;
                }
                if (!organizationHasKeys) {
                    return OrganizationKeyState.Setup;
                }
                if (hasActivationAddress && hasActivation) {
                    return OrganizationKeyState.Activate;
                }
                if (userHasInactiveKey || userHasMissingKey) {
                    return OrganizationKeyState.Inactive;
                }
                if (userHasActiveKey) {
                    return OrganizationKeyState.Active;
                }
                return OrganizationKeyState.Setup;
            })(),
        };
    }

    return {
        mode: OrganizationKeyMode.Legacy,
        state: (() => {
            if (userHasNoKey) {
                return OrganizationKeyState.NoKey;
            }
            if (!organizationHasKeys) {
                return OrganizationKeyState.Setup;
            }
            // If the user does not have the organization key but the organization has keys setup, it's inactive
            if (!userHasActivatedOrganizationKeys) {
                return OrganizationKeyState.Activate;
            }
            if (userHasInactiveKey) {
                return OrganizationKeyState.Inactive;
            }
            if (userHasActiveKey) {
                return OrganizationKeyState.Active;
            }
            return OrganizationKeyState.Setup;
        })(),
    };
};

export type OrganizationKeyInfo = ReturnType<typeof getOrganizationKeyInfo>;

export const validateOrganizationKey = (info: OrganizationKeyInfo) => {
    if (info.state === OrganizationKeyState.NoKey) {
        return c('passwordless').t`You need access to the organization key to perform this operation.`;
    }
    if (info.state === OrganizationKeyState.Activate) {
        return c('passwordless').t`The organization key must be activated first.`;
    }
    if (info.state === OrganizationKeyState.Inactive) {
        return c('passwordless').t`Permission denied, administrator privileges have been restricted.`;
    }
    if (info.state === OrganizationKeyState.Setup) {
        return c('passwordless').t`Organization key does not exist.`;
    }
};

// Active domains is one that's verified or in warning state, but it can be used to create addresses to
export const getIsDomainActive = (domain: Domain) => {
    return (
        (domain.State === DOMAIN_STATE.DOMAIN_STATE_VERIFIED || domain.State === DOMAIN_STATE.DOMAIN_STATE_WARN) &&
        domain.Flags['mail-intent']
    );
};
