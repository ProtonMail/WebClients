import { c } from 'ttag';

import type { SectionConfig, SidebarConfig } from '@proton/components';
import { canUseGroups } from '@proton/components';
import { isScribeSupported } from '@proton/components/helpers/assistant';
import {
    type Subscription,
    getHasExternalMemberCapableB2BPlan,
    getHasMemberCapablePlan,
    getHasVpnB2BPlan,
    getIsB2BAudienceFromPlan,
    hasAnyB2bBundle,
    hasBundleBiz2025,
    hasBundlePro2024,
    hasVPNPassProfessional,
    hasVisionary,
    hasVpnBusiness,
    planSupportsSSO,
    upsellPlanSSO,
} from '@proton/payments';
import { appSupportsSSO } from '@proton/shared/lib/apps/apps';
import {
    APPS,
    type APP_NAMES,
    BRAND_NAME,
    ORGANIZATION_STATE,
    ORGANIZATION_TWOFA_SETTING,
    PROTON_SENTINEL_NAME,
} from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { canScheduleOrganizationPhoneCalls } from '@proton/shared/lib/helpers/support';
import type { Group, OrganizationExtended, UserModel } from '@proton/shared/lib/interfaces';
import {
    getOrganizationDenomination,
    isOrganizationB2B,
    isOrganizationPassFamily,
} from '@proton/shared/lib/organization/helper';

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
    isSsoForPbsEnabled: boolean;
    isRetentionPoliciesEnabled: boolean;
    isGroupOwner: boolean | null;
    isOLESEnabled?: boolean;
    isRolesAndPermissionsEnabled?: boolean;
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
    isSsoForPbsEnabled,
    isRetentionPoliciesEnabled,
    isGroupOwner,
    isOLESEnabled,
    isRolesAndPermissionsEnabled,
}: Props): SidebarConfig => {
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

    const canShowB2BActivityMonitorEvents =
        (isOrgConfigured || getIsB2BAudienceFromPlan(organization?.PlanName)) && isAdmin;

    //vpnbiz2023, and all business bundle plans have the Connection Events feature
    const hasPlanWithEventLogging =
        hasVpnBusiness(subscription) || hasAnyB2bBundle(subscription) || hasVPNPassProfessional(subscription);
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
        (hasBundleBiz2025(subscription) || hasVisionary(subscription) || hasBundlePro2024(subscription));

    const canShowRolesAndPermissionsSection =
        isRolesAndPermissionsEnabled &&
        canHaveOrganization &&
        isOrgActive &&
        isOrgConfigured &&
        (hasBundleBiz2025(subscription) || hasVisionary(subscription));

    const sectionTitle = isPartOfFamily
        ? c('familyOffer_2023:Settings section title').t`Family`
        : c('Settings section title').t`Organization`;

    const subMenuTitle = isPartOfFamily
        ? c('familyOffer_2023:Title').t`Manage family group`
        : c('Title').t`Multi-user support`;

    const subSectionTitle = isPartOfFamily ? '' : c('Title').t`Multi-user support`;

    const subSectionTitleAppearance = isPartOfFamily ? '' : c('Title').t`Customization`;

    const showBusinessMigrationSection =
        Boolean(isOLESEnabled) &&
        isAdmin &&
        isOrganizationB2B(organization) &&
        (hasActiveOrganizationKey || hasActiveOrganization);

    const organizationSectionVisible = canHaveOrganization || !!isGroupOwner;

    return {
        available: organizationSectionVisible && app !== APPS.PROTONWALLET,
        header: sectionTitle,
        routes: {
            migrationAssistant: {
                id: 'migration-assistant',
                text: c('Title').t`Migration assistant`,
                to: '/migration-assistant',
                icon: 'arrow-down-to-square',
                available: canHaveOrganization && showBusinessMigrationSection,
            },
            users: {
                id: 'users',
                text: hasExternalMemberCapableB2BPlan ? c('Title').t`Users` : c('Title').t`Users and addresses`,
                to: '/users-addresses',
                icon: 'users',
                available: canHaveOrganization && canShowUsersAndAddressesSection,
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
            groups: {
                id: 'groups',
                text: c('Title').t`Groups`,
                to: '/user-groups',
                icon: 'pass-group',
                available: organizationSectionVisible && canShowGroupsSection,
                subsections: [
                    {
                        id: 'groups-management',
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
                    { id: 'domains' },
                    {
                        text: c('Title').t`Catch-all address`,
                        id: 'catch-all',
                    },
                ],
            },
            orgKeys: {
                id: 'orgKeys',
                text: subMenuTitle,
                to: '/organization-keys',
                icon: 'buildings',
                available:
                    canHaveOrganization &&
                    (isPartOfFamily
                        ? hasActiveOrganization //Show this section once the family is setup (only requires a name)
                        : (hasActiveOrganizationKey || hasActiveOrganization) &&
                          organization &&
                          !!organization.RequiresKey),
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
            gateways: {
                id: 'gateways',
                text: c('Title').t`Gateways`,
                to: '/gateways',
                icon: 'servers',
                available: canHaveOrganization && (hasVpnB2BPlan || hasAnyB2bBundle(subscription)),
                subsections: [
                    {
                        id: 'servers',
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
                    (hasVpnB2BPlan || hasAnyB2bBundle(subscription)),
                subsections: [
                    {
                        id: 'servers',
                    },
                ],
            },
            connectionEvents: {
                id: 'connectionEvents',
                text: c('Title').t`Gateway monitor`,
                description: c('Subtitle').t`View VPN session details for your organization.`,
                to: '/gateway-monitor',
                icon: 'monitor',
                available: canHaveOrganization && canShowB2BConnectionEvents,
                subsections: [
                    {
                        id: 'vpn-connection-events',
                    },
                ],
            },
            activityMonitor: {
                id: 'activityMonitor',
                text: c('Title').t`Activity monitor`,
                to: '/activity-monitor',
                icon: 'card-identity',
                available: canHaveOrganization && canShowB2BActivityMonitorEvents,
                subsections: [
                    {
                        id: 'activity-monitor-dashboard',
                    },
                ],
            },
            setup: {
                id: 'setup',
                text: subMenuTitle,
                to: '/multi-user-support',
                icon: 'users',
                available:
                    canHaveOrganization &&
                    (isPartOfFamily ? !hasActiveOrganization : !hasActiveOrganizationKey && canHaveOrganization),
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
            filter: {
                id: 'filter',
                text: c('Title').t`Organization filters`,
                to: '/organization-filters',
                icon: 'filter',
                available:
                    canHaveOrganization &&
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
            retentionPolicies: {
                id: 'retentionPolicies',
                text: c('Title').t`Data retention`,
                to: '/retention-policies',
                icon: 'archive-box',
                available: canHaveOrganization && canShowRetentionPolicies,
                subsections: [{ id: 'retention-policies' }],
            },
            security: {
                id: 'security',
                text: c('Title').t`Security`,
                to: '/authentication-security',
                icon: 'shield',
                available:
                    canHaveOrganization &&
                    (hasActiveOrganizationKey || hasActiveOrganization) &&
                    organization &&
                    (organization.MaxMembers > 1 ||
                        organization.TwoFactorRequired !== ORGANIZATION_TWOFA_SETTING.NOT_REQUIRED),
                subsections: [
                    {
                        text: c('Title').t`${PROTON_SENTINEL_NAME} for organizations`,
                        id: 'sentinel',
                        available: canShowB2BActivityMonitorEvents,
                    },
                    {
                        text: c('Title').t`${BRAND_NAME} Account password rules`,
                        id: 'proton-account-password-rules',
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
            sso: {
                id: 'sso',
                text: c('Title').t`Single sign-on`,
                to: '/single-sign-on',
                icon: 'key',
                available:
                    canHaveOrganization &&
                    appSupportsSSO(app) &&
                    (planSupportsSSO(organization?.PlanName, isSsoForPbsEnabled) ||
                        upsellPlanSSO(organization?.PlanName)) &&
                    canHaveOrganization &&
                    isOrgConfigured,
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
                    },
                    {
                        id: 'feature-access',
                        text: c('Title').t`Feature access`,
                        available: canShowVideoConferenceSection || canShowScribeSection,
                    },
                ],
            },
            rolesAndPermissions: {
                id: 'rolesAndPermissions',
                text: c('Title').t`Roles and permissions`,
                to: '/roles-and-permissions',
                icon: 'users-plus',
                available: canShowRolesAndPermissionsSection,
                subsections: [
                    {
                        id: 'roles',
                    },
                ],
            },
        } satisfies Record<string, SectionConfig>,
    };
};
