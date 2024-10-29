import { c } from 'ttag';

import type { SectionConfig } from '@proton/components';
import { canUseGroups } from '@proton/components';
import { isScribeSupported } from '@proton/components/helpers/assistant';
import { PLANS } from '@proton/payments/core/constants';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, BRAND_NAME, ORGANIZATION_STATE, ORGANIZATION_TWOFA_SETTING } from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import {
    appSupportsSSO,
    getHasExternalMemberCapableB2BPlan,
    getHasMemberCapablePlan,
    getHasVpnB2BPlan,
    hasBundlePro,
    hasBundlePro2024,
    hasVpnBusiness,
    planSupportsSSO,
    upsellPlanSSO,
} from '@proton/shared/lib/helpers/subscription';
import { canScheduleOrganizationPhoneCalls } from '@proton/shared/lib/helpers/support';
import type { Group, Organization, Subscription, UserModel } from '@proton/shared/lib/interfaces';
import { getOrganizationDenomination, isOrganizationPassFamily } from '@proton/shared/lib/organization/helper';

interface Props {
    app: APP_NAMES;
    user: UserModel;
    organization?: Organization;
    subscription?: Subscription;
    canDisplayB2BLogsVPN: boolean;
    isUserGroupsFeatureEnabled: boolean;
    isB2BAuthLogsEnabled: boolean;
    isGlobalSSOEnabled: boolean;
    groups: Group[] | undefined;
    isScribeEnabled?: boolean;
    isZoomIntegrationEnabled: boolean;
}

const videoConferenceValidApplications = new Set<string>([APPS.PROTONMAIL, APPS.PROTONCALENDAR]);

export const getOrganizationAppRoutes = ({
    app,
    user,
    organization,
    subscription,
    canDisplayB2BLogsVPN,
    isUserGroupsFeatureEnabled,
    isB2BAuthLogsEnabled,
    isGlobalSSOEnabled,
    groups,
    isScribeEnabled,
    isZoomIntegrationEnabled,
}: Props) => {
    const isAdmin = user.isAdmin && !user.isSubUser;

    const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);
    const hasOrganization = hasOrganizationSetup(organization);
    const isOrgActive = organization?.State === ORGANIZATION_STATE.ACTIVE;
    const hasActiveOrganizationKey = isOrgActive && hasOrganizationKey;
    const hasActiveOrganization = isOrgActive && hasOrganization;
    const hasMemberCapablePlan = getHasMemberCapablePlan(organization, subscription);
    const hasSubUsers = (organization?.UsedMembers || 0) > 1;

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
    const isPassFamilyPlan = isOrganizationPassFamily(organization);

    const canShowGroupsSection =
        isUserGroupsFeatureEnabled &&
        !!organization &&
        ((hasActiveOrganizationKey && canUseGroups(organization?.PlanName)) || (groups?.length ?? 0) > 0);

    const canShowUsersAndAddressesSection =
        // The user must have a plan that supports multi-user
        hasMemberCapablePlan &&
        // If the organization is not active (end of subscription without renewal), we allow users to access this page to delete sub users
        (isOrgActive || (!isOrgActive && (organization?.UsedMembers ?? 0) > 1)) &&
        // The org must be setup to allow users to access this page
        (hasOrganizationKey || hasOrganization);

    const canShowScribeSection =
        isScribeEnabled &&
        // Some b2b accounts do not support scribe
        isScribeSupported(organization, user) &&
        // The user must have a plan that supports multi-user
        hasMemberCapablePlan &&
        hasSubUsers;

    // add test to only show if org is elligible for zoom
    const canShowVideoConferenceSection =
        isZoomIntegrationEnabled &&
        (hasActiveOrganizationKey || (isPartOfFamily && hasOrganization)) &&
        user.hasPaidMail &&
        videoConferenceValidApplications.has(app);

    const sectionTitle = isPartOfFamily
        ? c('familyOffer_2023:Settings section title').t`Family`
        : c('Settings section title').t`Organization`;

    const subMenuTitle = isPartOfFamily
        ? c('familyOffer_2023:Title').t`Manage family group`
        : c('Title').t`Multi-user support`;

    const subSectionTitle = isPartOfFamily ? '' : c('Title').t`Multi-user support`;

    const subSectionTitleAppearance = isPartOfFamily ? '' : c('Title').t`Customization`;

    const isPassAndGlobalSSOEnabled =
        app === APPS.PROTONPASS ||
        organization?.PlanName === PLANS.PASS_PRO ||
        organization?.PlanName === PLANS.PASS_BUSINESS
            ? isGlobalSSOEnabled
            : true;

    return {
        available: canHaveOrganization && app !== APPS.PROTONWALLET,
        header: sectionTitle,
        routes: {
            videoConf: <SectionConfig>{
                text: c('Title').t`Video conference`,
                to: '/video-conference',
                icon: 'camera',
                available: canShowVideoConferenceSection,
                subsections: [
                    {
                        id: 'enable-zoom',
                    },
                ],
            },
            users: <SectionConfig>{
                text: hasExternalMemberCapableB2BPlan ? c('Title').t`Users` : c('Title').t`Users and addresses`,
                to: '/users-addresses',
                icon: 'users',
                available: canShowUsersAndAddressesSection,
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
                available: hasOrganizationKey && user.hasPaidMail,
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
                available: hasVpnB2BPlan || hasBundlePro2024(subscription) || hasBundlePro(subscription),
                subsections: [
                    {
                        id: 'servers',
                    },
                ],
            },
            connectionEvents: <SectionConfig>{
                text: c('Title').t`Gateway monitor`,
                description: c('Subtitle').t`View VPN session details for your organization.`,
                to: '/gateway-monitor',
                icon: 'monitor',
                available: canShowB2BConnectionEvents,
                subsections: [
                    {
                        id: 'vpn-connection-events',
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
                    !isPassFamilyPlan &&
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
                    {
                        text: c('Title').t`Security events`,
                        id: 'security-events',
                        available: isB2BAuthLogsEnabled && !isPartOfFamily,
                    },
                ],
            },
            sso: <SectionConfig>{
                text: c('Title').t`Single sign-on`,
                to: '/single-sign-on',
                icon: 'key',
                available:
                    isPassAndGlobalSSOEnabled &&
                    appSupportsSSO(app) &&
                    (planSupportsSSO(organization?.PlanName) || upsellPlanSSO(organization?.PlanName)) &&
                    canHaveOrganization &&
                    (hasOrganizationKey || hasOrganization),
            },
            scribe: <SectionConfig>{
                text: c('Title').t`${BRAND_NAME} Scribe`,
                title: c('Title').t`${BRAND_NAME} Scribe writing assistant`,
                to: '/organization-scribe',
                icon: 'pen-sparks',
                available: canShowScribeSection,
                subsections: [
                    {
                        id: 'scribe-management',
                    },
                ],
            },
        },
    };
};
