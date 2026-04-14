import { c } from 'ttag';

import { defineNavigation } from '@proton/nav/api';
import type { NavContext } from '@proton/nav/types/models';
import type { NavDefinition, NavItemDefinition } from '@proton/nav/types/nav';
import type { Subscription } from '@proton/payments/index';
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

import { isB2BAdmin } from '../functions/isB2BAdmin';

type VpnNavContext = {
    subscription?: Subscription;
    notifications?: Record<NavItemDefinition<NavContext>['id'], any>;
    isB2BAdmin: boolean;
    canHaveOrganization: boolean;
    hasActiveOrganizationKey: boolean;
    hasActiveOrganization: boolean;
    flags: Partial<Record<FeatureFlag, boolean>>;
} & NavContext;

const routesDefinition: NavDefinition<VpnNavContext> = {
    items: [
        {
            id: 'organization',
            label: () => c('Title').t`Organization`,
            resolver: (_, c, { remove, update }) =>
                c.isB2BAdmin ? update({ meta: { group: true, open: true } }) : remove(),
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
                            resolver(_, c, { keep, remove }) {
                                const isPartOfFamily = getOrganizationDenomination(c.organization) === 'familyGroup';
                                const show =
                                    c.canHaveOrganization &&
                                    (isPartOfFamily
                                        ? !c.hasActiveOrganization
                                        : !c.hasActiveOrganizationKey && c.canHaveOrganization);

                                return show ? remove() : keep();
                            },
                        },
                        {
                            id: 'organization.org-and-people.groups',
                            label: () => c('Title').t`Groups`,
                            to: '/user-groups',
                            resolver(_, c, { keep, remove }) {
                                const isPartOfFamily = getOrganizationDenomination(c.organization) === 'familyGroup';
                                const show =
                                    c.canHaveOrganization &&
                                    (isPartOfFamily
                                        ? !c.hasActiveOrganization
                                        : !c.hasActiveOrganizationKey && c.canHaveOrganization);

                                return show ? remove() : keep();
                            },
                        },
                        {
                            id: 'organization.org-and-people.access-control',
                            label: () => c('Title').t`Access control`,
                            to: '/access-control',
                            resolver(_, c, { keep, remove }) {
                                const isPartOfFamily = getOrganizationDenomination(c.organization) === 'familyGroup';
                                const show =
                                    c.canHaveOrganization &&
                                    (isPartOfFamily
                                        ? !c.hasActiveOrganization
                                        : !c.hasActiveOrganizationKey && c.canHaveOrganization);

                                return show ? remove() : keep();
                            },
                        },
                        {
                            id: 'organization.org-and-people.multi-user',
                            label: () => c('Title').t`Multi-user support`,
                            to: '/multi-user-support',
                            resolver: (_, c, { keep, remove, update }) => {
                                const isPartOfFamily = getOrganizationDenomination(c.organization) === 'familyGroup';
                                const show =
                                    c.canHaveOrganization &&
                                    (isPartOfFamily
                                        ? !c.hasActiveOrganization
                                        : !c.hasActiveOrganizationKey && c.canHaveOrganization);

                                if (show) {
                                    return keep();
                                }

                                const organizationKeys =
                                    c.canHaveOrganization &&
                                    (isPartOfFamily
                                        ? c.hasActiveOrganization //Show this section once the family is setup (only requires a name)
                                        : (c.hasActiveOrganizationKey || c.hasActiveOrganization) &&
                                          c.organization &&
                                          !!c.organization.RequiresKey);

                                return organizationKeys ? update({ to: '/organization-keys' }) : remove();
                            },
                        },
                    ],
                },
                {
                    id: 'organization.vpn',
                    label: () => c('Title').t`VPN`,
                    icon: 'brand-proton-vpn-filled',
                    resolver: (_, c, { keep, remove }) => (c.isB2BAdmin ? keep() : remove()),
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
                            resolver(_, c, { keep, remove }) {
                                const hasPlanWithEventLogging =
                                    hasVpnBusiness(c.subscription) ||
                                    hasAnyB2bBundle(c.subscription) ||
                                    hasVPNPassProfessional(c.subscription);
                                const canShowB2BConnectionEvents =
                                    c.flags.B2BLogsVPN &&
                                    hasPlanWithEventLogging &&
                                    c.canHaveOrganization &&
                                    (c.hasActiveOrganization || c.hasActiveOrganizationKey);

                                return c.canHaveOrganization && canShowB2BConnectionEvents ? keep() : remove();
                            },
                        },
                    ],
                },
                {
                    id: 'organization.security-and-compliance',
                    label: () => c('Title').t`Security and compliance`,
                    icon: 'shield',
                    to: '/authentication-security',
                    resolver(_, c, { keep, remove }) {
                        const show =
                            c.canHaveOrganization &&
                            (c.hasActiveOrganizationKey || c.hasActiveOrganization) &&
                            c.organization &&
                            (c.organization.MaxMembers > 1 ||
                                c.organization.TwoFactorRequired !== ORGANIZATION_TWOFA_SETTING.NOT_REQUIRED);

                        return show ? keep() : remove();
                    },
                },
                {
                    id: 'organization.integrations',
                    label: () => c('Title').t`Integrations`,
                    icon: 'link',
                    resolver(i, _, { remove, keep }) {
                        return i.children?.length ? keep() : remove();
                    },
                    children: [
                        {
                            id: 'organization.integrations.sso',
                            label: () => c('Title').t`Single-sign on (SSO)`,
                            to: '/single-sign-on',
                            resolver(_, c, { keep, remove }) {
                                const show =
                                    c.canHaveOrganization &&
                                    (planSupportsSSO(c.organization?.PlanName, !!c.flags?.SsoForPbs) ||
                                        upsellPlanSSO(c.organization?.PlanName)) &&
                                    c.canHaveOrganization &&
                                    (c.hasActiveOrganization || c.hasActiveOrganizationKey);

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
            resolver: (_, c, { update, keep }) => (c.isB2BAdmin ? update({ meta: { group: true } }) : keep()),
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
                    resolver: (_, c, { keep, update }) => {
                        if (c.notifications?.recovery) {
                            return update({
                                meta: { hasNotifications: c.notifications?.recovery },
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
            resolver: (_, context, { update, keep }) => {
                if (context.isB2BAdmin) {
                    return update({ meta: { group: true } });
                }
                return keep();
            },
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
};

type Args = {
    prefix?: NavContext['prefix'];
    user: NavContext['user'];
    organization?: NavContext['organization'];
    notifications?: Record<NavItemDefinition<NavContext>['id'], any>;
    subscription?: Subscription;
    flags?: Partial<Record<FeatureFlag, boolean>>;
};

export const getRoutes = ({ prefix, notifications, user, subscription, organization, flags }: Args) => {
    const isAdmin = isB2BAdmin({ user, organization, subscription });
    const isOrgActive = organization?.State === ORGANIZATION_STATE.ACTIVE;
    return defineNavigation<VpnNavContext>({
        definition: routesDefinition,
        context: {
            user,
            subscription,
            organization,
            notifications,
            prefix,
            isB2BAdmin: isAdmin,
            canHaveOrganization: !user.isMember && !!organization && isAdmin,
            hasActiveOrganizationKey: isOrgActive && hasOrganizationSetupWithKeys(organization),
            hasActiveOrganization: isOrgActive && hasOrganizationSetup(organization),
            flags: flags ?? {},
        },
    });
};
