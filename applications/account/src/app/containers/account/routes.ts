import { c } from 'ttag';

import { ThemeColor } from '@proton/colors';
import { SectionConfig } from '@proton/components';
import { BRAND_NAME, DEFAULT_CURRENCY, PRODUCT_NAMES, REFERRAL_PROGRAM_MAX_AMOUNT } from '@proton/shared/lib/constants';
import { humanPriceWithCurrency } from '@proton/shared/lib/helpers/humanPrice';
import { UserModel, UserType } from '@proton/shared/lib/interfaces';

import { recoveryIds } from './recoveryIds';

export const getAccountAppRoutes = ({
    user,
    isDataRecoveryAvailable,
    isReferralProgramEnabled,
    recoveryNotification,
    isGmailSyncEnabled,
}: {
    user: UserModel;
    isDataRecoveryAvailable: boolean;
    isReferralProgramEnabled: boolean;
    isGmailSyncEnabled: boolean
    recoveryNotification?: ThemeColor;
}) => {
    const { isFree, canPay, isPaid, isPrivate, isMember, Currency, Type } = user;
    const credits = humanPriceWithCurrency(REFERRAL_PROGRAM_MAX_AMOUNT, Currency || DEFAULT_CURRENCY);
    const isExternal = Type === UserType.EXTERNAL;

    let easySwitchSubsections = [
        {
            text: c('Title').t`Import messages`,
            id: 'start-import',
        },
        {
            text: c('Title').t`History`,
            id: 'import-list',
        }
    ]

    if (isGmailSyncEnabled) {
        easySwitchSubsections = [
            {
                text: c("Title").t`Set up forwarding`,
                id: "start-forward",
            },
            ...easySwitchSubsections,
        ];
    }

    return <const>{
        header: c('Settings section title').t`Account`,
        routes: {
            dashboard: <SectionConfig>{
                text: c('Title').t`Dashboard`,
                to: '/dashboard',
                icon: 'grid-2',
                available: isFree || canPay || !isMember || (isPaid && canPay),
                subsections: [
                    {
                        text: isFree ? c('Title').t`Your current plan` : c('Title').t`Your plan`,
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
                        text: c('Title').t`Downgrade account`,
                        id: 'downgrade-account',
                        available: isPaid && canPay,
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
                        text: c('Title').t`Delete account`,
                        id: 'delete',
                        available: canPay && !isMember,
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
            security: <SectionConfig>{
                text: c('Title').t`Security and privacy`,
                to: '/security',
                icon: 'shield',
                subsections: [
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
                available: !isExternal,
                description: isGmailSyncEnabled
                    ? c('Settings description').t`Complete the transition to privacy with our secure importing and forwarding tools.`
                    : c('Settings description').t`Complete the transition to privacy with our secure importing tools.`,
                subsections: easySwitchSubsections
            },
        },
    };
};
