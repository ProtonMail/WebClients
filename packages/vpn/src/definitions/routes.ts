import { c } from 'ttag';

import { defineNavigation } from '@proton/nav/api/defineNavigation';
import type { NavContext } from '@proton/nav/types/models';
import type { NavDefinition, NavItemDefinition } from '@proton/nav/types/nav';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import {
    hasAnyB2bBundle,
    hasVPNPassProfessional,
    hasVpnBusiness,
    planSupportsSSO,
    upsellPlanSSO,
} from '@proton/payments/index';
import { ORGANIZATION_STATE, ORGANIZATION_TWOFA_SETTING } from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';
import type { FeatureFlag } from '@proton/unleash/UnleashFeatureFlags';

type VpnNavContext = {
    subscription: MaybeFreeSubscription;
    notifications?: Record<NavItemDefinition<NavContext>['id'], any>;
    canHaveOrganization: boolean;
    hasActiveOrganizationKey: boolean;
    hasActiveOrganization: boolean;
    flags: Partial<Record<FeatureFlag, boolean>>;
} & NavContext;

const routesDefinition = {
    items: [
        {
            id: 'organization',
            label: () => c('Title').t`Organization`,
            children: [
                {
                    id: 'organization.home',
                    label: () => c('Title').t`Home`,
                    to: '/dashboard',
                    icon: 'house',
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
                            resolver: ({ context, keep, remove }) => {
                                const isPartOfFamily =
                                    getOrganizationDenomination(context.organization) === 'familyGroup';
                                const show =
                                    context.canHaveOrganization &&
                                    (isPartOfFamily
                                        ? !context.hasActiveOrganization
                                        : !context.hasActiveOrganizationKey && context.canHaveOrganization);

                                return show ? remove() : keep();
                            },
                        },
                        {
                            id: 'organization.org-and-people.groups',
                            label: () => c('Title').t`Groups`,
                            to: '/user-groups',
                            resolver: ({ context, keep, remove }) => {
                                const isPartOfFamily =
                                    getOrganizationDenomination(context.organization) === 'familyGroup';
                                const show =
                                    context.canHaveOrganization &&
                                    (isPartOfFamily
                                        ? !context.hasActiveOrganization
                                        : !context.hasActiveOrganizationKey && context.canHaveOrganization);

                                return show ? remove() : keep();
                            },
                        },
                        {
                            id: 'organization.org-and-people.access-control',
                            label: () => c('Title').t`Access control`,
                            to: '/access-control',
                            resolver: ({ context, keep, remove }) => {
                                const isPartOfFamily =
                                    getOrganizationDenomination(context.organization) === 'familyGroup';
                                const show =
                                    context.canHaveOrganization &&
                                    (isPartOfFamily
                                        ? !context.hasActiveOrganization
                                        : !context.hasActiveOrganizationKey && context.canHaveOrganization);

                                return show ? remove() : keep();
                            },
                        },
                        {
                            id: 'organization.org-and-people.multi-user',
                            label: () => c('Title').t`Multi-user support`,
                            to: '/multi-user-support',
                            resolver: ({ context, keep, remove, update }) => {
                                const isPartOfFamily =
                                    getOrganizationDenomination(context.organization) === 'familyGroup';
                                const show =
                                    context.canHaveOrganization &&
                                    (isPartOfFamily
                                        ? !context.hasActiveOrganization
                                        : !context.hasActiveOrganizationKey && context.canHaveOrganization);

                                if (show) {
                                    return keep();
                                }

                                const organizationKeys =
                                    context.canHaveOrganization &&
                                    (isPartOfFamily
                                        ? context.hasActiveOrganization //Show this section once the family is setup (only requires a name)
                                        : (context.hasActiveOrganizationKey || context.hasActiveOrganization) &&
                                          context.organization &&
                                          !!context.organization.RequiresKey);

                                return organizationKeys ? update({ to: '/organization-keys' }) : remove();
                            },
                        },
                    ],
                },
                {
                    id: 'organization.vpn',
                    label: () => c('Title').t`VPN`,
                    icon: 'brand-proton-vpn-filled',
                    children: [
                        { id: 'organization.vpn.gateways', label: () => c('Title').t`Gateways`, to: '/gateways' },
                        {
                            id: 'organization.vpn.shared-servers',
                            label: () => c('Title').t`Shared servers`,
                            to: '/shared-servers',
                        },
                        {
                            id: 'organization.vpn.gateway-monitor',
                            label: () => c('Title').t`Gateway monitor`,
                            to: '/gateway-monitor',
                            resolver: ({ context, keep, remove }) => {
                                const hasPlanWithEventLogging =
                                    hasVpnBusiness(context.subscription) ||
                                    hasAnyB2bBundle(context.subscription) ||
                                    hasVPNPassProfessional(context.subscription);
                                const canShowB2BConnectionEvents =
                                    context.flags.B2BLogsVPN &&
                                    hasPlanWithEventLogging &&
                                    context.canHaveOrganization &&
                                    (context.hasActiveOrganization || context.hasActiveOrganizationKey);

                                return context.canHaveOrganization && canShowB2BConnectionEvents ? keep() : remove();
                            },
                        },
                    ],
                },
                {
                    id: 'organization.security-and-compliance',
                    label: () => c('Title').t`Security and compliance`,
                    icon: 'shield',
                    to: '/authentication-security',
                    resolver: ({ context, keep, remove }) => {
                        const show =
                            context.canHaveOrganization &&
                            (context.hasActiveOrganizationKey || context.hasActiveOrganization) &&
                            context.organization &&
                            (context.organization.MaxMembers > 1 ||
                                context.organization.TwoFactorRequired !== ORGANIZATION_TWOFA_SETTING.NOT_REQUIRED);

                        return show ? keep() : remove();
                    },
                },
                {
                    id: 'organization.integrations',
                    label: () => c('Title').t`Integrations`,
                    icon: 'link',
                    resolver: ({ item, remove, keep }) => (item.children?.length ? keep() : remove()),
                    children: [
                        {
                            id: 'organization.integrations.sso',
                            label: () => c('Title').t`Single-sign on (SSO)`,
                            to: '/single-sign-on',
                            resolver: ({ context, keep, remove }) => {
                                const show =
                                    context.canHaveOrganization &&
                                    (planSupportsSSO(context.organization?.PlanName, !!context.flags?.SsoForPbs) ||
                                        upsellPlanSSO(context.organization?.PlanName)) &&
                                    context.canHaveOrganization &&
                                    (context.hasActiveOrganization || context.hasActiveOrganizationKey);

                                return show ? keep() : remove();
                            },
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
                },
                {
                    id: 'my-account.recovery',
                    label: () => c('Title').t`Recovery`,
                    to: '/recovery',
                    icon: 'key',
                    resolver: ({ context, keep, update }) => {
                        if (context.notifications?.recovery) {
                            return update({
                                meta: { hasNotifications: context.notifications?.recovery },
                            });
                        }
                        return keep();
                    },
                },
                {
                    id: 'my-account.appearance',
                    label: () => c('Title').t`Appearance`,
                    to: '/appearance',
                    icon: 'paint-roller',
                },
                {
                    id: 'my-account.security-and-privacy',
                    label: () => c('Title').t`Security and privacy`,
                    to: '/security',
                    icon: 'shield-2',
                },
            ],
        },
        {
            id: 'my-vpn',
            label: () => c('Title').t`My VPN`,
            children: [
                {
                    id: 'my-vpn.download-apps',
                    label: () => c('Title').t`Download apps`,
                    to: '/downloads',
                    icon: 'arrow-down-line',
                },
            ],
        },
    ],
} as const satisfies NavDefinition<VpnNavContext>;

type Args = {
    prefix?: NavContext['prefix'];
    user: NavContext['user'];
    organization?: NavContext['organization'];
    notifications?: Record<NavItemDefinition<NavContext>['id'], any>;
    subscription: MaybeFreeSubscription;
    flags?: Partial<Record<FeatureFlag, boolean>>;
};

export const getRoutes = ({ prefix, notifications, user, subscription, organization, flags }: Args) => {
    const isOrgActive = organization?.State === ORGANIZATION_STATE.ACTIVE;

    return defineNavigation<VpnNavContext>({
        definition: routesDefinition,
        context: {
            user,
            subscription,
            organization,
            notifications,
            prefix,
            canHaveOrganization: !user.isMember && !!organization,
            hasActiveOrganizationKey: isOrgActive && hasOrganizationSetupWithKeys(organization),
            hasActiveOrganization: isOrgActive && hasOrganizationSetup(organization),
            flags: flags ?? {},
        },
    });
};
