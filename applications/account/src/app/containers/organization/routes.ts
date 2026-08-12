import { c } from 'ttag';

import type { SectionConfig, SidebarConfig } from '@proton/components';
import { canUseGroups } from '@proton/components';
import { isScribeSupported } from '@proton/components/helpers/assistant';
import { PLANS } from '@proton/payments/core/constants';
import { getIsB2BAudienceFromPlan, planSupportsSSO, upsellPlanSSO } from '@proton/payments/core/plan/helpers';
import {
    getHasExternalMemberCapableB2BPlan,
    getHasMemberCapablePlan,
    getHasVpnB2BPlan,
    getPlanName,
    hasAnyB2bBundle,
    hasMeet,
    hasMeetBusiness,
    hasVPNPassProfessional,
    hasVpnBusiness,
} from '@proton/payments/core/subscription/helpers';
import { appSupportsSSO } from '@proton/shared/lib/apps/apps';
import {
    APPS,
    BRAND_NAME,
    ORGANIZATION_STATE,
    ORGANIZATION_TWOFA_SETTING,
    PROTON_SENTINEL_NAME,
} from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { canScheduleOrganizationPhoneCalls } from '@proton/shared/lib/helpers/support';
import {
    getOrganizationDenomination,
    isOrganizationOneOf,
    isOrganizationPassFamily,
} from '@proton/shared/lib/organization/helper';

import type { OrganizationRouterParams } from '../../content/router-params';

const videoConferenceValidApplications = new Set<string>([APPS.PROTONMAIL, APPS.PROTONCALENDAR]);
const scribeValidApplications = new Set<string>([APPS.PROTONMAIL]);

export const getOrganizationAppRoutes = ({
    app,
    user,
    organization,
    subscription,
    groups,
    isGroupOwner,
    flags,
    permissions,
}: OrganizationRouterParams): SidebarConfig => {
    const {
        isUserGroupsFeatureEnabled = false,
        isUserGroupsNoCustomDomainEnabled = false,
        isUserGroupsPassBusinessEnabled = false,
        isScribeEnabled = false,
        isZoomIntegrationEnabled = false,
        isProtonMeetIntegrationEnabled = false,
        isSharedServerFeatureEnabled = false,
        isAlwaysOnVpnEnabled = false,
        isSsoForPbsEnabled = false,
        isRetentionPoliciesEnabled = false,
    } = flags;
    const isAdmin = user.isAdmin && user.isSelf;

    const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);
    const hasOrganization = hasOrganizationSetup(organization);
    const isOrgActive = organization?.State === ORGANIZATION_STATE.ACTIVE;
    const isOrgDelinquent = organization?.State === ORGANIZATION_STATE.DELINQUENT;
    const isOrgConfigured = hasOrganizationKey || hasOrganization;
    const hasActiveOrganizationKey = isOrgActive && hasOrganizationKey;
    const hasActiveOrganization = isOrgActive && hasOrganization;
    const hasMemberCapablePlan = getHasMemberCapablePlan(organization, subscription);
    const hasSubUsers = (organization?.UsedMembers || 0) > 1;

    const canHaveOrganization = !user.isMember && !!organization && isAdmin;
    const canManageOrganization = canHaveOrganization && permissions['account.organization_identity.read'];
    const canSchedulePhoneCalls = canScheduleOrganizationPhoneCalls({ organization, user });

    const hasVpnB2BPlan = getHasVpnB2BPlan(subscription);

    const hasExternalMemberCapableB2BPlan = getHasExternalMemberCapableB2BPlan(subscription);

    const canShowB2BActivityMonitorEvents =
        (isOrgConfigured || getIsB2BAudienceFromPlan(organization?.PlanName)) &&
        !!permissions['account.activity_log.read'];

    //vpnbiz2023, and all business bundle plans have the Connection Events feature
    const hasPlanWithEventLogging =
        hasVpnBusiness(subscription) || hasAnyB2bBundle(subscription) || hasVPNPassProfessional(subscription);
    const canShowB2BConnectionEvents =
        hasPlanWithEventLogging && app === APPS.PROTONVPN_SETTINGS && canHaveOrganization && isOrgConfigured;

    //Change the title of the section when managing a family and avoid weird UI jump when no subscription is present
    const isPartOfFamily = getOrganizationDenomination(organization) === 'familyGroup';
    const isPassFamilyPlan = isOrganizationPassFamily(organization);

    const isPassEssentials = getPlanName(subscription) === PLANS.PASS_PRO;

    const hasGroups = (groups?.length ?? 0) > 0;
    const canShowGroupsSection =
        isUserGroupsFeatureEnabled &&
        (permissions['account.group.read'] || !!isGroupOwner) &&
        !!organization &&
        (hasGroups ||
            isPassEssentials ||
            (hasActiveOrganizationKey &&
                canUseGroups(organization?.PlanName, {
                    isUserGroupsNoCustomDomainEnabled,
                    isUserGroupsPassBusinessEnabled,
                    hasGroups,
                })));

    const hasUsedMembers = (organization?.UsedMembers ?? 0) > 1;
    const canShowUsersAndAddressesSection =
        permissions['account.user.read'] &&
        // The org must be setup to allow users to access this page
        isOrgConfigured &&
        // If the organization is not active (end of subscription without renewal), we allow users to access this page to delete sub users
        ((isOrgDelinquent && hasUsedMembers) ||
            // The user must have an active (non-delinquent) plan that supports multi-user
            (isOrgActive && hasMemberCapablePlan));

    const hasMeetPlan = hasMeetBusiness(subscription) || hasMeet(subscription);

    const hasUsedDomains = (organization?.UsedDomains ?? 0) > 0;
    const canShowDomainNamesSection =
        permissions['account.domain.read'] &&
        // user.hasPaidMail is needed, because for example VPN B2B doesn't need domains by design
        // NOTE: This configuration is tied with the mail/routes.tsx domains availability
        ((hasOrganizationKey && user.hasPaidMail) ||
            // Don't use user.hasPaidMeet otherwise we will show domain names section to every user with Meet addon
            (hasOrganizationKey && hasMeetPlan) ||
            // If the organization is not active (end of subscription without renewal), we allow users to access this page to delete domains
            (isOrgDelinquent && hasUsedDomains));

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

    const canShowAccessControl = permissions['account.access_control.read'] && (hasSubUsers || isOrgConfigured);

    const canShowRetentionPolicies =
        isRetentionPoliciesEnabled &&
        permissions['account.data_retention.read'] &&
        app !== APPS.PROTONVPN_SETTINGS &&
        // retention policies management is a B2B feature, only show if org is elligible for it
        isOrgActive &&
        isOrgConfigured &&
        isOrganizationOneOf(organization, [PLANS.BUNDLE_BIZ_2025, PLANS.VISIONARY, PLANS.BUNDLE_PRO_2024]);

    const canShowSecuritySection =
        permissions['account.security_policy.read'] &&
        (hasActiveOrganizationKey || hasActiveOrganization) &&
        organization &&
        (organization.MaxMembers > 1 || organization.TwoFactorRequired !== ORGANIZATION_TWOFA_SETTING.NOT_REQUIRED);

    const sectionTitle = isPartOfFamily
        ? c('familyOffer_2023:Settings section title').t`Family`
        : c('Settings section title').t`Organization`;

    const subMenuTitle = isPartOfFamily
        ? c('familyOffer_2023:Title').t`Manage family group`
        : c('Title').t`Multi-user support`;

    const subSectionTitle = isPartOfFamily ? '' : c('Title').t`Activate multi-user support`;

    const subSectionTitleAppearance = isPartOfFamily ? '' : c('Title').t`Customization`;

    const canShowSSOSection =
        permissions['account.sso_config.read'] &&
        appSupportsSSO(app) &&
        (planSupportsSSO(organization?.PlanName, isSsoForPbsEnabled) || upsellPlanSSO(organization?.PlanName)) &&
        isOrgConfigured;

    const routes = {
        users: {
            id: 'users',
            text: hasExternalMemberCapableB2BPlan ? c('Title').t`Users` : c('Title').t`Users and addresses`,
            to: '/users-addresses',
            icon: 'users',
            available: canShowUsersAndAddressesSection,
            subsections: [
                {
                    id: 'schedule-call',
                    available: app === APPS.PROTONVPN_SETTINGS && canSchedulePhoneCalls,
                    keywords: [
                        c('Headline').t`Contact us`,
                        c('Action').t`Request a call`,
                        c('Action').t`Start live chat`,
                    ],
                },
                {
                    id: 'members',
                    keywords: [c('Action').t`Add user`, c('Action').t`Invite user`, c('Action').t`Add address`],
                },
                {
                    text: c('Title').t`Create multiple user accounts`,
                    id: 'multi-user-creation',
                    available: organization && !!organization.RequiresKey && !hasExternalMemberCapableB2BPlan,
                    keywords: [
                        c('Select file').t`Upload CSV file`,
                        c('Action').t`Download CSV sample`,
                        c('account_search_index').t`Bulk user import`,
                    ],
                },
            ],
        },
        groups: {
            id: 'groups',
            text: c('Title').t`Groups`,
            to: '/user-groups',
            icon: 'pass-group',
            noTitle: true,
            available: canShowGroupsSection,
            upgradeRequired: isPassEssentials,
            subsections: [
                {
                    id: 'groups-management',
                    keywords: [
                        c('Action').t`New group`,
                        c('Placeholder').t`Group name`,
                        c('account_search_index').t`Group members`,
                    ],
                },
            ],
        },
        domains: {
            id: 'domains',
            text: c('Title').t`Domain names`,
            to: '/domain-names',
            icon: 'globe',
            available: canHaveOrganization && canShowDomainNamesSection,
            subsections: [
                {
                    id: 'domains',
                    keywords: [
                        c('Action').t`Add domain`,
                        c('account_search_index').t`Custom domain`,
                        c('account_search_index').t`Verify domain`,
                    ],
                },
                {
                    text: c('Title').t`Catch-all address`,
                    id: 'catch-all',
                    keywords: [c('account_search_index').t`Receive misaddressed emails`],
                },
            ],
        },
        orgKeys: {
            id: 'orgKeys',
            text: subMenuTitle,
            to: '/organization-keys',
            icon: 'buildings',
            available:
                canManageOrganization &&
                (isPartOfFamily
                    ? hasActiveOrganization //Show this section once the family is setup (only requires a name)
                    : (hasActiveOrganizationKey || hasActiveOrganization) &&
                      organization &&
                      !!organization.RequiresKey),
            subsections: [
                {
                    id: 'schedule-call',
                    available: canSchedulePhoneCalls,
                    keywords: [
                        c('Headline').t`Contact us`,
                        c('Action').t`Request a call`,
                        c('Action').t`Start live chat`,
                    ],
                },
                {
                    text: subSectionTitleAppearance,
                    id: 'organization',
                    keywords: [
                        isPartOfFamily ? c('familyOffer_2023:Label').t`Family name` : c('Label').t`Organization name`,
                        c('orgidentity').t`Organization identity`,
                        c('Label').t`Logo`,
                    ],
                },
                {
                    text: c('Title').t`Organization key`,
                    id: 'password-keys',
                    available: hasMemberCapablePlan && hasActiveOrganizationKey,
                    keywords: [
                        c('Header').t`Organization key fingerprint`,
                        c('passwordless').t`Change organization key`,
                        c('Action').t`Change password`,
                    ],
                },
            ],
        },
        gateways: {
            id: 'gateways',
            text: c('Title').t`Gateways`,
            to: '/gateways',
            icon: 'servers',
            available:
                canHaveOrganization &&
                permissions['account.gateway.read'] &&
                (hasVpnB2BPlan || hasAnyB2bBundle(subscription)),
            subsections: [
                {
                    id: 'servers',
                    keywords: [
                        c('Action').t`Create Gateway`,
                        c('Action').t`Get more servers`,
                        c('Info').t`dedicated servers`,
                    ],
                },
            ],
        },
        sharedServers: {
            id: 'sharedServers',
            text: c('Title').t`Shared servers`,
            to: '/shared-servers',
            icon: 'earth',
            available:
                canHaveOrganization &&
                isSharedServerFeatureEnabled &&
                permissions['account.shared_server.read'] &&
                (hasVpnB2BPlan || hasAnyB2bBundle(subscription)),
            subsections: [
                {
                    id: 'servers',
                    keywords: [
                        c('Action').t`Publish changes`,
                        c('account_search_index').t`Shared server access`,
                        c('account_search_index').t`Server access policy`,
                    ],
                },
            ],
        },
        alwaysOnVpn: {
            id: 'alwaysOnVpn',
            text: c('Title').t`Always-on VPN`,
            description: c('Subtitle')
                .t`Enforce VPN usage across your organization by blocking internet access unless a VPN connection is active.`,
            to: '/always-on-vpn',
            icon: 'vault',
            available:
                isAlwaysOnVpnEnabled &&
                canHaveOrganization &&
                permissions['account.always_on.read'] &&
                (hasVpnB2BPlan || hasAnyB2bBundle(subscription)),
        },
        connectionEvents: {
            id: 'connectionEvents',
            text: c('Title').t`Gateway monitor`,
            description: c('Subtitle').t`View VPN session details for your organization.`,
            to: '/gateway-monitor',
            icon: 'monitor',
            available: canShowB2BConnectionEvents,
            subsections: [
                {
                    id: 'vpn-connection-events',
                    keywords: [
                        c('account_search_index').t`VPN session details`,
                        c('account_search_index').t`Connection events`,
                        c('account_search_index').t`Gateway logs`,
                    ],
                },
            ],
        },
        activityMonitor: {
            id: 'activityMonitor',
            text: c('Title').t`Activity monitor`,
            to: '/activity-monitor',
            icon: 'card-identity',
            available: canShowB2BActivityMonitorEvents,
            upgradeRequired: isPassEssentials,
            subsections: [
                {
                    id: 'activity-monitor-dashboard',
                    keywords: [
                        c('account_search_index').t`Audit log`,
                        c('account_search_index').t`Account events`,
                        c('VPN Gateways').t`VPN Gateways`,
                    ],
                },
            ],
        },
        setup: {
            id: 'setup',
            text: subMenuTitle,
            to: '/multi-user-support',
            icon: 'users',
            available: !!(
                canManageOrganization && (isPartOfFamily ? !hasActiveOrganization : !hasActiveOrganizationKey)
            ),
            subsections: [
                {
                    id: 'schedule-call',
                    available: canSchedulePhoneCalls,
                    keywords: [
                        c('Headline').t`Contact us`,
                        c('Action').t`Request a call`,
                        c('Action').t`Start live chat`,
                    ],
                },
                {
                    text: subSectionTitle,
                    id: 'name',
                    keywords: isPartOfFamily
                        ? [
                              c('familyOffer_2023:Action').t`Set up family group`,
                              c('familyOffer_2023:Info').t`Create and manage family members.`,
                          ]
                        : [c('Action').t`Enable multi-user support`, c('account_search_index').t`Create organization`],
                },
            ],
        },
        filter: {
            id: 'filter',
            text: c('Title').t`Organization filters`,
            to: '/organization-filters',
            icon: 'filter',
            available:
                canHaveOrganization &&
                permissions['account.organization_filter.read'] &&
                app !== APPS.PROTONVPN_SETTINGS &&
                !hasExternalMemberCapableB2BPlan &&
                !isPassFamilyPlan &&
                (hasActiveOrganizationKey || hasActiveOrganization),
            subsections: [
                {
                    text: c('Title').t`Spam, block, and allow lists`,
                    id: 'spam',
                    keywords: [
                        c('Action').t`Add address or domain`,
                        c('account_search_index').t`Block sender for the organization`,
                        c('account_search_index').t`Allow list`,
                    ],
                },
            ],
        },
        retentionPolicies: {
            id: 'retentionPolicies',
            text: c('Title').t`Data retention`,
            to: '/retention-policies',
            icon: 'archive-box',
            available: canShowRetentionPolicies,
            subsections: [
                {
                    id: 'retention-policies',
                    keywords: [
                        c('retention_policy_2025_Action').t`Create retention rule`,
                        c('retention_policy_2025_TableHeader').t`Retention period`,
                        c('account_search_index').t`Automatically delete data`,
                    ],
                },
            ],
        },
        security: {
            id: 'security',
            text: c('Title').t`Security`,
            to: '/authentication-security',
            icon: 'shield',
            available: canShowSecuritySection,
            subsections: [
                {
                    text: c('Title').t`${PROTON_SENTINEL_NAME} for organizations`,
                    id: 'sentinel',
                    available: canShowB2BActivityMonitorEvents,
                    keywords: [
                        c('account_search_index').t`Advanced account protection`,
                        c('account_search_index').t`Protection from cyber attacks`,
                    ],
                },
                {
                    text: c('Title').t`${BRAND_NAME} Account password rules`,
                    id: 'proton-account-password-rules',
                    keywords: [
                        c('Label').t`Minimum number of characters`,
                        c('Label').t`Special characters`,
                        c('Label').t`Common passwords`,
                    ],
                },
                {
                    text: c('Title').t`Two-factor authentication reminders`,
                    id: 'two-factor-authentication-reminders',
                    keywords: [
                        c('Label').t`Members without 2FA`,
                        c('Label').t`Ask members to set up 2FA`,
                        c('Action').t`Send email reminder`,
                    ],
                },
                {
                    text: c('Title').t`Two-factor authentication enforcement`,
                    id: 'two-factor-authentication-enforcement',
                    keywords: [c('Label').t`Require 2FA for administrators`, c('Label').t`Require 2FA for everyone`],
                },
            ],
        },
        sso: {
            id: 'sso',
            text: c('Title').t`Single sign-on`,
            to: '/single-sign-on',
            icon: 'key',
            available: canShowSSOSection,
            upgradeRequired:
                !planSupportsSSO(organization?.PlanName, isSsoForPbsEnabled) && !!upsellPlanSSO(organization?.PlanName),
        },
        accessControl: {
            id: 'accessControl',
            text: c('Title').t`Access control`,
            to: '/access-control',
            icon: 'sliders',
            available: canHaveOrganization && canShowAccessControl,
            subsections: [
                {
                    id: 'application-access',
                    text: c('Title').t`Application access`,
                    keywords: [
                        c('account_search_index').t`Enable or disable apps for members`,
                        c('account_search_index').t`Restrict app access`,
                    ],
                },
                {
                    id: 'feature-access',
                    text: c('Title').t`Feature access`,
                    available: canShowVideoConferenceSection || canShowScribeSection,
                    keywords: [
                        c('Title').t`${BRAND_NAME} Scribe writing assistant`,
                        c('Title').t`Video conferencing with Zoom`,
                        c('Title').t`Email categories`,
                    ],
                },
            ],
        },
    } satisfies Record<string, SectionConfig>;

    // show the whole organization section if organization is present and at least one feature is available
    const showOrganizationSection = !!organization && Object.values(routes).some((route) => route.available);

    return {
        available: showOrganizationSection,
        header: sectionTitle,
        routes,
    };
};
