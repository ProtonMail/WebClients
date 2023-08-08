import { c } from 'ttag';

import { SectionConfig } from '@proton/components';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';
import { getHasVpnB2BPlan, hasVPN } from '@proton/shared/lib/helpers/subscription';
import { Renew, Subscription, UserModel } from '@proton/shared/lib/interfaces';

export const getRoutes = (user: UserModel, subscription?: Subscription) => {
    // that's different from user.hasPaidVpn. That's because hasPaidVpn is true even if user has the unlimited plan
    const hasVpnPlan = hasVPN(subscription);
    const hasVpnB2BPlan = getHasVpnB2BPlan(subscription);

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
                    available: user.isPaid && !hasVpnPlan,
                },
            ],
        },
        general: <SectionConfig>{
            text: c('Title').t`General`,
            to: '/general',
            icon: 'cog-wheel',
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
                    text: '',
                    id: 'account',
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
    };
};
