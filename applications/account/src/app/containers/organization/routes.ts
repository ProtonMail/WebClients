import { c } from 'ttag';

import type { SectionConfig } from '@proton/components/containers/layout';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, ORGANIZATION_STATE, ORGANIZATION_TWOFA_SETTING } from '@proton/shared/lib/constants';
import { PLANS } from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import {
    getHasExternalMemberCapableB2BPlan,
    getHasMemberCapablePlan,
    getHasVpnB2BPlan,
    hasVpnBusiness,
} from '@proton/shared/lib/helpers/subscription';
import { canScheduleOrganizationPhoneCalls } from '@proton/shared/lib/helpers/support';
import type { Organization, Subscription, UserModel } from '@proton/shared/lib/interfaces';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';

interface Props {
    app: APP_NAMES;
    user: UserModel;
    organization?: Organization;
    subscription?: Subscription;
    canDisplayB2BLogsVPN: boolean;
    isUserGroupsFeatureEnabled: boolean;
}

export const getOrganizationAppRoutes = ({
    app,
    user,
    organization,
    subscription,
    canDisplayB2BLogsVPN,
    isUserGroupsFeatureEnabled,
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

    const hasExternalMemberCapableB2BPlan = getHasExternalMemberCapableB2BPlan(subscription);
    const hasVpnB2BPlanWithEventLogging = hasVpnBusiness(subscription); //only vpnbiz2023 has Connection Events feature
    const canShowB2BConnectionEvents =
        canDisplayB2BLogsVPN &&
        hasVpnB2BPlanWithEventLogging &&
        app === APPS.PROTONVPN_SETTINGS &&
        canHaveOrganization &&
        (hasOrganizationKey || hasOrganization);
    //Change the title of the section when managing a family and avoid weird UI jump when no subscription is present
    const isPartOfFamily = getOrganizationDenomination(organization) === 'familyGroup';

    const canShowGroupsSection =
        isUserGroupsFeatureEnabled &&
        !!organization &&
        hasActiveOrganizationKey &&
        [
            PLANS.MAIL_PRO,
            PLANS.MAIL_BUSINESS,
            PLANS.BUNDLE_PRO,
            PLANS.BUNDLE_PRO_2024,
            PLANS.VISIONARY,
            PLANS.ENTERPRISE,
        ].includes(organization?.PlanName);

    const sectionTitle = isPartOfFamily
        ? c('familyOffer_2023:Settings section title').t`Family`
        : c('Settings section title').t`Organization`;

    const subMenuTitle = isPartOfFamily
        ? c('familyOffer_2023:Title').t`Manage family group`
        : c('Title').t`Multi-user support`;

    const subSectionTitle = isPartOfFamily ? '' : c('Title').t`Multi-user support`;

    const subSectionTitleAppearance = isPartOfFamily ? '' : c('Title').t`Customization`;

    return {
        available: canHaveOrganization && app !== APPS.PROTONWALLET,
        header: sectionTitle,
        routes: {
            users: <SectionConfig>{
                text: hasExternalMemberCapableB2BPlan ? c('Title').t`Users` : c('Title').t`Users and addresses`,
                to: '/users-addresses',
                icon: 'users',
                available: hasMemberCapablePlan && (hasOrganizationKey || hasOrganization),
                subsections: [
                    {
                        id: 'schedule-call',
                        available: app === APPS.PROTONVPN_SETTINGS && canSchedulePhoneCalls,
                    },
                    {
                        id: 'members',
                    },
                    {
                        text: c('Title').t`Create multiple user accounts`,
                        id: 'multi-user-creation',
                        available: organization && !!organization.RequiresKey && !hasExternalMemberCapableB2BPlan,
                    },
                ],
            },
            groups: <SectionConfig>{
                text: c('Title').t`Groups`,
                to: '/user-groups',
                icon: 'pass-group',
                available: canShowGroupsSection,
                subsections: [
                    {
                        id: 'groups-management',
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
                available:
                    app !== APPS.PROTONVPN_SETTINGS &&
                    !hasExternalMemberCapableB2BPlan &&
                    (hasActiveOrganizationKey || hasActiveOrganization),
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
                    (hasActiveOrganizationKey || hasActiveOrganization) &&
                    organization &&
                    (organization.MaxMembers > 1 ||
                        organization.TwoFactorRequired !== ORGANIZATION_TWOFA_SETTING.NOT_REQUIRED),
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
            connectionEvents: <SectionConfig>{
                text: c('Title').t`Connection events`,
                to: '/connection-events',
                icon: 'globe',
                available: canShowB2BConnectionEvents,
                subsections: [
                    {
                        id: 'vpn-connection-events',
                    },
                ],
            },
        },
    };
};
