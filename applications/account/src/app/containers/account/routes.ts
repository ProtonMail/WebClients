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
        },
        {
            text: c('Title').t`Your plan`,
            invisibleTitle: true,
            id: 'YourPlan',
        },
        {
            text: c('Title').t`Compare plans`,
            invisibleTitle: true,
            id: 'YourPlanUpsell',
            available: canPay && !planIsManagedExternally,
        },
        {
            text: c('Title').t`Downloads`,
            invisibleTitle: true,
            available: app !== APPS.PROTONACCOUNT,
            id: 'DownloadAndInfo',
        },
        {
            text: c('Title').t`Also in your plan`,
            invisibleTitle: true,
            id: 'AlsoInYourPlan',
        },
        {
            text: c('Title').t`Deep dive into email blog posts`,
            invisibleTitle: true,
            id: 'Blog',
            available: app !== APPS.PROTONACCOUNT && app !== APPS.PROTONMEET,
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
        },
        {
            text: hasSplitStorage && showStorageSection ? c('Title').t`Your plan` : undefined,
            id: 'your-plan',
            available: canPay,
        },
        {
            id: 'assistant-toggle',
            available: !assistantKillSwitch,
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
            text: c('Title').t`Notifications`,
            id: 'email-subscription',
            available: !isMember,
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
        },
        {
            text: c('Title').t`Cancel subscription`,
            id: 'cancel-via-support',
            available: isPaid && canPay && cancellableOnlyViaSupport,
        },
        {
            text: c('Title').t`Cancel subscription`,
            id: 'downgrade-account',
            available:
                isPaid && canPay && !cancellablePlan && !hasExternalMemberCapableB2BPlan && !cancellableOnlyViaSupport,
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
                },
                phone: {
                    id: 'phone',
                    text: c('Title').t`SMS verification`,
                    to: '/phone',
                    variant: SettingsLayoutVariant.Card,
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
                },
                backupFile: {
                    id: 'backup-file',
                    text: c('Title').t`Recovery file`,
                    to: '/backup-file',
                    available: isRecoveryFileAvailable,
                    variant: SettingsLayoutVariant.Card,
                },
                recoveryContacts: {
                    id: 'recovery-contacts',
                    text: c('emergency_access').t`Data recovery contacts`,
                    to: '/recovery-contacts',
                    available: isDelegatedAccessAvailable,
                    variant: SettingsLayoutVariant.Card,
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
                },
                signedInReset: {
                    id: 'signed-in-reset',
                    text: c('Title').t`Signed-in reset`,
                    to: '/signed-in-reset',
                    available: isSessionRecoveryAvailable,
                    variant: SettingsLayoutVariant.Card,
                },
                qrCode: {
                    id: 'qr-code',
                    text: c('Title').t`QR code sign-in`,
                    to: '/qr-code',
                    variant: SettingsLayoutVariant.Card,
                },
                emergencyContacts: {
                    id: 'emergency-contacts',
                    text: c('emergency_access').t`Emergency access`,
                    to: '/emergency-contacts',
                    available: isDelegatedAccessAvailable,
                    variant: SettingsLayoutVariant.Card,
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
            },
            {
                text: '',
                id: 'password-reminder',
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
                    },
                    {
                        text: c('Title').t`Upgrade your privacy`,
                        invisibleTitle: true,
                        id: 'YourPlanUpsellsSectionV2',
                        available: canPay && !planIsManagedExternally,
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
                    },
                    {
                        id: 'assistant-toggle',
                        available: !assistantKillSwitch,
                        variant: SettingsLayoutVariant.Card,
                    },
                    {
                        text: c('Title').t`Your subscriptions`,
                        id: 'your-subscriptions',
                        available: isPaid && canPay,
                        variant: SettingsLayoutVariant.Card,
                    },
                    {
                        text: c('Title').t`Payment methods`,
                        id: 'payment-methods',
                        available: canPay,
                        variant: SettingsLayoutVariant.Card,
                    },
                    {
                        text: c('Title').t`Credits`,
                        id: 'credits',
                        available: canPay,
                        variant: SettingsLayoutVariant.Card,
                    },
                    {
                        text: c('Title').t`Gift code`,
                        id: 'gift-code',
                        available: canPay,
                        variant: SettingsLayoutVariant.Card,
                    },
                    {
                        text: c('Title').t`Invoices`,
                        id: 'invoices',
                        available: canPay,
                        variant: SettingsLayoutVariant.Card,
                    },
                    {
                        text: c('Title').t`Notifications`,
                        id: 'email-subscription',
                        available: !isMember,
                        variant: SettingsLayoutVariant.Card,
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
                    },
                    {
                        text: c('Title').t`Cancel subscription`,
                        id: 'cancel-via-support',
                        available: isPaid && canPay && cancellableOnlyViaSupport,
                        variant: SettingsLayoutVariant.Card,
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
                    },
                    {
                        text: c('Title').t`Two-factor authentication`,
                        id: 'two-fa',
                        available: !user.Flags.sso,
                    },
                    {
                        text: c('Title').t`Notifications`,
                        id: 'notifications',
                        available:
                            !user.isPrivate &&
                            !accountRecoveryRouterFlags.isAccountRecoveryAvailable &&
                            flags.canDisplayNonPrivateEmailPhone,
                    },
                    {
                        text: c('Title').t`Account recovery`,
                        id: 'account-recovery',
                        // This is a special section for non-private users that only contains the QR code sign in
                        available: !user.isPrivate && !accountRecoveryRouterFlags.isAccountRecoveryAvailable,
                    },
                    {
                        text: c('Title').t`Emergency access`,
                        id: 'emergency-access',
                        // This is a special section for non-private users that only contains incoming delegated access
                        available: accountRecoveryRouterFlags.isNonPrivateDelegatedAccessAvailable,
                    },
                    {
                        text: c('emergency_access').t`Data recovery contacts`,
                        id: recoveryIds.recoveryContacts,
                        available: accountRecoveryRouterFlags.isNonPrivateDelegatedAccessAvailable,
                    },
                    {
                        text: isFamilyOrg
                            ? c('familyOffer_2023:Title').t`Family`
                            : c('familyOffer_2023: Title').t`Your account's benefits`,
                        id: 'family-plan',
                        // We don't want admin to leave the organization, they need first to be demoted
                        available: !isAdmin && (isFamilyOrg || (isVisionaryPlan && isMemberProton)),
                    },
                    //Family members or Proton account that are part of Visionary don't have access to the dashboard, display the payment methods for them here
                    {
                        text: c('Title').t`Payment methods`,
                        id: 'payment-methods',
                        available: paymentsSectionAvailable,
                    },
                    //Family members or Proton account that are part of Visionary don't have access to the dashboard, display the credits for them here
                    {
                        text: c('Title').t`Credits`,
                        id: 'credits',
                        available: paymentsSectionAvailable,
                    },
                    //Family members or Proton account that are part of Visionary don't have access to the dashboard, display the invoices for them here
                    {
                        text: c('Title').t`Invoices`,
                        id: 'invoices',
                        available: paymentsSectionAvailable,
                    },
                    {
                        text: c('Title').t`Delete account`,
                        id: 'delete',
                        available: user.isSelf && (user.Type === UserType.PROTON || user.Type === UserType.EXTERNAL),
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
                    },
                    {
                        text: c('Title').t`Accessibility`,
                        id: 'accessibility',
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
                    },
                    {
                        text: DARK_WEB_MONITORING_NAME,
                        id: 'breaches',
                        available: !isSSOUser,
                    },
                    {
                        text: c('sso').t`Devices management`,
                        id: 'devices',
                        available: getIsGlobalSSOAccount(user),
                    },
                    {
                        text: c('Title').t`Session management`,
                        id: 'sessions',
                        available: !isSSOUser,
                    },
                    {
                        text: c('Title').t`Account monitor`,
                        id: 'logs',
                        available: !isSSOUser,
                    },
                    {
                        text: c('Title').t`Third-party apps and services`,
                        id: 'third-party',
                        available: showVideoConferenceSection,
                    },
                    {
                        text: c('Title').t`Privacy and data collection`,
                        id: 'privacy',
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
                    },
                    {
                        text: c('Title').t`Your referrals`,
                        id: 'referral-reward-section',
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
                    },
                    {
                        text: c('Title').t`Imports`,
                        id: 'import-list',
                    },
                    {
                        text: c('Title').t`Connected emails`,
                        id: 'forwarding-list',
                    },
                ],
            },
            groupMembership: {
                id: 'groupMembership',
                text: c('Title').t`Group membership`,
                to: '/group-membership',
                icon: 'pass-group',
                available: (memberships?.length ?? 0) > 0,
                subsections: [{ id: 'group-membership' }],
            },
        } satisfies Record<string, SectionConfig>,
    };
};
