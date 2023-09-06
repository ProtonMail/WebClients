import { c } from 'ttag';

import { SectionConfig } from '@proton/components';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { getHasVpnB2BPlan, getIsVpnB2BPlan, hasVPN, hasVpnBusiness } from '@proton/shared/lib/helpers/subscription';
import { Organization, Renew, Subscription, UserModel } from '@proton/shared/lib/interfaces';

export const getRoutes = (user: UserModel, subscription?: Subscription, organization?: Organization) => {
    // that's different from user.hasPaidVpn. That's because hasPaidVpn is true even if user has the unlimited plan
    const hasVpnPlan = hasVPN(subscription);
    const hasVpnB2BPlan = getHasVpnB2BPlan(subscription);
    const hasVpnBusinessPlan = hasVpnBusiness(subscription);
    const vpnB2BOrgMember = !!organization && getIsVpnB2BPlan(organization.PlanName);

    const isAdmin = user.isAdmin && !user.isSubUser;
    const canHaveOrganization = !!organization && isAdmin;

    const hasOrganizationKey = hasOrganizationSetupWithKeys(organization);
    const hasOrganization = hasOrganizationSetup(organization);

    const multiUserTitle = c('Title').t`Multi-user support`;

    return {
        dashboard: <SectionConfig>{
            text: c('Title').t`Subscription`,
            to: '/dashboard',
            icon: 'squares-in-square',
            available: user.canPay,
            subsections: [
                {
                    text: c('Title').t`Plans`,
                    available: !user.hasPaidVpn,
                    id: 'plans',
                },
                {
                    text: !user.hasPaidVpn ? c('Title').t`Your current plan` : c('Title').t`Your plan`,
                    id: 'subscription',
                },
                {
                    text: c('Title').t`Upgrade your network protection with dedicated servers`,
                    id: 'upgrade',
                    available: user.isPaid && hasVpnB2BPlan,
                },
                {
                    text: c('Title').t`Your subscriptions`,
                    id: 'your-subscriptions',
                    available: user.isPaid,
                },
                {
                    text: c('Title').t`Payment methods`,
                    id: 'payment-methods',
                },
                {
                    text: c('Title').t`Credits`,
                    id: 'credits',
                },
                {
                    text: c('Title').t`Gift code`,
                    id: 'gift-code',
                },
                {
                    text: c('Title').t`Invoices`,
                    id: 'invoices',
                },
                {
                    text: c('Title').t`Cancel subscription`,
                    id: 'cancel-subscription',
                    available: user.hasPaidVpn && hasVpnPlan && subscription?.Renew === Renew.Enabled,
                },
                {
                    text: c('Title').t`Downgrade account`,
                    id: 'downgrade-account',
                    // The !!subscritpion check is essential here to make sure that all the boolean variables
                    // that depend on subscription are correctly computed before the first rendering.
                    // Otherwise the component will be mounted and immediately unmounted which can cause memory leaks due
                    // to async calls that started in a rendering cycle.
                    available: !!subscription && user.isPaid && !hasVpnPlan && !hasVpnB2BPlan,
                },
                {
                    text: c('Title').t`Cancel subscription`,
                    id: 'cancel-b2b-subscription',
                    available: user.isPaid && !hasVpnPlan && hasVpnB2BPlan,
                },
            ],
        },
        general: <SectionConfig>{
            text: c('Title').t`General`,
            to: '/general',
            icon: 'cog-wheel',
            available: !canHaveOrganization,
            subsections: [
                {
                    text: c('Title').t`Language`,
                    id: 'language',
                },
                {
                    text: c('Themes').t`Themes`,
                    id: 'themes',
                },
            ],
        },
        account: <SectionConfig>{
            text: c('Title').t`Account`,
            to: '/account',
            icon: 'user-circle',
            subsections: [
                {
                    id: 'account',
                },
                {
                    id: 'language',
                    available: canHaveOrganization,
                },
                {
                    text: c('Title').t`Two-factor authentication`,
                    id: 'two-fa',
                },
                {
                    text: c('Title').t`OpenVPN / IKEv2 username`,
                    id: 'openvpn',
                },
                {
                    text: c('Title').t`Recovery`,
                    id: 'email',
                },
                {
                    text: c('Title').t`Email subscriptions`,
                    available: !user.isMember,
                    id: 'news',
                },
                {
                    text: c('Title').t`Delete`,
                    available: user.canPay && !user.isMember,
                    id: 'delete',
                },
            ],
        },
        downloads: <SectionConfig>{
            text: c('Title').t`Downloads`,
            to: '/downloads',
            icon: 'arrow-down-line',
            subsections: [
                {
                    text: c('Title').t`${VPN_APP_NAME} clients`,
                    id: 'protonvpn-clients',
                },
                {
                    text: c('Title').t`OpenVPN configuration files`,
                    id: 'openvpn-configuration-files',
                },
                {
                    text: c('Title').t`WireGuard configuration`,
                    id: 'wireguard-configuration',
                },
            ],
        },
        users: <SectionConfig>{
            text: c('Title').t`Users`,
            to: '/users-addresses',
            icon: 'users',
            available: canHaveOrganization && (hasOrganizationKey || hasOrganization),
            subsections: [
                {
                    id: 'members',
                },
                {
                    text: c('Title').t`Create multiple user accounts`,
                    id: 'multi-user-creation',
                    available: organization && !!organization.RequiresKey,
                },
            ],
        },
        gateways: <SectionConfig>{
            text: c('Title').t`Gateways`,
            to: '/gateways',
            icon: 'servers',
            available: hasVpnB2BPlan || vpnB2BOrgMember,
            subsections: [
                {
                    id: 'servers',
                },
            ],
        },
        setup: <SectionConfig>{
            text: multiUserTitle,
            to: '/multi-user-support',
            icon: 'users',
            available: canHaveOrganization && hasVpnB2BPlan && !hasOrganizationKey,
            subsections: [
                {
                    text: multiUserTitle,
                    id: 'name',
                },
            ],
        },
        security: <SectionConfig>{
            text: c('Title').t`Authentication security`,
            to: '/authentication-security',
            icon: 'shield',
            available:
                canHaveOrganization &&
                hasVpnBusinessPlan &&
                (hasOrganizationKey || hasOrganization) &&
                organization.MaxMembers > 1,
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
    };
};
