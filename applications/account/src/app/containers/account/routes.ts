import { c } from 'ttag';

import { ThemeColor } from '@proton/colors';
import { SectionConfig } from '@proton/components';
import {
    APPS,
    APP_NAMES,
    BRAND_NAME,
    DEFAULT_CURRENCY,
    PRODUCT_NAMES,
    PROTON_SENTINEL_NAME,
    REFERRAL_PROGRAM_MAX_AMOUNT,
} from '@proton/shared/lib/constants';
import { humanPriceWithCurrency } from '@proton/shared/lib/helpers/humanPrice';
import { hasVPN } from '@proton/shared/lib/helpers/subscription';
import { Organization, Renew, Subscription, UserModel, UserType } from '@proton/shared/lib/interfaces';
import { isOrganizationFamily, isOrganizationVisionary } from '@proton/shared/lib/organization/helper';

import { recoveryIds } from './recoveryIds';

export const getAccountAppRoutes = ({
    app,
    user,
    subscription,
    isDataRecoveryAvailable,
    isReferralProgramEnabled,
    recoveryNotification,
    isGmailSyncEnabled,
    organization,
    isProtonSentinelEligible,
    isProtonSentinelFeatureEnabled,
}: {
    app: APP_NAMES;
    user: UserModel;
    subscription?: Subscription;
    isDataRecoveryAvailable: boolean;
    isReferralProgramEnabled: boolean;
    isGmailSyncEnabled: boolean;
    recoveryNotification?: ThemeColor;
    organization?: Organization;
    isProtonSentinelEligible: boolean;
    isProtonSentinelFeatureEnabled: boolean;
}) => {
    const { isFree, canPay, isPaid, isPrivate, isMember, isAdmin, Currency, Type } = user;
    const credits = humanPriceWithCurrency(REFERRAL_PROGRAM_MAX_AMOUNT, Currency || DEFAULT_CURRENCY);
    const isExternal = Type === UserType.EXTERNAL;

    //Used to determine if a user is on a family plan
    const isFamilyPlan = !!organization && isOrganizationFamily(organization);
    const isFamilyPlanMember = isFamilyPlan && isMember && isPaid;

    //Used to determine if a user is on a visionary plan (works for both old and new visionary plans)
    const isVisionaryPlan = !!organization && isOrganizationVisionary(organization);
    const isMemberProton = Type === UserType.PROTON;

    // that's different from user.hasPaidVpn. That's because hasPaidVpn is true even if user has the unlimited plan
    const hasVpnPlan = hasVPN(subscription);

    return <const>{
        header: c('Settings section title').t`Account`,
        routes: {
            dashboard: <SectionConfig>{
                text: c('Title').t`Dashboard`,
                to: '/dashboard',
                icon: 'squares-in-square',
                available: isFree || canPay || !isMember || (isPaid && canPay),
                subsections: [
                    {
                        id: 'your-plan',
                        available: canPay,
                    },
                    {
                        text: c('Title').t`Your subscriptions`,
                        id: 'your-subscriptions',
                        available: isPaid && canPay,
                    },
                    {
                        text: c('Title').t`Payment methods`,
                        id: 'payment-methods',
                        available: canPay,
                    },
                    {
                        text: c('Title').t`Credits`,
                        id: 'credits',
                        available: canPay,
                    },
                    {
                        text: c('Title').t`Gift code`,
                        id: 'gift-code',
                        available: canPay,
                    },
                    {
                        text: c('Title').t`Invoices`,
                        id: 'invoices',
                        available: canPay,
                    },
                    {
                        text: c('Title').t`Email subscriptions`,
                        id: 'email-subscription',
                        available: !isMember,
                    },
                    {
                        text: c('Title').t`Cancel subscription`,
                        id: 'cancel-subscription',
                        available: isPaid && canPay && hasVpnPlan && subscription?.Renew === Renew.Enabled,
                    },
                    {
                        text: c('Title').t`Downgrade account`,
                        id: 'downgrade-account',
                        available: isPaid && canPay && !hasVpnPlan,
                    },
                ],
            },
            upgrade: <SectionConfig>{
                text: c('Title').t`Upgrade plan`,
                to: '/upgrade',
                icon: 'arrow-up-big-line',
                available: canPay && isFree,
                subsections: [
                    {
                        text: '',
                        id: 'upgrade',
                    },
                ],
            },
            recovery: <SectionConfig>{
                text: c('Title').t`Recovery`,
                to: '/recovery',
                icon: 'key',
                available: isPrivate,
                notification: recoveryNotification,
                subsections: [
                    {
                        text: '',
                        id: 'checklist',
                    },
                    {
                        text: c('Title').t`Account recovery`,
                        id: recoveryIds.account,
                    },
                    {
                        text: c('Title').t`Data recovery`,
                        id: recoveryIds.data,
                        available: isDataRecoveryAvailable,
                    },
                ],
            },
            password: <SectionConfig>{
                text: c('Title').t`Account and password`,
                to: '/account-password',
                icon: 'user',
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
                        text: isFamilyPlan
                            ? c('familyOffer_2023:Title').t`Family plan`
                            : c('familyOffer_2023: Title').t`Your account's benefits`,
                        id: 'family-plan',
                        // We don't want admin to leave the organization, they need first to be demoted
                        available: !isAdmin && (isFamilyPlan || (isVisionaryPlan && isMemberProton)),
                    },
                    //Family members or Proton account that are part of Visionary don't have access to the dashboard, display the payment methods for them here
                    {
                        text: c('Title').t`Payment methods`,
                        id: 'payment-methods',
                        available: isFamilyPlanMember || (isVisionaryPlan && isMemberProton),
                    },
                    //Family members or Proton account that are part of Visionary don't have access to the dashboard, display the credits for them here
                    {
                        text: c('Title').t`Credits`,
                        id: 'credits',
                        available: isFamilyPlanMember || (isVisionaryPlan && isMemberProton),
                    },
                    //Family members or Proton account that are part of Visionary don't have access to the dashboard, display the invoices for them here
                    {
                        text: c('Title').t`Invoices`,
                        id: 'invoices',
                        available: isFamilyPlanMember || (isVisionaryPlan && isMemberProton),
                    },
                    {
                        text: c('Title').t`Delete account`,
                        id: 'delete',
                        available: user.Type === UserType.PROTON || user.Type === UserType.EXTERNAL,
                    },
                ],
            },
            language: <SectionConfig>{
                text: c('Title').t`Language and time`,
                to: '/language-time',
                icon: 'language',
                subsections: [
                    {
                        id: 'language-time',
                    },
                ],
            },
            appearance: <SectionConfig>{
                text: c('Title').t`Appearance`,
                to: '/appearance',
                icon: 'paint-roller',
                subsections: [
                    {
                        text: c('Title').t`Theme`,
                        id: 'theme',
                    },
                    {
                        text: c('Title').t`Accessibility`,
                        id: 'accessibility',
                    },
                ],
            },
            security: <SectionConfig>{
                text: c('Title').t`Security and privacy`,
                to: '/security',
                icon: 'shield',
                subsections: [
                    {
                        text: PROTON_SENTINEL_NAME,
                        id: 'sentinel',
                        available: isProtonSentinelEligible && isProtonSentinelFeatureEnabled,
                    },
                    {
                        text: c('Title').t`Session management`,
                        id: 'sessions',
                    },
                    {
                        text: c('Title').t`Security logs`,
                        id: 'logs',
                    },
                    {
                        text: c('Title').t`Privacy and data collection`,
                        id: 'privacy',
                    },
                ],
            },
            referral: <SectionConfig>{
                text: c('Title').t`Refer a friend`,
                description: c('Description').t`Get up to ${credits} in credits by inviting friends to ${BRAND_NAME}.`,
                to: '/referral',
                icon: 'heart',
                available: !!isReferralProgramEnabled,
                subsections: [
                    {
                        id: 'referral-invite-section',
                    },
                    {
                        text: c('Title').t`Track your referrals`,
                        id: 'referral-reward-section',
                    },
                ],
            },
            easySwitch: <SectionConfig>{
                text: c('Title').t`Import via ${PRODUCT_NAMES.EASY_SWITCH}`,
                to: '/easy-switch',
                icon: 'arrow-down-to-square',
                available: !isExternal && app !== APPS.PROTONPASS,
                description: isGmailSyncEnabled
                    ? c('Settings description')
                          .t`Complete the transition to privacy with our secure importing and forwarding tools.`
                    : c('Settings description').t`Complete the transition to privacy with our secure importing tools.`,
                subsections: [
                    {
                        text: c('Title').t`Set up forwarding`,
                        id: 'start-forward',
                        available: isGmailSyncEnabled,
                    },
                    {
                        text: c('Title').t`Import messages`,
                        id: 'start-import',
                    },
                    {
                        text: c('Title').t`History`,
                        id: 'import-list',
                    },
                ],
            },
        },
    };
};
