import { c } from 'ttag';
import { SectionConfig } from '@proton/components';
import { UserModel } from '@proton/shared/lib/interfaces';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';

export const getRoutes = (user: UserModel) => {
    return {
        dashboard: <SectionConfig>{
            text: c('Title').t`Dashboard`,
            to: '/dashboard',
            icon: 'grid-2',
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
                    text: c('Title').t`Your subscriptions`,
                    id: 'your-subscriptions',
                    available: user.isPaid,
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
                    text: c('Title').t`Downgrade account`,
                    available: user.hasPaidVpn,
                    id: 'cancel-subscription',
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
        payments: <SectionConfig>{
            text: c('Title').t`Payments`,
            to: '/payments',
            icon: 'wallet',
            available: user.canPay,
            subsections: [
                {
                    text: c('Title').t`Payment methods`,
                    id: 'payment-methods',
                },
                {
                    text: c('Title').t`Invoices`,
                    id: 'invoices',
                },
            ],
        },
    };
};
