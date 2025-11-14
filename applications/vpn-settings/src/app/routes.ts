import { c } from 'ttag';

import type { SectionConfig } from '@proton/components';
import {
    Renew,
    type Subscription,
    getHasVpnB2BPlan,
    hasCancellablePlan,
    hasLumo,
    isCancellableOnlyViaSupport,
    isManagedExternally,
} from '@proton/payments';
import { BRAND_NAME, VPN_APP_NAME } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { getIsSSOVPNOnlyAccount } from '@proton/shared/lib/keys';
import type { VPNDashboardVariant } from '@proton/unleash/UnleashFeatureFlagsVariants';

interface Arguments {
    user: UserModel;
    subscription?: Subscription;
    showVPNDashboard: boolean;
    showVPNDashboardVariant: VPNDashboardVariant | 'disabled' | undefined;
    isB2BTrial: boolean;
    isReferralProgramEnabled: boolean;
    isReferralExpansionEnabled: boolean;
    referralInfo: {
        refereeRewardAmount: string;
        referrerRewardAmount: string;
    };
}

export const getRoutes = ({
    user,
    subscription,
    showVPNDashboard,
    showVPNDashboardVariant,
    isB2BTrial,
    isReferralProgramEnabled,
    isReferralExpansionEnabled,
    referralInfo,
}: Arguments) => {
    const hasVpnB2BPlan = getHasVpnB2BPlan(subscription);
    const cancellablePlan = hasCancellablePlan(subscription);
    const cancellableOnlyViaSupport = isCancellableOnlyViaSupport(subscription);
    const isSSOUser = getIsSSOVPNOnlyAccount(user);
    const planIsManagedExternally = isManagedExternally(subscription);

    return {
        dashboardV2: {
            id: 'dashboardV2',
            text: c('Title').t`Home`,
            noTitle: true,
            to: '/dashboardV2',
            icon: 'house',
            available:
                showVPNDashboard && (user.isFree || user.canPay || !user.isMember || (user.isPaid && user.canPay)),
            subsections: [
                {
                    text: c('Title').t`Your plan`,
                    invisibleTitle: true,
                    id: 'YourPlanV2',
                    available: !((user.isFree || hasLumo(subscription)) && showVPNDashboardVariant === 'B'),
                },
                {
                    text: c('Title').t`Upgrade your privacy`,
                    invisibleTitle: true,
                    id: 'YourPlanUpsellsSectionV2',
                    available: user.canPay && !planIsManagedExternally,
                },
                {
                    text: c('Title').t`Downloads`,
                    invisibleTitle: true,
                    id: 'VpnDownloadAndInfoSection',
                },
                {
                    text: c('Title').t`Also in your plan`,
                    invisibleTitle: true,
                    id: 'VpnAlsoInYourPlanSection',
                },
                {
                    text: c('Title').t`Deep dive into VPN blog posts`,
                    invisibleTitle: true,
                    id: 'VpnBlogSection',
                },
            ],
        },
        subscription: {
            id: 'subscription',
            text: c('Title').t`Subscription`,
            noTitle: true,
            to: '/subscription',
            icon: 'credit-card',
            available:
                showVPNDashboard && (user.isFree || user.canPay || !user.isMember || (user.isPaid && user.canPay)),
            subsections: [
                {
                    text: c('Title').t`Your plan`,
                    invisibleTitle: true,
                    id: 'YourPlanV2',
                },
                {
                    text: c('Title').t`Your subscriptions`,
                    id: 'your-subscriptions',
                    available: user.isPaid,
                    variant: 'card',
                },
                {
                    text: c('Title').t`Payment methods`,
                    id: 'payment-methods',
                    variant: 'card',
                },
                {
                    text: c('Title').t`Credits`,
                    id: 'credits',
                    variant: 'card',
                },
                {
                    text: c('Title').t`Gift code`,
                    id: 'gift-code',
                    variant: 'card',
                },
                {
                    text: c('Title').t`Invoices`,
                    id: 'invoices',
                    variant: 'card',
                    available: !isB2BTrial,
                },
                {
                    text: c('Title').t`Cancel subscription`,
                    id: 'cancel-subscription',
                    available:
                        user.isPaid &&
                        cancellablePlan &&
                        subscription?.Renew === Renew.Enabled &&
                        !cancellableOnlyViaSupport,
                    variant: 'card',
                },
                {
                    text: c('Title').t`Downgrade account`,
                    id: 'downgrade-account',
                    // The !!subscritpion check is essential here to make sure that all the boolean variables
                    // that depend on subscription are correctly computed before the first rendering.
                    // Otherwise the component will be mounted and immediately unmounted which can cause memory leaks due
                    // to async calls that started in a rendering cycle.
                    available:
                        !!subscription &&
                        user.isPaid &&
                        !cancellablePlan &&
                        !hasVpnB2BPlan &&
                        !cancellableOnlyViaSupport,
                    variant: 'card',
                },
                {
                    text: c('Title').t`Cancel subscription`,
                    id: 'cancel-via-support',
                    // B2B cancellation has a different flow, so we don't consider it a classic cancellable plan
                    available: user.isPaid && cancellableOnlyViaSupport,
                    variant: 'card',
                },
            ],
        },
        dashboard: {
            id: 'dashboard',
            text: c('Title').t`Subscription`,
            to: '/dashboard',
            icon: 'squares-in-square',
            available: !showVPNDashboard && user.canPay,
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
                    available: !isB2BTrial,
                },
                {
                    text: c('Title').t`Cancel subscription`,
                    id: 'cancel-subscription',
                    available:
                        user.isPaid &&
                        cancellablePlan &&
                        subscription?.Renew === Renew.Enabled &&
                        !cancellableOnlyViaSupport,
                },
                {
                    text: c('Title').t`Downgrade account`,
                    id: 'downgrade-account',
                    // The !!subscritpion check is essential here to make sure that all the boolean variables
                    // that depend on subscription are correctly computed before the first rendering.
                    // Otherwise the component will be mounted and immediately unmounted which can cause memory leaks due
                    // to async calls that started in a rendering cycle.
                    available:
                        !!subscription &&
                        user.isPaid &&
                        !cancellablePlan &&
                        !hasVpnB2BPlan &&
                        !cancellableOnlyViaSupport,
                },
                {
                    text: c('Title').t`Cancel subscription`,
                    id: 'cancel-via-support',
                    // B2B cancellation has a different flow, so we don't consider it a classic cancellable plan
                    available: user.isPaid && cancellableOnlyViaSupport,
                },
            ],
        },
        account: {
            id: 'account',
            text: c('Title').t`Account`,
            to: '/account-password',
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
        appearance: {
            id: 'appearance',
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
        downloads: {
            id: 'downloads',
            text: c('Title').t`Downloads`,
            to: '/downloads',
            icon: 'arrow-down-line',
            subsections: [
                {
                    text: c('Title').t`${VPN_APP_NAME} clients`,
                    id: 'protonvpn-clients',
                },
                {
                    text: c('Title').t`WireGuard configuration`,
                    id: 'wireguard-configuration',
                },
                {
                    text: c('Title').t`OpenVPN configuration files`,
                    id: 'openvpn-configuration-files',
                },
            ],
        },
        referral: {
            id: 'referral',
            text: c('Title').t`Refer a friend`,
            title: c('Title').t`Invite friends. Get credits.`,
            description:
                // translator: Full sentence 'You’ll receive US$20 in Proton credit when the person you invite signs up for a Proton plan, and they’ll also get US$20 in credits to get started.'
                c('Description')
                    .t`You’ll receive ${referralInfo.referrerRewardAmount} in ${BRAND_NAME} credit when the person you invite signs up for a ${BRAND_NAME} plan, and they’ll also get ${referralInfo.refereeRewardAmount} in credits to get started.`,
            to: '/referral',
            icon: 'money-bills',
            available: !!isReferralProgramEnabled && !!isReferralExpansionEnabled,
            subsections: [
                {
                    id: 'referral-invite-section',
                },
                {
                    text: c('Title').t`Your referrals`,
                    id: 'referral-reward-section',
                },
            ],
        },
    } satisfies Record<string, SectionConfig>;
};
