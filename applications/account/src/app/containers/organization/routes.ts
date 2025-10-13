import { c } from 'ttag';

import type { SectionConfig } from '@proton/components';
import { canUseGroups } from '@proton/components';
import { isScribeSupported } from '@proton/components/helpers/assistant';
import {
    PLANS,
    type Subscription,
    getHasExternalMemberCapableB2BPlan,
    getHasMemberCapablePlan,
    getHasVpnB2BPlan,
    hasBundlePro,
    hasBundlePro2024,
    hasSomeAddonOrPlan,
    hasVpnBusiness,
    planSupportsSSO,
    upsellPlanSSO,
} from '@proton/payments';
import { appSupportsSSO } from '@proton/shared/lib/apps/apps';
import { type APP_NAMES, PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import { APPS, BRAND_NAME, ORGANIZATION_STATE, ORGANIZATION_TWOFA_SETTING } from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { canScheduleOrganizationPhoneCalls } from '@proton/shared/lib/helpers/support';
import type { Group, OrganizationExtended, UserModel } from '@proton/shared/lib/interfaces';
import { getOrganizationDenomination, isOrganizationPassFamily } from '@proton/shared/lib/organization/helper';

interface Props {
    app: APP_NAMES;
    user: UserModel;
    organization?: OrganizationExtended;
    subscription?: Subscription;
    canDisplayB2BLogsVPN: boolean;
    isUserGroupsFeatureEnabled: boolean;
    isUserGroupsNoCustomDomainEnabled: boolean;
    isB2BAuthLogsEnabled: boolean;
    groups: Group[] | undefined;
    isScribeEnabled?: boolean;
    isZoomIntegrationEnabled: boolean;
    isProtonMeetIntegrationEnabled: boolean;
    isSharedServerFeatureEnabled: boolean;
    isPasswordPolicyEnabled: boolean;
    isSsoForPbsEnabled: boolean;
    isRetentionPoliciesEnabled: boolean;
}

const videoConferenceValidApplications = new Set<string>([APPS.PROTONMAIL, APPS.PROTONCALENDAR]);
const scribeValidApplications = new Set<string>([APPS.PROTONMAIL]);

export const getOrganizationAppRoutes = ({
    app,
    user,
    organization,
    subscription,
    canDisplayB2BLogsVPN,
    isUserGroupsFeatureEnabled,
    isUserGroupsNoCustomDomainEnabled,
    isB2BAuthLogsEnabled,
    groups,
    isScribeEnabled,
    isZoomIntegrationEnabled,
    isProtonMeetIntegrationEnabled,
    isSharedServerFeatureEnabled,
    isPasswordPolicyEnabled,
    isSsoForPbsEnabled,
    isRetentionPoliciesEnabled,
}: Props) => {
    const isAdmin = user.isAdmin && user.isSelf;

    const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);
    const hasOrganization = hasOrganizationSetup(organization);
    const isOrgActive = organization?.State === ORGANIZATION_STATE.ACTIVE;
    const isOrgConfigured = hasOrganizationKey || hasOrganization;
    const hasActiveOrganizationKey = isOrgActive && hasOrganizationKey;
    const hasActiveOrganization = isOrgActive && hasOrganization;
    const hasMemberCapablePlan = getHasMemberCapablePlan(organization, subscription);
    const hasSubUsers = (organization?.UsedMembers || 0) > 1;

    const canHaveOrganization = !user.isMember && !!organization && isAdmin;
    const canSchedulePhoneCalls = canScheduleOrganizationPhoneCalls({ organization, user });

    const hasVpnB2BPlan = getHasVpnB2BPlan(subscription);

    const hasExternalMemberCapableB2BPlan = getHasExternalMemberCapableB2BPlan(subscription);

    const canShowB2BActivityMonitorEvents = isOrgConfigured && isAdmin;

    //vpnbiz2023, bundlepro2022, bundlepro2024 have the Connection Events feature
    const hasPlanWithEventLogging =
        hasVpnBusiness(subscription) || hasBundlePro(subscription) || hasBundlePro2024(subscription);
    const canShowB2BConnectionEvents =
        canDisplayB2BLogsVPN &&
        hasPlanWithEventLogging &&
        app === APPS.PROTONVPN_SETTINGS &&
        canHaveOrganization &&
        isOrgConfigured;

    //Change the title of the section when managing a family and avoid weird UI jump when no subscription is present
    const isPartOfFamily = getOrganizationDenomination(organization) === 'familyGroup';
    const isPassFamilyPlan = isOrganizationPassFamily(organization);

    const hasGroups = (groups?.length ?? 0) > 0;
    const canShowGroupsSection =
        isUserGroupsFeatureEnabled &&
        !!organization &&
        (hasActiveOrganizationKey || hasGroups) &&
        canUseGroups(organization?.PlanName, { isUserGroupsNoCustomDomainEnabled, hasGroups });

    const canShowUsersAndAddressesSection =
        // The user must have a plan that supports multi-user
        hasMemberCapablePlan &&
        // If the organization is not active (end of subscription without renewal), we allow users to access this page to delete sub users
        (isOrgActive || (!isOrgActive && (organization?.UsedMembers ?? 0) > 1)) &&
        // The org must be setup to allow users to access this page
        isOrgConfigured;

    const canShowDomainNamesSection =
        // user.hasPaidMail is needed, because for example VPN B2B doesn't need domains by design
        // NOTE: This configuration is tied with the mail/routes.tsx domains availability
        (hasOrganizationKey && user.hasPaidMail) ||
        // If the organization is not active (end of subscription without renewal), we allow users to access this page to delete domains
        (!isOrgActive && (organization?.UsedDomains ?? 0) > 0);

    const canShowScribeSection = Boolean(
        isScribeEnabled &&
            // Some b2b accounts do not support scribe
            isScribeSupported(organization, user) &&
            // The user must have a plan that supports multi-user
            hasMemberCapablePlan &&
            scribeValidApplications.has(app)
    );

    // add test to only show if org is elligible for zoom
    const canShowVideoConferenceSection =
        (isZoomIntegrationEnabled || isProtonMeetIntegrationEnabled) &&
        (hasActiveOrganizationKey || (isPartOfFamily && hasOrganization)) &&
        user.hasPaidMail &&
        videoConferenceValidApplications.has(app);

    const canShowAccessControl = hasSubUsers || isOrgConfigured;

    const canShowRetentionPolicies =
        isRetentionPoliciesEnabled &&
        // retention policies management is a B2B feature, only show if org is elligible for it
        isOrgActive &&
        isOrgConfigured &&
        hasSomeAddonOrPlan(subscription, [PLANS.MAIL_BUSINESS, PLANS.BUNDLE_PRO, PLANS.BUNDLE_PRO_2024]);

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
                available: canShowDomainNamesSection,
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
            sharedServers: <SectionConfig>{
                text: c('Title').t`Shared servers`,
                to: '/shared-servers',
                icon: 'earth',
                available:
                    isSharedServerFeatureEnabled &&
                    (hasVpnB2BPlan || hasBundlePro2024(subscription) || hasBundlePro(subscription)),
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
            activityMonitor: <SectionConfig>{
                text: c('Title').t`Activity monitor`,
                to: '/activity-monitor',
                icon: 'card-identity',
                available: canShowB2BActivityMonitorEvents,
                subsections: [
                    {
                        id: 'activity-monitor-dashboard',
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
            retentionPolicies: <SectionConfig>{
                text: c('Title').t`Data retention`,
                to: '/retention-policies',
                icon: 'archive-box',
                available: canShowRetentionPolicies,
                subsections: [{ id: 'retention-policies' }],
            },
            security: <SectionConfig>{
                text: c('Title').t`Security`,
                to: '/authentication-security',
                icon: 'shield',
                available:
                    (hasActiveOrganizationKey || hasActiveOrganization) &&
                    organization &&
                    (organization.MaxMembers > 1 ||
                        organization.TwoFactorRequired !== ORGANIZATION_TWOFA_SETTING.NOT_REQUIRED),
                subsections: [
                    {
                        text: PROTON_SENTINEL_NAME,
                        id: 'sentinel',
                        available: canShowB2BActivityMonitorEvents,
                    },
                    {
                        text: c('Title').t`${BRAND_NAME} Account password rules`,
                        id: 'proton-account-password-rules',
                        available: isPasswordPolicyEnabled,
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
                    appSupportsSSO(app) &&
                    (planSupportsSSO(organization?.PlanName, isSsoForPbsEnabled) ||
                        upsellPlanSSO(organization?.PlanName)) &&
                    canHaveOrganization &&
                    isOrgConfigured,
            },
            accessControl: <SectionConfig>{
                text: c('Title').t`Access control`,
                to: '/access-control',
                icon: 'sliders',
                available: canShowAccessControl,
                subsections: [
                    {
                        id: 'application-access',
                        text: c('Title').t`Application access`,
                    },
                    {
                        id: 'feature-access',
                        text: c('Title').t`Feature access`,
                        available: canShowVideoConferenceSection || canShowScribeSection,
                    },
                ],
            },
        },
    };
};
