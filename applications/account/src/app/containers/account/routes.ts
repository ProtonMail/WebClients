import { c } from 'ttag';

import type { ThemeColor } from '@proton/colors';
import type { SectionConfig, SubrouteGroup } from '@proton/components';
import { SettingsLayoutVariant } from '@proton/components/containers/layout/interface';
import { getIsConsumerPassPlan } from '@proton/payments/core/plan/helpers';
import {
    type MaybeFreeSubscription,
    getHasExternalMemberCapableB2BPlan,
    getHasVpnB2BPlan,
    hasCancellablePlan,
    hasLumo,
    isCancellableOnlyViaSupport,
    isManagedExternally,
} from '@proton/payments/core/subscription/helpers';
import { AccessType } from '@proton/shared/lib/authentication/accessType';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import {
    APPS,
    BRAND_NAME,
    DARK_WEB_MONITORING_NAME,
    PRODUCT_NAMES,
    PROTON_SENTINEL_NAME,
} from '@proton/shared/lib/constants';
import { UserType } from '@proton/shared/lib/interfaces';
import {
    getIsBYOEAccount,
    getIsExternalAccount,
    getIsGlobalSSOAccount,
    getIsSSOVPNOnlyAccount,
} from '@proton/shared/lib/keys';
import { getOrganizationDenomination, isOrganizationVisionary } from '@proton/shared/lib/organization/helper';
import { isSubscriptionRenewEnabled } from '@proton/shared/lib/subscription/helpers';
import { getHasStorageSplit } from '@proton/shared/lib/user/storage';

import type { AccountRecoveryRouterFlags, AccountRouterParams } from '../../content/router-params';
import { recoveryIds } from './recoveryIds';

function getV2DashboardSections(
    app: APP_NAMES,
    canPay: boolean,
    planIsManagedExternally: boolean,
    hasPendingInvitations: boolean
) {
    return [
        {
            text: c('Title').t`Pending invitations`,
            id: 'PendingInvitations',
            available: hasPendingInvitations,
            invisibleTitle: true,
            keywords: [
                c('familyOffer_2023:Action').t`View invitation`,
                c('account_search_index').t`Join organization`,
                c('account_search_index').t`Group plan invitation`,
            ],
        },
        {
            text: c('Title').t`Your plan`,
            invisibleTitle: true,
            id: 'YourPlan',
            keywords: [
                c('Action').t`Manage subscription`,
                c('Action').t`Edit billing cycle`,
                c('Action').t`Explore other plans`,
            ],
        },
        {
            text: c('Title').t`Compare plans`,
            invisibleTitle: true,
            id: 'YourPlanUpsell',
            available: canPay && !planIsManagedExternally,
            keywords: [
                c('Title').t`Get complete privacy coverage`,
                c('account_search_index').t`Upgrade plan`,
                c('account_search_index').t`Compare plans`,
            ],
        },
        {
            text: c('Title').t`Downloads`,
            invisibleTitle: true,
            available: app !== APPS.PROTONACCOUNT,
            id: 'DownloadAndInfo',
            keywords: [
                c('account_search_index').t`Download apps`,
                c('Download').t`Installation guide`,
                c('account_search_index').t`Desktop and mobile apps`,
            ],
        },
        {
            text: c('Title').t`Also in your plan`,
            invisibleTitle: true,
            id: 'AlsoInYourPlan',
            keywords: [
                c('Title').t`Get more from your privacy suite`,
                c('account_search_index').t`Included apps`,
                c('account_search_index').t`Privacy services`,
            ],
        },
        {
            text: c('Title').t`Deep dive into email blog posts`,
            invisibleTitle: true,
            id: 'Blog',
            available: app !== APPS.PROTONACCOUNT && app !== APPS.PROTONMEET,
            keywords: [c('account_search_index').t`Blog articles`, c('account_search_index').t`Privacy guides`],
        },
    ];
}

function getV1DashboardSections(
    hasSplitStorage: boolean,
    showStorageSection: boolean,
    canPay: boolean,
    assistantKillSwitch: boolean,
    isPaid: boolean,
    isMember: boolean,
    cancellablePlan: boolean,
    subscription: MaybeFreeSubscription,
    cancellableOnlyViaSupport: boolean,
    hasExternalMemberCapableB2BPlan: boolean
) {
    return [
        // do not show Your Plan section for Pass users
        {
            text: hasSplitStorage ? c('Title').t`Your storage` : undefined,
            id: 'your-storage',
            available: hasSplitStorage && showStorageSection,
            keywords: [
                c('storage_split: info').t`Get more storage`,
                c('account_search_index').t`Storage usage`,
                c('account_search_index').t`Storage space`,
            ],
        },
        {
            text: hasSplitStorage && showStorageSection ? c('Title').t`Your plan` : undefined,
            id: 'your-plan',
            available: canPay,
            keywords: [
                c('Action').t`Customize plan`,
                c('Action').t`Edit billing cycle`,
                c('new_plans: Title').t`Your account's usage`,
            ],
        },
        {
            id: 'assistant-toggle',
            available: !assistantKillSwitch,
            keywords: [
                c('Info').t`${BRAND_NAME} Scribe writing assistant`,
                c('account_search_index').t`Writing assistant`,
                c('account_search_index').t`AI assistant`,
            ],
        },
        {
            text: c('Title').t`Your subscriptions`,
            id: 'your-subscriptions',
            available: isPaid && canPay,
            keywords: [
                c('Action subscription').t`Reactivate`,
                c('account_search_index').t`Subscription status`,
                c('account_search_index').t`Subscription end date`,
            ],
        },
        {
            text: c('Title').t`Payment methods`,
            id: 'payment-methods',
            available: canPay,
            keywords: [
                c('Action').t`Add credit / debit card`,
                c('Action').t`Add PayPal`,
                c('account_search_index').t`Automatic renewal`,
            ],
        },
        {
            text: c('Title').t`Credits`,
            id: 'credits',
            available: canPay,
            keywords: [c('Action').t`Add credits`, c('Credits').t`Available credits`],
        },
        {
            text: c('Title').t`Gift code`,
            id: 'gift-code',
            available: canPay,
            keywords: [c('Placeholder').t`Add gift code`, c('account_search_index').t`Redeem discount code`],
        },
        {
            text: c('Title').t`Invoices`,
            id: 'invoices',
            available: canPay,
            keywords: [
                c('Action').t`Edit billing address`,
                c('Select invoice document').t`Credit note`,
                c('Select invoice document').t`Transactions`,
            ],
        },
        {
            text: c('Title').t`Notifications`,
            id: 'email-subscription',
            available: !isMember,
            keywords: [
                c('news').t`${BRAND_NAME} newsletter`,
                c('news').t`${BRAND_NAME} offers and promotions`,
                c('news').t`Daily email notifications`,
            ],
        },
        {
            text: c('Title').t`Cancel subscription`,
            id: 'cancel-subscription',
            available:
                isPaid &&
                canPay &&
                cancellablePlan &&
                isSubscriptionRenewEnabled(subscription) &&
                !cancellableOnlyViaSupport,
            keywords: [
                c('account_search_index').t`Cancel plan`,
                c('account_search_index').t`Stop subscription renewal`,
                c('account_search_index').t`Downgrade to Free`,
            ],
        },
        {
            text: c('Title').t`Cancel subscription`,
            id: 'cancel-via-support',
            available: isPaid && canPay && cancellableOnlyViaSupport,
            keywords: [
                c('Action').t`Contact us`,
                c('account_search_index').t`Cancel plan`,
                c('account_search_index').t`Customer support`,
            ],
        },
        {
            text: c('Title').t`Cancel subscription`,
            id: 'downgrade-account',
            available:
                isPaid && canPay && !cancellablePlan && !hasExternalMemberCapableB2BPlan && !cancellableOnlyViaSupport,
            keywords: [
                c('account_search_index').t`Downgrade plan`,
                c('account_search_index').t`Downgrade to Free`,
                c('account_search_index').t`Cancel plan`,
            ],
        },
    ];
}

export const getRecoverySettings = ({
    accountRecoveryRouterFlags: {
        isRecoveryScoreBannerAvailable,
        isAccountRecoveryAvailable,
        isMnemonicAvailable,
        isDelegatedAccessAvailable,
        isRecoveryFileAvailable,
        isSessionRecoveryAvailable,
    },
    recoveryNotification,
}: {
    accountRecoveryRouterFlags: AccountRecoveryRouterFlags;
    recoveryNotification?: ThemeColor;
}) => {
    const recoverySubrouteGroups = {
        passwordReset: {
            id: 'password-reset-options',
            title: c('Title').t`Password reset options`,
            description: c('Description')
                .t`This allows you to regain access to your ${BRAND_NAME} account but does not recover your encrypted data.`,
            subroutes: {
                email: {
                    id: 'email',
                    text: c('Title').t`Email verification`,
                    to: '/email',
                    variant: SettingsLayoutVariant.Card,
                    keywords: [
                        c('Status').t`Add an email address`,
                        c('account_search_index').t`Recovery email address`,
                        c('account_search_index').t`One-time code`,
                    ],
                },
                phone: {
                    id: 'phone',
                    text: c('Title').t`SMS verification`,
                    to: '/phone',
                    variant: SettingsLayoutVariant.Card,
                    keywords: [
                        c('Status').t`Add a phone number`,
                        c('account_search_index').t`Recovery phone number`,
                        c('account_search_index').t`One-time code`,
                    ],
                },
            },
        },
        dataRecovery: {
            id: 'data-recovery-options',
            title: c('Title').t`Data recovery options`,
            description: c('Description').t`How you unlock your encrypted data if you lose your password.`,
            subroutes: {
                deviceRecovery: {
                    id: 'device-backup',
                    text: c('Title').t`Device data backup`,
                    to: '/device-backup',
                    available: isRecoveryFileAvailable,
                    variant: SettingsLayoutVariant.Card,
                    keywords: [
                        c('Status').t`Available on this device`,
                        c('account_search_index').t`Encryption backup in this browser`,
                    ],
                },
                backupFile: {
                    id: 'backup-file',
                    text: c('Title').t`Recovery file`,
                    to: '/backup-file',
                    available: isRecoveryFileAvailable,
                    variant: SettingsLayoutVariant.Card,
                    keywords: [
                        c('account_search_index').t`Encryption backup file`,
                        c('account_search_index').t`Download recovery file`,
                    ],
                },
                recoveryContacts: {
                    id: 'recovery-contacts',
                    text: c('emergency_access').t`Data recovery contacts`,
                    to: '/recovery-contacts',
                    available: isDelegatedAccessAvailable,
                    variant: SettingsLayoutVariant.Card,
                    keywords: [
                        c('emergency_access').t`Add recovery contact`,
                        c('emergency_access').t`Send recovery request`,
                        c('account_search_index').t`Trusted contact`,
                    ],
                },
            },
        },
        advancedRecovery: {
            id: 'advanced-recovery-options',
            title: c('Title').t`Advanced recovery options`,
            description: c('Description').t`Methods that include both password reset and data recovery.`,
            subroutes: {
                phrase: {
                    id: 'phrase',
                    text: c('Title').t`Recovery phrase`,
                    to: '/phrase',
                    available: isMnemonicAvailable,
                    variant: SettingsLayoutVariant.Card,
                    keywords: [
                        c('Status').t`Generate a recovery phrase`,
                        c('account_search_index').t`12-word phrase`,
                        c('account_search_index').t`Mnemonic`,
                    ],
                },
                signedInReset: {
                    id: 'signed-in-reset',
                    text: c('Title').t`Signed-in reset`,
                    to: '/signed-in-reset',
                    available: isSessionRecoveryAvailable,
                    variant: SettingsLayoutVariant.Card,
                    keywords: [
                        c('Tooltip').t`Allow resetting your password from the account settings`,
                        c('account_search_index').t`Password reset request`,
                    ],
                },
                qrCode: {
                    id: 'qr-code',
                    text: c('Title').t`QR code sign-in`,
                    to: '/qr-code',
                    variant: SettingsLayoutVariant.Card,
                    keywords: [c('edm').t`Sign in with QR code`, c('account_search_index').t`Scan QR code`],
                },
                emergencyContacts: {
                    id: 'emergency-contacts',
                    text: c('emergency_access').t`Emergency access`,
                    to: '/emergency-contacts',
                    available: isDelegatedAccessAvailable,
                    variant: SettingsLayoutVariant.Card,
                    keywords: [
                        c('emergency_access').t`Add emergency contact`,
                        c('emergency_access').t`People who trust me`,
                        c('emergency_access').t`Wait time for access`,
                    ],
                },
            },
        },
    } satisfies Record<string, SubrouteGroup>;

    return {
        id: 'recovery',
        text: c('Title').t`Recovery`,
        description: c('Description')
            .t`${BRAND_NAME}'s end-to-end encryption means only you can unlock your data. Set up recovery options now to ensure you never lose access.`,
        to: '/recovery',
        icon: 'key',
        available: isAccountRecoveryAvailable,
        notification: recoveryNotification,
        subsections: [
            {
                text: '',
                id: 'checklist',
                available: isRecoveryScoreBannerAvailable,
                keywords: [
                    c('Recovery score').t`Recoverability`,
                    c('Action').t`View recovery setup details`,
                    c('account_search_index').t`Recovery score`,
                ],
            },
            {
                text: '',
                id: 'password-reminder',
                keywords: [
                    c('Password reminder').t`Do you remember your ${BRAND_NAME} password?`,
                    c('account_search_index').t`Password reminder`,
                ],
            },
        ],
        subrouteGroups: recoverySubrouteGroups,
    } satisfies SectionConfig;
};

export const getAccountAppRoutes = ({
    app,
    user,
    subscription,
    organization,
    recoveryNotification,
    showVPNDashboard,
    showVPNDashboardVariant,
    showThemeSelection,
    assistantKillSwitch,
    memberships,
    referralInfo,
    showDashboard,
    showDriveDashboard,
    showGenericDashboard,
    hasPendingInvitations,
    permissions,
    flags,
    accountRecoveryRouterFlags,
}: AccountRouterParams) => {
    const { isFree, canPay, isPaid, isMember, isAdmin, Type, hasPaidMail } = user;
    const credits = referralInfo.maxRewardAmount;

    // Used to determine if a user is on a family plan or a duo plan
    const isFamilyOrg = !!organization && getOrganizationDenomination(organization) === 'familyGroup';
    const isFamilyOrDuoPlanMember = isFamilyOrg && isMember && isPaid;

    const isPassConsumerOrPassFamilyOrg = getIsConsumerPassPlan(organization?.PlanName);

    const showStorageSection = !(
        isPassConsumerOrPassFamilyOrg ||
        (isFree && app === APPS.PROTONPASS) ||
        (isFree && app === APPS.PROTONLUMO) ||
        (isFree && app === APPS.PROTONAUTHENTICATOR) ||
        (isFree && app === APPS.PROTONMEET)
    );

    //Used to determine if a user is on a visionary plan (works for both old and new visionary plans)
    const isVisionaryPlan = !!organization && isOrganizationVisionary(organization);
    const isMemberProton = Type === UserType.PROTON;

    const hasExternalMemberCapableB2BPlan = getHasExternalMemberCapableB2BPlan(subscription);

    const cancellablePlan = hasCancellablePlan(subscription);
    const cancellableOnlyViaSupport = isCancellableOnlyViaSupport(subscription);

    const planIsManagedExternally = isManagedExternally(subscription);

    const isSSOUser = getIsSSOVPNOnlyAccount(user);
    const isExternalUser = getIsExternalAccount(user);
    const isBYOEUser = getIsBYOEAccount(user);

    const hasSplitStorage =
        getHasStorageSplit(user) && !getHasVpnB2BPlan(subscription) && app !== APPS.PROTONVPN_SETTINGS;

    const showEasySwitchSection =
        (!isExternalUser || isBYOEUser) &&
        !(
            app === APPS.PROTONPASS ||
            app === APPS.PROTONAUTHENTICATOR ||
            app === APPS.PROTONMEET ||
            app === APPS.PROTONACCOUNT ||
            app === APPS.PROTONLUMO
        ) &&
        !isSSOUser;

    const showVideoConferenceSection =
        (flags.isZoomIntegrationEnabled || flags.isProtonMeetIntegrationEnabled) &&
        !isExternalUser &&
        (organization?.Settings.VideoConferencingEnabled || !hasPaidMail);

    const recoverySettings = getRecoverySettings({
        recoveryNotification,
        accountRecoveryRouterFlags,
    });

    const paymentsSectionAvailable =
        isFamilyOrDuoPlanMember ||
        // we do NOT display payment sections to Visionary admins here (display only to members),
        // because they should have them on the dashboard or subscription pages
        (isVisionaryPlan && isMemberProton && isMember);

    const canAccessBilling = isFree || canPay || !isMember;
    // There are two paths where the dashboard is shown:
    // 1. (!isAdmin && canAccessBilling): if user can access billing, they can see the dashboard. "!isAdmin" is added because
    //  admin without `account.dashboard.read` permission should not see the dashboard (e.g. User Admin has isAdmin = true
    //  but their responsiblity are CRUD members and groups only)
    // 2. permissions['account.dashboard.read']: this path grants the dashboard to any org member who holds the permission
    const shouldShowDashboard = (!isAdmin && canAccessBilling) || permissions['account.dashboard.read'];
    // We do not have to check app names here as the hook responsible to populate these values will do it for us.
    const shouldShowV2Dashboard = showGenericDashboard || showVPNDashboard || showDashboard || showDriveDashboard;

    // As VPN dashboard has its own route for v2 dashboard, we need to check for APP and Feature flag to decide between v1 vs v2 dashboard
    const isVPNDashboardEnabled = app === APPS.PROTONVPN_SETTINGS && showVPNDashboard;

    return <const>{
        available: user.accessType !== AccessType.Msp,
        header: c('Settings section title').t`Account`,
        routes: {
            vpnDashboardV2: {
                id: 'vpnDashboardV2',
                text: c('Title').t`Home`,
                noTitle: true,
                to: '/dashboardV2',
                icon: 'house',
                available: isVPNDashboardEnabled && shouldShowDashboard,
                subsections: [
                    {
                        text: c('Title').t`Your plan`,
                        invisibleTitle: true,
                        id: 'YourPlanV2',
                        available: !((isFree || hasLumo(subscription)) && showVPNDashboardVariant === 'B'),
                        keywords: [
                            c('Action').t`Manage subscription`,
                            c('Action').t`Edit billing cycle`,
                            c('Action').t`Explore other plans`,
                        ],
                    },
                    {
                        text: c('Title').t`Upgrade your privacy`,
                        invisibleTitle: true,
                        id: 'YourPlanUpsellsSectionV2',
                        available: canPay && !planIsManagedExternally,
                        keywords: [
                            c('Title').t`Get complete privacy coverage`,
                            c('account_search_index').t`Upgrade plan`,
                            c('account_search_index').t`Compare plans`,
                        ],
                    },
                    {
                        text: c('Title').t`Downloads`,
                        invisibleTitle: true,
                        id: 'VpnDownloadAndInfoSection',
                        keywords: [
                            c('Title').t`Get more from your VPN`,
                            c('Download').t`Download for Windows`,
                            c('Download').t`Installation guide`,
                        ],
                    },
                    {
                        text: c('Title').t`Also in your plan`,
                        invisibleTitle: true,
                        id: 'VpnAlsoInYourPlanSection',
                        keywords: [
                            c('account_search_index').t`Included apps`,
                            c('account_search_index').t`Privacy services`,
                        ],
                    },
                    {
                        text: c('Title').t`Deep dive into VPN blog posts`,
                        invisibleTitle: true,
                        id: 'VpnBlogSection',
                        keywords: [
                            c('account_search_index').t`Blog articles`,
                            c('account_search_index').t`Privacy guides`,
                        ],
                    },
                ],
            },
            dashboard: {
                text: shouldShowV2Dashboard ? c('Title').t`Home` : c('Title').t`Dashboard`,
                noTitle: shouldShowV2Dashboard,
                icon: shouldShowV2Dashboard ? 'house' : 'squares-in-square',
                available: !isVPNDashboardEnabled && shouldShowDashboard,
                id: shouldShowV2Dashboard ? 'dashboardV2' : 'dashboard',
                to: '/dashboard',
                subsections: shouldShowV2Dashboard
                    ? getV2DashboardSections(app, canPay, planIsManagedExternally, hasPendingInvitations)
                    : getV1DashboardSections(
                          hasSplitStorage,
                          showStorageSection,
                          canPay,
                          assistantKillSwitch,
                          isPaid,
                          isMember,
                          cancellablePlan,
                          subscription,
                          cancellableOnlyViaSupport,
                          hasExternalMemberCapableB2BPlan
                      ),
            },
            subscription: {
                id: 'subscription',
                text: c('Title').t`Subscription`,
                noTitle: true,
                to: '/subscription',
                icon: 'credit-card',
                available: shouldShowV2Dashboard && shouldShowDashboard,
                subsections: [
                    {
                        text: c('Title').t`Your plan`,
                        invisibleTitle: true,
                        id: 'YourPlanV2',
                        keywords: [
                            c('Action').t`Manage subscription`,
                            c('Action').t`Edit billing cycle`,
                            c('Action').t`Explore other plans`,
                        ],
                    },
                    {
                        id: 'assistant-toggle',
                        available: !assistantKillSwitch,
                        variant: SettingsLayoutVariant.Card,
                        keywords: [
                            c('Info').t`${BRAND_NAME} Scribe writing assistant`,
                            c('account_search_index').t`Writing assistant`,
                            c('account_search_index').t`AI assistant`,
                        ],
                    },
                    {
                        text: c('Title').t`Your subscriptions`,
                        id: 'your-subscriptions',
                        available: isPaid && canPay,
                        variant: SettingsLayoutVariant.Card,
                        keywords: [
                            c('Action subscription').t`Reactivate`,
                            c('account_search_index').t`Subscription status`,
                            c('account_search_index').t`Subscription end date`,
                        ],
                    },
                    {
                        text: c('Title').t`Payment methods`,
                        id: 'payment-methods',
                        available: canPay,
                        variant: SettingsLayoutVariant.Card,
                        keywords: [
                            c('Action').t`Add credit / debit card`,
                            c('Action').t`Add PayPal`,
                            c('account_search_index').t`Automatic renewal`,
                        ],
                    },
                    {
                        text: c('Title').t`Credits`,
                        id: 'credits',
                        available: canPay,
                        variant: SettingsLayoutVariant.Card,
                        keywords: [c('Action').t`Add credits`, c('Credits').t`Available credits`],
                    },
                    {
                        text: c('Title').t`Gift code`,
                        id: 'gift-code',
                        available: canPay,
                        variant: SettingsLayoutVariant.Card,
                        keywords: [
                            c('Placeholder').t`Add gift code`,
                            c('account_search_index').t`Redeem discount code`,
                        ],
                    },
                    {
                        text: c('Title').t`Invoices`,
                        id: 'invoices',
                        available: canPay,
                        variant: SettingsLayoutVariant.Card,
                        keywords: [
                            c('Action').t`Edit billing address`,
                            c('Select invoice document').t`Credit note`,
                            c('Select invoice document').t`Transactions`,
                        ],
                    },
                    {
                        text: c('Title').t`Notifications`,
                        id: 'email-subscription',
                        available: !isMember,
                        variant: SettingsLayoutVariant.Card,
                        keywords: [
                            c('news').t`${BRAND_NAME} newsletter`,
                            c('news').t`${BRAND_NAME} offers and promotions`,
                            c('news').t`Daily email notifications`,
                        ],
                    },
                    {
                        text: c('Title').t`Cancel subscription`,
                        id: 'cancel-subscription',
                        available:
                            isPaid &&
                            canPay &&
                            cancellablePlan &&
                            isSubscriptionRenewEnabled(subscription) &&
                            !cancellableOnlyViaSupport,
                        variant: SettingsLayoutVariant.Card,
                        keywords: [
                            c('account_search_index').t`Cancel plan`,
                            c('account_search_index').t`Stop subscription renewal`,
                            c('account_search_index').t`Downgrade to Free`,
                        ],
                    },
                    {
                        text: c('Title').t`Cancel subscription`,
                        id: 'cancel-via-support',
                        available: isPaid && canPay && cancellableOnlyViaSupport,
                        variant: SettingsLayoutVariant.Card,
                        keywords: [
                            c('Action').t`Contact us`,
                            c('account_search_index').t`Cancel plan`,
                            c('account_search_index').t`Customer support`,
                        ],
                    },
                    {
                        text: c('Title').t`Cancel subscription`,
                        id: 'downgrade-account',
                        available:
                            isPaid &&
                            canPay &&
                            !cancellablePlan &&
                            !hasExternalMemberCapableB2BPlan &&
                            !cancellableOnlyViaSupport,
                        variant: SettingsLayoutVariant.Card,
                        keywords: [
                            c('account_search_index').t`Downgrade plan`,
                            c('account_search_index').t`Downgrade to Free`,
                            c('account_search_index').t`Cancel plan`,
                        ],
                    },
                ],
            },
            upgrade: {
                id: 'upgrade',
                text: c('Title').t`Upgrade plan`,
                to: '/upgrade',
                icon: 'arrow-up-big-line',
                available: canPay && isFree,
                subsections: [
                    {
                        text: '',
                        id: 'upgrade',
                        keywords: [
                            c('new_plans: title').t`Unlock premium features by upgrading`,
                            c('Action').t`View plans details`,
                            c('account_search_index').t`Compare plans`,
                        ],
                    },
                ],
            },
            recovery: recoverySettings,
            password: {
                id: 'password',
                text: c('Title').t`Account and password`,
                to: '/account-password',
                icon: 'user',
                available: !isSSOUser,
                subsections: [
                    {
                        text: '',
                        id: 'account',
                        keywords: [
                            c('Label').t`Username`,
                            c('Title').t`Change password`,
                            c('Label').t`Two-password mode`,
                            c('Label').t`Password check-ins`,
                        ],
                    },
                    {
                        text: c('Title').t`Two-factor authentication`,
                        id: 'two-fa',
                        available: !user.Flags.sso,
                        keywords: [c('Label').t`Authenticator app`, c('fido2: Info').t`Security key`],
                    },
                    {
                        text: c('Title').t`Notifications`,
                        id: 'notifications',
                        available:
                            !user.isPrivate &&
                            !accountRecoveryRouterFlags.isAccountRecoveryAvailable &&
                            flags.canDisplayNonPrivateEmailPhone,
                        keywords: [c('Label').t`Notification email address`, c('label').t`Notification phone number`],
                    },
                    {
                        text: c('Title').t`Account recovery`,
                        id: 'account-recovery',
                        // This is a special section for non-private users that only contains the QR code sign in
                        available: !user.isPrivate && !accountRecoveryRouterFlags.isAccountRecoveryAvailable,
                        keywords: [c('edm').t`Sign in with QR code`, c('account_search_index').t`Scan QR code`],
                    },
                    {
                        text: c('Title').t`Emergency access`,
                        id: 'emergency-access',
                        // This is a special section for non-private users that only contains incoming delegated access
                        available: accountRecoveryRouterFlags.isNonPrivateDelegatedAccessAvailable,
                        keywords: [
                            c('emergency_access').t`People who trust me`,
                            c('emergency_access').t`Request access`,
                            c('account_search_index').t`Trusted contact`,
                        ],
                    },
                    {
                        text: c('emergency_access').t`Data recovery contacts`,
                        id: recoveryIds.recoveryContacts,
                        available: accountRecoveryRouterFlags.isNonPrivateDelegatedAccessAvailable,
                        keywords: [
                            c('emergency_access').t`Add recovery contact`,
                            c('emergency_access').t`Send recovery request`,
                            c('account_search_index').t`Trusted contact`,
                        ],
                    },
                    {
                        text: isFamilyOrg
                            ? c('familyOffer_2023:Title').t`Family`
                            : c('familyOffer_2023: Title').t`Your account's benefits`,
                        id: 'family-plan',
                        // We don't want admin to leave the organization, they need first to be demoted
                        available: !isAdmin && (isFamilyOrg || (isVisionaryPlan && isMemberProton)),
                        keywords: [
                            c('familyOffer_2023:Family plan').t`Leave Family plan`,
                            c('account_search_index').t`Leave organization`,
                        ],
                    },
                    //Family members or Proton account that are part of Visionary don't have access to the dashboard, display the payment methods for them here
                    {
                        text: c('Title').t`Payment methods`,
                        id: 'payment-methods',
                        available: paymentsSectionAvailable,
                        keywords: [
                            c('Action').t`Add credit / debit card`,
                            c('Action').t`Add PayPal`,
                            c('account_search_index').t`Automatic renewal`,
                        ],
                    },
                    //Family members or Proton account that are part of Visionary don't have access to the dashboard, display the credits for them here
                    {
                        text: c('Title').t`Credits`,
                        id: 'credits',
                        available: paymentsSectionAvailable,
                        keywords: [c('Action').t`Add credits`, c('Credits').t`Available credits`],
                    },
                    //Family members or Proton account that are part of Visionary don't have access to the dashboard, display the invoices for them here
                    {
                        text: c('Title').t`Invoices`,
                        id: 'invoices',
                        available: paymentsSectionAvailable,
                        keywords: [
                            c('Action').t`Edit billing address`,
                            c('Select invoice document').t`Credit note`,
                            c('Select invoice document').t`Transactions`,
                        ],
                    },
                    {
                        text: c('Title').t`Delete account`,
                        id: 'delete',
                        available: user.isSelf && (user.Type === UserType.PROTON || user.Type === UserType.EXTERNAL),
                        keywords: [
                            c('Action').t`Delete your account`,
                            c('account_search_index').t`Close account`,
                            c('account_search_index').t`Permanently delete data`,
                        ],
                    },
                ],
            },
            language: {
                id: 'language',
                text: c('Title').t`Language and time`,
                to: '/language-time',
                icon: 'language',
                subsections: [
                    {
                        id: 'language-time',
                        keywords: [c('Label').t`Default language`, c('Label').t`Time format`, c('Label').t`Week start`],
                    },
                ],
            },
            appearance: {
                id: 'appearance',
                text: c('Title').t`Appearance`,
                to: '/appearance',
                icon: 'paint-roller',
                available: app !== APPS.PROTONLUMO,
                subsections: [
                    {
                        text: c('Title').t`Theme`,
                        id: 'theme',
                        available: showThemeSelection,
                        keywords: [
                            c('Label').t`Sync with system`,
                            c('account_search_index').t`Dark mode`,
                            c('account_search_index').t`Light mode`,
                        ],
                    },
                    {
                        text: c('Title').t`Accessibility`,
                        id: 'accessibility',
                        keywords: [
                            c('Label').t`Font size`,
                            c('Label').t`Font family`,
                            c('Label').t`Disable animations`,
                        ],
                    },
                ],
            },
            security: {
                id: 'security',
                text: c('Title').t`Security and privacy`,
                to: '/security',
                icon: 'shield',
                subsections: [
                    {
                        text: PROTON_SENTINEL_NAME,
                        id: 'sentinel',
                        available: !isSSOUser,
                        keywords: [
                            c('account_search_index').t`Advanced account protection`,
                            c('account_search_index').t`High-security mode`,
                        ],
                    },
                    {
                        text: DARK_WEB_MONITORING_NAME,
                        id: 'breaches',
                        available: !isSSOUser,
                        keywords: [
                            c('Link').t`How does monitoring work?`,
                            c('account_search_index').t`Data breach alerts`,
                            c('account_search_index').t`Leaked password`,
                        ],
                    },
                    {
                        text: c('sso').t`Devices management`,
                        id: 'devices',
                        available: getIsGlobalSSOAccount(user),
                        keywords: [c('Action').t`Remove all other devices`, c('sso').t`Current device`],
                    },
                    {
                        text: c('Title').t`Session management`,
                        id: 'sessions',
                        available: !isSSOUser,
                        keywords: [
                            c('Action').t`Revoke all other sessions`,
                            c('account_search_index').t`Active sessions`,
                            c('account_search_index').t`Sign out other devices`,
                        ],
                    },
                    {
                        text: c('Title').t`Account monitor`,
                        id: 'logs',
                        available: !isSSOUser,
                        keywords: [
                            c('Log preference').t`Enable detailed events`,
                            c('account_search_index').t`Authentication logs`,
                            c('account_search_index').t`Sign-in history`,
                        ],
                    },
                    {
                        text: c('Title').t`Third-party apps and services`,
                        id: 'third-party',
                        available: showVideoConferenceSection,
                        keywords: [
                            c('Service provider').t`Zoom`,
                            c('Title').t`Connection status`,
                            c('account_search_index').t`Video conferencing`,
                        ],
                    },
                    {
                        text: c('Title').t`Privacy and data collection`,
                        id: 'privacy',
                        keywords: [
                            c('Label').t`Collect usage diagnostics`,
                            c('Label').t`Send crash reports`,
                            c('account_search_index').t`Telemetry`,
                        ],
                    },
                ],
            },
            referral: {
                id: 'referral',
                text: c('Title').t`Refer a friend`,
                title: c('Title').t`Invite friends. Get credits.`,
                description: c('Description').t`Get up to ${credits} in credits by inviting friends to ${BRAND_NAME}.`,
                to: '/referral',
                icon: 'money-bills',
                available: flags.isReferralProgramEnabled,
                subsections: [
                    {
                        id: 'referral-invite-section',
                        keywords: [
                            c('Label').t`Share your referral link`,
                            c('Label').t`Invite via email`,
                            c('account_search_index').t`Referral link`,
                        ],
                    },
                    {
                        text: c('Title').t`Your referrals`,
                        id: 'referral-reward-section',
                        keywords: [
                            c('account_search_index').t`Referral rewards`,
                            c('account_search_index').t`Referral credits`,
                        ],
                    },
                ],
            },
            easySwitch: {
                id: 'easySwitch',
                text: c('Title').t`Import via ${PRODUCT_NAMES.EASY_SWITCH}`,
                description: c('Description')
                    .t`Bring over your email, calendar events, and contacts from another provider.`,
                to: '/easy-switch',
                icon: 'arrow-down-to-square',
                available: showEasySwitchSection,
                subsections: [
                    {
                        id: 'easy-switch',
                        keywords: [
                            c('Info').t`Choose your service to connect with`,
                            c('Action').t`Google`,
                            c('Import provider').t`More import options`,
                        ],
                    },
                    {
                        text: c('Title').t`Imports`,
                        id: 'import-list',
                        keywords: [
                            c('Title header').t`Organization migrations`,
                            c('account_search_index').t`Import history`,
                        ],
                    },
                    {
                        text: c('Title').t`Connected emails`,
                        id: 'forwarding-list',
                        keywords: [
                            c('account_search_index').t`External mailbox`,
                            c('account_search_index').t`Connected addresses`,
                        ],
                    },
                ],
            },
            groupMembership: {
                id: 'groupMembership',
                text: c('Title').t`Group membership`,
                to: '/group-membership',
                icon: 'pass-group',
                available: (memberships?.length ?? 0) > 0,
                subsections: [
                    {
                        id: 'group-membership',
                        keywords: [
                            c('account_search_index').t`Group invitations`,
                            c('account_search_index').t`Leave group`,
                        ],
                    },
                ],
            },
        } satisfies Record<string, SectionConfig>,
    };
};
