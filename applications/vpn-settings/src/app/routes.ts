import { getOrganizationAppRoutes } from 'proton-account/src/app/containers/organization/routes';
import { c } from 'ttag';

import type { SectionConfig } from '@proton/components';
import { APPS, VPN_APP_NAME } from '@proton/shared/lib/constants';
import { getHasVpnB2BPlan, hasCancellablePlan, hasNewCancellablePlan } from '@proton/shared/lib/helpers/subscription';
import { Organization, Renew, Subscription, UserModel } from '@proton/shared/lib/interfaces';
import { getIsSSOVPNOnlyAccount } from '@proton/shared/lib/keys';

interface Arguments {
    user: UserModel;
    subscription?: Subscription;
    organization?: Organization;
    isNewCancellationFlowExtended: boolean;
}

export const getRoutes = ({ user, subscription, organization, isNewCancellationFlowExtended }: Arguments) => {
    const hasVpnB2BPlan = getHasVpnB2BPlan(subscription);

    const canCancelNewPlan = isNewCancellationFlowExtended && hasNewCancellablePlan(subscription);
    const cancellablePlan = canCancelNewPlan || hasCancellablePlan(subscription);

    const isSSOUser = getIsSSOVPNOnlyAccount(user);

    const organizationRoutes = getOrganizationAppRoutes({
        app: APPS.PROTONVPN_SETTINGS,
        organization,
        user,
        subscription,
    });

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
                    available: user.isPaid && cancellablePlan && subscription?.Renew === Renew.Enabled,
                },
                {
                    text: c('Title').t`Downgrade account`,
                    id: 'downgrade-account',
                    // The !!subscritpion check is essential here to make sure that all the boolean variables
                    // that depend on subscription are correctly computed before the first rendering.
                    // Otherwise the component will be mounted and immediately unmounted which can cause memory leaks due
                    // to async calls that started in a rendering cycle.
                    available: !!subscription && user.isPaid && !cancellablePlan && !hasVpnB2BPlan,
                },
                {
                    text: c('Title').t`Cancel subscription`,
                    id: 'cancel-b2b-subscription',
                    // B2B cancellation has a different flow, so we don't consider it a classic cancellable plan
                    available: user.isPaid && !cancellablePlan && hasVpnB2BPlan,
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
                    available: !isSSOUser,
                },
                {
                    id: 'language',
                },
                {
                    text: c('Title').t`Two-factor authentication`,
                    id: 'two-fa',
                    available: !isSSOUser,
                },
                {
                    text: c('Title').t`OpenVPN / IKEv2 username`,
                    id: 'openvpn',
                },
                {
                    text: c('Title').t`Recovery`,
                    id: 'email',
                    available: !isSSOUser,
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
        appearance: <SectionConfig>{
            text: c('Title').t`Appearance`,
            to: '/appearance',
            icon: 'paint-roller',
            subsections: [
                {
                    text: c('Themes').t`Themes`,
                    id: 'themes',
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
        ...organizationRoutes.routes,
    };
};
