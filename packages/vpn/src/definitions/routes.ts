import { c } from 'ttag';

import { applyPrefix } from '@proton/nav/api/applyPrefix';
import { defineNavigation } from '@proton/nav/api/defineNavigation';
import { findNavItemById } from '@proton/nav/api/findNavItem';
import type { NavContext } from '@proton/nav/types/models';
import type { NavDefinition, NavItemDefinition, NavItemResolved, NavResolved } from '@proton/nav/types/nav';
import type { NavDefinitionIds, NavSectionIds as SectionIds } from '@proton/nav/types/navIds';
import type { NavSectionResolved } from '@proton/nav/types/section';
import { getIsB2BAudienceFromPlan, planSupportsSSO, upsellPlanSSO } from '@proton/payments/core/plan/helpers';
import {
    type MaybeFreeSubscription,
    getHasExternalMemberCapableB2BPlan,
    getHasMemberCapablePlan,
    getHasVpnB2BPlan,
    hasAnyB2bBundle,
    hasCancellablePlan,
    hasVPNPassProfessional,
    hasVpnBusiness,
    isCancellableOnlyViaSupport,
} from '@proton/payments/core/subscription/helpers';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import {
    APPS,
    BRAND_NAME,
    DARK_WEB_MONITORING_NAME,
    ORGANIZATION_STATE,
    ORGANIZATION_TWOFA_SETTING,
    PRODUCT_NAMES,
    PROTON_SENTINEL_NAME,
    VPN_APP_NAME,
} from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import type { OrgPermissions } from '@proton/shared/lib/interfaces/UserPermission';
import {
    getIsBYOEAccount,
    getIsExternalAccount,
    getIsGlobalSSOAccount,
    getIsSSOVPNOnlyAccount,
} from '@proton/shared/lib/keys';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';
import { isSubscriptionRenewEnabled } from '@proton/shared/lib/subscription/helpers.ts';
import type { FeatureFlag } from '@proton/unleash/UnleashFeatureFlags';

type PropContext = {
    isDataRecoveryAvailable: boolean;
    isSessionRecoveryAvailable: boolean;
    appName: APP_NAMES;
    isAdmin: boolean;
};

type VpnNavContext = {
    subscription: MaybeFreeSubscription;
    notifications?: Record<NavItemDefinition<NavContext>['id'], any>;
    canHaveOrganization: boolean;
    hasActiveOrganizationKey: boolean;
    hasActiveOrganization: boolean;
    needsOrgSetup: boolean;
    hasOrganizationAccess: boolean;
    organizationHasSecurityFeatures: boolean;
    flags: Partial<Record<FeatureFlag, boolean>>;
    permissions: OrgPermissions;
} & NavContext &
    PropContext;

const routesDefinition = {
    items: [
        {
            id: 'organization',
            label: () => c('Title').t`Organization`,
            isVisible: ({ context }) => context.isAdmin,
            children: [
                {
                    id: 'organization.home',
                    label: () => c('Title').t`Home`,
                    to: '/dashboard',
                    icon: 'house',
                    sections: [
                        {
                            id: 'organization.home.your-plan',
                            text: ({ context }) =>
                                context.user.hasPaidVpn ? c('Title').t`Your plan` : c('Title').t`Your current plan`,
                            to: 'subscription',
                        },
                        {
                            id: 'organization.home.upgrade',
                            text: () => c('Title').t`Upgrade your network protection with dedicated servers`,
                            to: 'upgrade',
                            isVisible: ({ context }) => context.user.isPaid && getHasVpnB2BPlan(context.subscription),
                        },
                        {
                            id: 'organization.home.your-subscriptions',
                            text: () => c('Title').t`Your subscriptions`,
                            to: 'your-subscriptions',
                            isVisible: ({ context }) => context.user.isPaid,
                        },
                        {
                            id: 'organization.home.credits',
                            text: () => c('Title').t`Credits`,
                            to: 'credits',
                        },
                        {
                            id: 'organization.home.gift-code',
                            text: () => c('Title').t`Gift code`,
                            to: 'gift-code',
                        },
                        {
                            id: 'organization.home.invoices',
                            text: () => c('Title').t`Invoices`,
                            to: 'invoices',
                        },
                        {
                            id: 'organization.home.cancel-subscription',
                            text: () => c('Title').t`Cancel subscription`,
                            to: 'cancel-subscription',
                            isVisible: ({ context }) =>
                                context.user.isPaid &&
                                hasCancellablePlan(context.subscription) &&
                                isSubscriptionRenewEnabled(context.subscription) &&
                                !isCancellableOnlyViaSupport(context.subscription),
                        },
                        {
                            id: 'organization.home.cancel-via-support',
                            text: () => c('Title').t`Cancel subscription`,
                            to: 'cancel-via-support',
                            // B2B cancellation has a different flow, so we don't consider it a classic cancellable plan
                            isVisible: ({ context }) =>
                                context.user.isPaid && isCancellableOnlyViaSupport(context.subscription),
                        },
                    ],
                },
                {
                    id: 'organization.org-and-people',
                    label: () => c('Title').t`Organization and people`,
                    icon: 'users',
                    children: [
                        {
                            id: 'organization.org-and-people.users',
                            label: () => c('Title').t`Users`,
                            to: '/users-addresses',
                            isVisible: ({ context }) =>
                                !context.needsOrgSetup && context.permissions['account.user.read'],
                            sections: [
                                {
                                    id: 'organization.org-and-people.users.multi-user-creation',
                                    to: 'multi-user-creation',
                                    text: () => c('Title').t`Create multiple user accounts`,
                                    isVisible: ({ context }) =>
                                        !!context.organization?.RequiresKey &&
                                        !getHasExternalMemberCapableB2BPlan(context.subscription),
                                },
                            ],
                        },
                        {
                            id: 'organization.org-and-people.groups',
                            label: () => c('Title').t`Groups`,
                            to: '/user-groups',
                            isVisible: ({ context }) =>
                                !context.needsOrgSetup && context.permissions['account.group.read'],
                        },
                        {
                            id: 'organization.org-and-people.access-control',
                            label: () => c('Title').t`Access control`,
                            to: '/access-control',
                            isVisible: ({ context }) =>
                                !context.needsOrgSetup && context.permissions['account.access_control.read'],
                            sections: [
                                {
                                    id: 'organization.org-and-people.access-control.feature-access',
                                    text: () => c('Title').t`Feature access`,
                                    to: 'feature-access',
                                    isVisible: ({ context }) => {
                                        const showVideoConferenceSection =
                                            (!context.flags.ZoomIntegrationDisabled ||
                                                context.flags.NewScheduleOption) &&
                                            !getIsExternalAccount(context.user) &&
                                            (context.organization?.Settings.VideoConferencingEnabled ||
                                                !context.user.hasPaidMail);

                                        return !!showVideoConferenceSection;
                                    },
                                },
                            ],
                        },
                        {
                            id: 'organization.org-and-people.multi-user',
                            label: () => c('Title').t`Multi-user support`,
                            to: '/multi-user-support',
                            isVisible: ({ context }) => context.needsOrgSetup,
                            sections: [
                                {
                                    id: 'organization.org-and-people.multi-user.name',
                                    to: 'name',
                                    text: () => c('Title').t`Activate multi-user support`,
                                },
                            ],
                        },
                        {
                            id: 'organization.org-and-people.organization-keys',
                            label: () => c('Title').t`Multi-user support`,
                            to: '/organization-keys',
                            isVisible: ({ context }) =>
                                !context.needsOrgSetup &&
                                context.canHaveOrganization &&
                                (getOrganizationDenomination(context.organization) === 'familyGroup' ||
                                    !!context.organization?.RequiresKey),

                            sections: [
                                {
                                    id: 'organization.org-and-people.organization-keys.organization',
                                    to: 'organization',
                                    text: () => c('Title').t`Customization`,
                                },
                                {
                                    id: 'organization.org-and-people.organization-keys.password-keys',
                                    text: () => c('Title').t`Organization key`,
                                    to: 'password-keys',
                                    isVisible: ({ context }) =>
                                        getHasMemberCapablePlan(context.organization, context.subscription) &&
                                        context.hasActiveOrganizationKey,
                                },
                            ],
                        },
                    ],
                },
                {
                    id: 'organization.vpn',
                    label: () => c('Title').t`VPN`,
                    icon: 'brand-proton-vpn-filled',
                    children: [
                        {
                            id: 'organization.vpn.gateways',
                            label: () => c('Title').t`Gateways`,
                            to: '/gateways',
                            isVisible: ({ context }) =>
                                context.canHaveOrganization &&
                                context.permissions['account.gateway.read'] &&
                                (getHasVpnB2BPlan(context.subscription) || hasAnyB2bBundle(context.subscription)),
                            sections: [{ id: 'organization.vpn.gateways.servers', to: 'servers' }],
                        },
                        {
                            id: 'organization.vpn.shared-servers',
                            label: () => c('Title').t`Shared servers`,
                            to: '/shared-servers',
                            isVisible: ({ context }) =>
                                context.canHaveOrganization &&
                                !!context.flags.SharedServerFeature &&
                                context.permissions['account.shared_server.read'] &&
                                (getHasVpnB2BPlan(context.subscription) || hasAnyB2bBundle(context.subscription)),
                            sections: [{ id: 'organization.vpn.shared-servers.servers', to: 'servers' }],
                        },
                        {
                            id: 'organization.vpn.always-on',
                            label: () => c('Title').t`Always-on VPN`,
                            to: '/always-on-vpn',
                            meta: { beta: true },
                            isVisible: ({ context }) => !!context.flags.B2BAlwaysOnEnabled && context.permissions['account.always_on.read'],
                        },
                        {
                            id: 'organization.vpn.gateway-monitor',
                            label: () => c('Title').t`Gateway monitor`,
                            to: '/gateway-monitor',
                            isVisible: ({ context }) => {
                                const hasPlanWithEventLogging =
                                    hasVpnBusiness(context.subscription) ||
                                    hasAnyB2bBundle(context.subscription) ||
                                    hasVPNPassProfessional(context.subscription);

                                return (
                                    context.canHaveOrganization &&
                                    hasPlanWithEventLogging &&
                                    context.hasOrganizationAccess
                                );
                            },
                            sections: [
                                {
                                    id: 'organization.vpn.gateway-monitor.vpn-connection-events',
                                    to: 'vpn-connection-events',
                                },
                            ],
                        },
                    ],
                },
                {
                    id: 'organization.security-and-compliance',
                    label: () => c('Title').t`Security and compliance`,
                    icon: 'shield',
                    to: '/authentication-security',
                    isVisible: ({ context }) =>
                        context.permissions['account.security_policy.read'] &&
                        context.hasOrganizationAccess &&
                        context.organizationHasSecurityFeatures,
                    sections: [
                        {
                            id: 'organization.security-and-compliance.sentinel',
                            to: 'sentinel',
                            text: () => c('Title').t`${PROTON_SENTINEL_NAME} for organizations`,
                            isVisible: ({ context }) =>
                                !context.needsOrgSetup || getIsB2BAudienceFromPlan(context.organization?.PlanName),
                        },
                        {
                            id: 'organization.security-and-compliance.proton-account-password-rules',
                            to: 'proton-account-password-rules',
                            text: () => c('Title').t`${BRAND_NAME} Account password rules`,
                        },
                        {
                            id: 'organization.security-and-compliance.two-factor-authentication-reminders',
                            to: 'two-factor-authentication-reminders',
                            text: () => c('Title').t`Two-factor authentication reminders`,
                        },
                        {
                            id: 'organization.security-and-compliance.two-factor-authentication-enforcement',
                            to: 'two-factor-authentication-enforcement',
                            text: () => c('Title').t`Two-factor authentication enforcement`,
                        },
                    ],
                },
                {
                    id: 'organization.integrations',
                    label: () => c('Title').t`Integrations`,
                    icon: 'link',
                    children: [
                        {
                            id: 'organization.integrations.sso',
                            label: () => c('Title').t`Single-sign on (SSO)`,
                            to: '/single-sign-on',
                            isVisible: ({ context }) =>
                                !!(
                                    context.permissions['account.sso_config.read'] &&
                                    (planSupportsSSO(context.organization?.PlanName, !!context.flags?.SsoForPbs) ||
                                        upsellPlanSSO(context.organization?.PlanName)) &&
                                    (context.hasActiveOrganization || context.hasActiveOrganizationKey)
                                ),
                        },
                    ],
                },
                {
                    id: 'organization.monitoring',
                    label: () => c('Title').t`Monitoring`,
                    icon: 'monitor',
                    children: [
                        {
                            id: 'organization.monitoring.org-monitor',
                            label: () => c('Title').t`Activity monitor`,
                            to: '/activity-monitor',
                            isVisible: ({ context }) => context.permissions['account.activity_log.read'],
                        },
                    ],
                },
            ],
        },
        {
            id: 'my-account',
            label: () => c('Title').t`My account`,
            children: [
                {
                    id: 'my-account.account-and-password',
                    label: () => c('Title').t`Account and password`,
                    to: '/account-password',
                    icon: 'user',
                    sections: [
                        {
                            id: 'my-account.my-account-and-password.two-fa',
                            text: () => c('Title').t`Two-factor authentication`,
                            to: 'two-fa',
                            isVisible: ({ context }) => !getIsSSOVPNOnlyAccount(context.user),
                        },
                        {
                            id: 'my-account.account-and-password.openvpn',
                            to: 'openvpn',
                            text: () => c('Title').t`OpenVPN username`,
                        },
                        {
                            id: 'my-account.account-and-password.news',
                            text: () => c('Title').t`Email subscriptions`,
                            to: 'news',
                            isVisible: ({ context }) => !context.user.isMember,
                        },
                        {
                            id: 'my-account.account-and-password.delete',
                            to: 'delete',
                            text: () => c('Title').t`Delete`,
                            isVisible: ({ context }) => context.user.canPay && !context.user.isMember,
                        },
                    ],
                },
                {
                    id: 'my-account.recovery',
                    label: () => c('Title').t`Recovery`,
                    to: '/recovery',
                    icon: 'key',
                    meta: ({ context }) =>
                        context.notifications?.recovery ? { hasNotifications: context.notifications.recovery } : {},
                    sections: [
                        {
                            id: 'my-account.recovery.account',
                            to: 'account',
                            text: () => c('Title').t`Account recovery`,
                        },
                        {
                            id: 'my-account.recovery.data',
                            to: 'data',
                            text: () => c('Title').t`Data recovery`,
                            isVisible: ({ context }) => context.isDataRecoveryAvailable,
                        },
                        {
                            id: 'my-account.recovery.password-reset',
                            to: 'password-reset',
                            text: () => c('Title').t`Password reset settings`,
                            isVisible: ({ context }) => context.isSessionRecoveryAvailable,
                        },
                    ],
                },
                {
                    id: 'my-account.appearance',
                    label: () => c('Title').t`Appearance`,
                    to: '/appearance',
                    icon: 'paint-roller',
                    sections: [
                        {
                            id: 'my-account.appearance.themes',
                            text: () => c('Themes').t`Themes`,
                            to: 'themes',
                        },
                    ],
                },
                {
                    id: 'my-account.security-and-privacy',
                    label: () => c('Title').t`Security and privacy`,
                    to: '/security',
                    icon: 'shield-2',
                    sections: [
                        {
                            id: 'my-account.security-and-privacy.sentinel',
                            text: PROTON_SENTINEL_NAME,
                            to: 'sentinel',
                            isVisible: ({ context }) => !getIsSSOVPNOnlyAccount(context.user),
                        },
                        {
                            id: 'my-account.security-and-privacy.breaches',
                            text: DARK_WEB_MONITORING_NAME,
                            to: 'breaches',
                            isVisible: ({ context }) => !getIsSSOVPNOnlyAccount(context.user),
                        },
                        {
                            id: 'my-account.security-and-privacy.devices',
                            text: () => c('sso').t`Devices management`,
                            to: 'devices',
                            isVisible: ({ context }) => getIsGlobalSSOAccount(context.user),
                        },
                        {
                            id: 'my-account.security-and-privacy.sessions',
                            text: () => c('Title').t`Session management`,
                            to: 'sessions',
                            isVisible: ({ context }) => !getIsSSOVPNOnlyAccount(context.user),
                        },
                        {
                            id: 'my-account.security-and-privacy.logs',
                            text: () => c('Title').t`Account monitor`,
                            to: 'logs',
                            isVisible: ({ context }) => !getIsSSOVPNOnlyAccount(context.user),
                        },
                        {
                            id: 'my-account.security-and-privacy.third-party',
                            text: () => c('Title').t`Third-party apps and services`,
                            to: 'third-party',
                            isVisible: ({ context }) => {
                                const showVideoConferenceSection =
                                    (!context.flags.ZoomIntegrationDisabled || context.flags.NewScheduleOption) &&
                                    !getIsExternalAccount(context.user) &&
                                    (context.organization?.Settings.VideoConferencingEnabled ||
                                        !context.user.hasPaidMail);

                                return !!showVideoConferenceSection;
                            },
                        },
                        {
                            id: 'my-account.security-and-privacy.privacy',
                            text: () => c('Title').t`Privacy and data collection`,
                            to: 'privacy',
                        },
                    ],
                },
                {
                    id: 'my-account.import-via-easy-switch',
                    label: () => c('Title').t`Import via ${PRODUCT_NAMES.EASY_SWITCH}`,
                    to: '/easy-switch',
                    icon: 'arrow-down-to-square',
                    isVisible: ({ context }) => {
                        if (context.appName !== APPS.PROTONACCOUNT) {
                            return false;
                        }

                        const isExternalUser = getIsExternalAccount(context.user);
                        const isBYOEUser = getIsBYOEAccount(context.user);
                        const isSSOUser = getIsSSOVPNOnlyAccount(context.user);

                        const showEasySwitchSection = (!isExternalUser || isBYOEUser) && !isSSOUser;
                        return showEasySwitchSection;
                    },
                    sections: [
                        {
                            id: 'my-account.import-via-easy-switch.import-list',
                            text: () => c('Title').t`Imports`,
                            to: 'import-list',
                        },
                        {
                            id: 'my-account.import-via-easy-switch.forwarding-list',
                            text: () => c('Title').t`Connected emails`,
                            to: 'forwarding-list',
                        },
                    ],
                },
            ],
        },
        {
            id: 'my-vpn',
            label: () => c('Title').t`My VPN`,
            children: [
                {
                    id: 'my-vpn.download-apps',
                    label: ({ context }) =>
                        context.appName === APPS.PROTONACCOUNT ? c('Title').t`VPN apps` : c('Title').t`Download apps`,
                    to: ({ context }) => (context.appName === APPS.PROTONACCOUNT ? '/vpn-apps' : '/downloads'),
                    icon: 'arrow-down-line',
                    sections: [
                        {
                            id: 'my-vpn.download-apps.protonvpn-clients',
                            to: 'protonvpn-clients',
                            text: () => c('Title').t`${VPN_APP_NAME} clients`,
                        },
                        {
                            id: 'my-vpn.download-apps.wireguard-configuration',
                            to: 'wireguard-configuration',
                            text: () => c('Title').t`WireGuard configuration`,
                            isVisible: ({ context }) => context.appName === APPS.PROTONVPN_SETTINGS,
                        },
                        {
                            id: 'my-vpn.download-apps.openvpn-configuration-files',
                            to: 'openvpn-configuration-files',
                            text: () => c('Title').t`OpenVPN configuration files`,
                            isVisible: ({ context }) => context.appName === APPS.PROTONVPN_SETTINGS,
                        },
                    ],
                },
                {
                    id: 'my-vpn.wireguard',
                    label: () => c('Title').t`WireGuard`,
                    to: '/WireGuard',
                    icon: 'brand-wireguard',
                    isVisible: ({ context }) => context.appName === APPS.PROTONACCOUNT,
                    sections: [
                        {
                            id: 'my-vpn.download-apps.wireguard-configuration',
                            to: 'wireguard-configuration',
                            text: () => c('Title').t`WireGuard configuration`,
                        },
                    ],
                },
                {
                    id: 'my-vpn.openvpn',
                    icon: 'key',
                    to: '/OpenVpn',
                    label: c('Title').t`OpenVpn`,
                    isVisible: ({ context }) => context.appName === APPS.PROTONACCOUNT,
                },
            ],
        },
    ],
} as const satisfies NavDefinition<VpnNavContext>;

type Args = {
    prefix?: string;
    user: NavContext['user'];
    organization?: NavContext['organization'];
    notifications?: Record<NavItemDefinition<NavContext>['id'], any>;
    subscription: MaybeFreeSubscription;
    context: PropContext;
    flags?: Partial<Record<FeatureFlag, boolean>>;
    permissions: OrgPermissions;
};

export const resolveNavigation = ({
    prefix,
    notifications,
    user,
    subscription,
    organization,
    flags,
    context,
    permissions,
}: Args) => {
    const isOrgActive = organization?.State === ORGANIZATION_STATE.ACTIVE;

    const canHaveOrganization = !user.isMember && !!organization;
    const hasActiveOrganizationKey = isOrgActive && hasOrganizationSetupWithKeys(organization);
    const hasActiveOrganization = isOrgActive && hasOrganizationSetup(organization);
    const hasOrganizationAccess = hasActiveOrganization || hasActiveOrganizationKey;

    const isPartOfFamily = getOrganizationDenomination(organization) === 'familyGroup';
    const needsOrgSetup = canHaveOrganization && (isPartOfFamily ? !hasActiveOrganization : !hasActiveOrganizationKey);

    const organizationHasSecurityFeatures =
        (organization && organization?.MaxMembers > 1) ||
        organization?.TwoFactorRequired !== ORGANIZATION_TWOFA_SETTING.NOT_REQUIRED;

    const nav = defineNavigation<VpnNavContext>({
        definition: routesDefinition,
        context: {
            user,
            subscription,
            organization,
            notifications,
            canHaveOrganization,
            hasActiveOrganizationKey,
            hasActiveOrganization,
            needsOrgSetup,
            hasOrganizationAccess,
            organizationHasSecurityFeatures,
            ...context,
            flags: flags ?? {},
            permissions,
        },
    });

    return prefix ? applyPrefix(nav, prefix) : nav;
};

type NavId = NavDefinitionIds<typeof routesDefinition>;

/**
 * Given an item id, type-safe and autocomplete, finds all section ids
 * It's tied to `routesDefinition`
 *
 * @example
 * type DownloadSectionIds = NavSectionIds<'my-vpn.download-apps'>;
 * // 'my-vpn.download-apps.protonvpn-clients' | 'my-vpn.download-apps.wireguard-configuration'
 * //   | 'my-vpn.download-apps.openvpn-configuration-files'
 */
type NavSectionIds<ParentId extends NavId> = SectionIds<typeof routesDefinition, ParentId>;

/**
 * Utility type to have typed resolved nav items, otherwise its `id` would default back to string.
 *
 * @example
 * const item: NavItem<'my-vpn.download-apps'> | undefined = findNavItem(nav, 'my-vpn.download-apps');
 * item?.id;               // 'my-vpn.download-apps'                — a literal, not `string`
 * item?.sections?.[0].id; // NavSectionIds<'my-vpn.download-apps'> — a literal, not `string`
 */
interface NavItem<Id extends NavId> extends Omit<NavItemResolved, 'id' | 'sections'> {
    id: Id;
    sections: (Omit<NavSectionResolved, 'id'> & { id: NavSectionIds<Id> })[] | undefined;
}

/**
 * Adds a literal type back because a NavResolved is dynamic. TypeScript widens it since it doesn't know the final outcome.
 *
 *
 * The returned item's `id` is `Id` and each `section.id` is a {@link NavSectionIds}`<Id>` —
 * `id` is constrained to {@link NavId} for autocomplete and typo safety.
 *
 * @example
 * const downloads = findNavItem(adminSidebarFeature.nav, 'my-vpn.download-apps');
 * if (downloads) {
 *     downloads.to;               // the resolved route path
 *     downloads.sections?.[0].id; // NavSectionIds<'my-vpn.download-apps'>
 * }
 */
export const findNavItem = <Id extends NavId>(nav: NavResolved, id: Id): NavItem<Id> | undefined =>
    findNavItemById(nav, id) as NavItem<Id> | undefined;
