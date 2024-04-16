import { c } from 'ttag';

import { SectionConfig } from '@proton/components';
import { APPS, APP_NAMES, ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import {
    getHasMemberCapablePlan,
    getHasVpnB2BPlan,
    getHasVpnOrPassB2BPlan,
    hasFamily,
} from '@proton/shared/lib/helpers/subscription';
import { canScheduleOrganizationPhoneCalls } from '@proton/shared/lib/helpers/support';
import { Organization, Subscription, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    app: APP_NAMES;
    user: UserModel;
    organization?: Organization;
    subscription?: Subscription;
    isOrganizationLogoUploadAvailable: boolean;
}

export const getOrganizationAppRoutes = ({
    app,
    user,
    organization,
    subscription,
    isOrganizationLogoUploadAvailable,
}: Props) => {
    const isAdmin = user.isAdmin && !user.isSubUser;

    const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);
    const hasOrganization = hasOrganizationSetup(organization);
    const hasActiveOrganizationKey = organization?.State === ORGANIZATION_STATE.ACTIVE && hasOrganizationKey;
    const hasActiveOrganization = organization?.State === ORGANIZATION_STATE.ACTIVE && hasOrganization;
    const hasMemberCapablePlan = getHasMemberCapablePlan(organization, subscription);

    const canHaveOrganization = !user.isMember && !!organization && isAdmin;
    const canSchedulePhoneCalls = canScheduleOrganizationPhoneCalls({ organization, user });

    const hasVpnB2BPlan = getHasVpnB2BPlan(subscription);

    const hasVpnOrPassB2BPlan = getHasVpnOrPassB2BPlan(subscription);

    //Change the title of the section when managing a family and avoid weird UI jump when no subscription is present
    const isPartOfFamily = hasFamily(subscription);

    const sectionTitle = isPartOfFamily
        ? c('familyOffer_2023:Settings section title').t`Family`
        : c('Settings section title').t`Organization`;

    const subMenuTitle = isPartOfFamily
        ? c('familyOffer_2023:Title').t`Manage family group`
        : c('Title').t`Multi-user support`;

    const subSectionTitle = isPartOfFamily ? '' : c('Title').t`Multi-user support`;

    let subSectionTitleAppearance: string;

    if (isPartOfFamily) {
        subSectionTitleAppearance = '';
    } else if (isOrganizationLogoUploadAvailable) {
        subSectionTitleAppearance = c('Title').t`Custom branding`;
    } else {
        subSectionTitleAppearance = c('Title').t`Organization appearance`;
    }

    return {
        available: canHaveOrganization,
        header: sectionTitle,
        routes: {
            users: <SectionConfig>{
                text: hasVpnOrPassB2BPlan ? c('Title').t`Users` : c('Title').t`Users and addresses`,
                to: '/users-addresses',
                icon: 'users',
                available: hasMemberCapablePlan && (hasOrganizationKey || hasOrganization),
                subsections: [
                    {
                        id: 'members',
                    },
                    {
                        text: c('Title').t`Create multiple user accounts`,
                        id: 'multi-user-creation',
                        available: organization && !!organization.RequiresKey && !hasVpnOrPassB2BPlan,
                    },
                ],
            },
            domains: <SectionConfig>{
                text: c('Title').t`Domain names`,
                to: '/domain-names',
                icon: 'globe',
                // user.hasPaidMail is needed, because for example VPN B2B doesn't need domains by design
                available: hasActiveOrganizationKey && user.hasPaidMail,
                subsections: [
                    { id: 'domains' },
                    {
                        text: c('Title').t`Catch-all address`,
                        id: 'catch-all',
                    },
                ],
            },
            orgKeys: <SectionConfig>{
                text: subMenuTitle,
                to: '/organization-keys',
                icon: 'buildings',
                available: isPartOfFamily
                    ? hasActiveOrganization //Show this section once the family is setup (only requires a name)
                    : (hasActiveOrganizationKey || hasActiveOrganization) && organization && !!organization.RequiresKey,
                subsections: [
                    {
                        id: 'schedule-call',
                        available: canSchedulePhoneCalls,
                    },
                    {
                        text: subSectionTitleAppearance,
                        id: 'organization',
                    },
                    {
                        text: c('Title').t`Organization key`,
                        id: 'password-keys',
                        available: hasMemberCapablePlan && hasActiveOrganizationKey,
                    },
                ],
            },
            gateways: <SectionConfig>{
                text: c('Title').t`Gateways`,
                to: '/gateways',
                icon: 'servers',
                available: hasVpnB2BPlan,
                subsections: [
                    {
                        id: 'servers',
                    },
                ],
            },
            setup: <SectionConfig>{
                text: subMenuTitle,
                to: '/multi-user-support',
                icon: 'users',
                available: isPartOfFamily ? !hasActiveOrganization : !hasActiveOrganizationKey && canHaveOrganization,
                subsections: [
                    {
                        id: 'schedule-call',
                        available: canSchedulePhoneCalls,
                    },
                    {
                        text: subSectionTitle,
                        id: 'name',
                    },
                ],
            },
            filter: <SectionConfig>{
                text: c('Title').t`Organization filters`,
                to: '/organization-filters',
                icon: 'filter',
                available: !hasVpnOrPassB2BPlan && (hasActiveOrganizationKey || hasActiveOrganization),
                subsections: [
                    {
                        text: c('Title').t`Spam, block, and allow lists`,
                        id: 'spam',
                    },
                ],
            },
            security: <SectionConfig>{
                text: c('Title').t`Authentication security`,
                to: '/authentication-security',
                icon: 'shield',
                available:
                    (hasActiveOrganizationKey || hasActiveOrganization) && organization && organization.MaxMembers > 1,
                subsections: [
                    {
                        id: 'two-factor-authentication-users',
                    },
                    {
                        text: c('Title').t`Two-factor authentication reminders`,
                        id: 'two-factor-authentication-reminders',
                    },
                    {
                        text: c('Title').t`Two-factor authentication enforcement`,
                        id: 'two-factor-authentication-enforcement',
                    },
                ],
            },
            sso: <SectionConfig>{
                text: c('Title').t`Single sign-on`,
                to: '/single-sign-on',
                icon: 'key',
                available:
                    app === APPS.PROTONVPN_SETTINGS &&
                    hasVpnB2BPlan &&
                    canHaveOrganization &&
                    (hasOrganizationKey || hasOrganization),
            },
        },
    };
};
