import { c } from 'ttag';
import { NotificationDotColor, SectionConfig } from '@proton/components';
import { APPS, PRODUCT_NAMES } from '@proton/shared/lib/constants';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { UserModel } from '@proton/shared/lib/interfaces';
import { recoveryIds } from './recoveryIds';

export const getAccountAppRoutes = ({
    user,
    isDataRecoveryAvailable,
    isReferralProgramEnabled,
    recoveryNotification,
}: {
    user: UserModel;
    isDataRecoveryAvailable: boolean;
    isReferralProgramEnabled: boolean;
    recoveryNotification?: NotificationDotColor;
}) => {
    const { isFree, canPay, isPaid, isPrivate, isMember } = user;
    const mailAppName = getAppName(APPS.PROTONMAIL);
    return <const>{
        header: c('Settings section title').t`Account`,
        routes: {
            dashboard: <SectionConfig>{
                text: c('Title').t`Dashboard`,
                to: '/dashboard',
                icon: 'grid',
                available: isFree || canPay || !isMember || (isPaid && canPay),
                subsections: [
                    {
                        text: c('Title').t`Select plan`,
                        id: 'select-plan',
                        available: isFree,
                    },
                    {
                        text: isFree ? c('Title').t`Your current plan` : c('Title').t`Your plan`,
                        id: 'your-plan',
                        available: canPay,
                    },
                    {
                        text: c('Title').t`Billing details`,
                        id: 'billing',
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
                        text: c('Title').t`Username`,
                        id: 'username',
                    },
                    {
                        text: c('Title').t`Passwords`,
                        id: 'passwords',
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
                text: c('Title').t`Security`,
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
                ],
            },
            referral: <SectionConfig>{
                text: c('Title').t`Refer a friend`,
                description: c('Description')
                    .t`Get up to 3 months of ${mailAppName} Plus for free for every friend who subscribes to ${mailAppName}.`,
                to: '/referral',
                icon: 'gift-card',
                available: !!isReferralProgramEnabled,
                subsections: [
                    {
                        id: 'referral-invite-section',
                    },
                    {
                        text: c('Title').t`Referral tracker`,
                        id: 'referral-reward-section',
                    },
                ],
            },
            easySwitch: <SectionConfig>{
                text: c('Title').t`Import via ${PRODUCT_NAMES.EASY_SWITCH}`,
                to: '/easy-switch',
                icon: 'arrow-down-to-screen',
                description: c('Settings description').t`Make the move to privacy. Effortlessly and securely.`,
                subsections: [
                    {
                        text: c('Title').t`Start new import`,
                        id: 'start-import',
                    },
                    {
                        text: c('Title').t`Current and past imports`,
                        id: 'import-list',
                    },
                ],
            },
        },
    };
};
