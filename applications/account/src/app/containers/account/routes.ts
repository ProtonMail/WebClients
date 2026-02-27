import { c } from 'ttag';

import {
    getIsIncomingDelegatedAccessAvailable,
    getIsOutgoingDelegatedAccessAvailable,
} from '@proton/account/delegatedAccess/available';
import type { ThemeColor } from '@proton/colors';
import type { SectionConfig } from '@proton/components';
import {
    Renew,
    type Subscription,
    getHasExternalMemberCapableB2BPlan,
    getHasVpnB2BPlan,
    getIsConsumerPassPlan,
    hasCancellablePlan,
    hasLumo,
    isCancellableOnlyViaSupport,
    isManagedExternally,
} from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import {
    APPS,
    BRAND_NAME,
    DARK_WEB_MONITORING_NAME,
    PRODUCT_NAMES,
    PROTON_SENTINEL_NAME,
} from '@proton/shared/lib/constants';
import { getIsAccountRecoveryAvailable } from '@proton/shared/lib/helpers/recovery';
import type { Address, GroupMembershipReturn, OrganizationExtended, UserModel } from '@proton/shared/lib/interfaces';
import { UserType } from '@proton/shared/lib/interfaces';
import {
    getIsBYOEAccount,
    getIsExternalAccount,
    getIsGlobalSSOAccount,
    getIsSSOVPNOnlyAccount,
} from '@proton/shared/lib/keys';
import {
    getOrganizationDenomination,
    isOrganizationB2B,
    isOrganizationVisionary,
} from '@proton/shared/lib/organization/helper';
import { getHasStorageSplit } from '@proton/shared/lib/user/storage';
import type {
    DriveDashboardVariant,
    MailDashboardVariant,
    MeetDashboardVariant,
    PassDashboardVariant,
    VPNDashboardVariant,
} from '@proton/unleash/UnleashFeatureFlagsVariants';

import { recoveryIds } from './recoveryIds';

function getV2DashboardSections(canPay: boolean, planIsManagedExternally: boolean, hasPendingInvitations: boolean) {
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
        },
    ];
}

function getV1DashboardSections(
    hasSplitStorage: boolean,
    showStorageSection: boolean,
    canPay: boolean,
    assistantKillSwitch: boolean,
    isPaid: boolean,
    isB2BTrial: boolean,
    isMember: boolean,
    cancellablePlan: boolean,
    subscription: Subscription | undefined,
    cancellableOnlyViaSupport: boolean,
    hasExternalMemberCapableB2BPlan: boolean,
    showBusinessActivation: boolean
) {
    return [
        {
            id: 'business-activation',
            available: showBusinessActivation,
        },
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
            available: canPay && !isB2BTrial,
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
                subscription?.Renew === Renew.Enabled &&
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

export const getAccountAppRoutes = ({
    app,
    user,
    isSessionRecoveryAvailable,
    isRecoveryContactsEnabled,
    subscription,
    isDataRecoveryAvailable,
    isReferralProgramEnabled,
    recoveryNotification,
    organization,
    showVPNDashboard,
    showVPNDashboardVariant,
    showThemeSelection,
    assistantKillSwitch,
    memberships,
    isZoomIntegrationEnabled,
    isProtonMeetIntegrationEnabled,
    isB2BTrial,
    referralInfo,
    canDisplayNonPrivateEmailPhone,
    showMailDashboard,
    showPassDashboard,
    showDriveDashboard,
    showMeetDashboard,
    hasPendingInvitations,
    isOLESEnabled,
}: {
    app: APP_NAMES;
    user: UserModel;
    addresses?: Address[];
    subscription?: Subscription;
    isDataRecoveryAvailable: boolean;
    isRecoveryContactsEnabled: boolean;
    isSessionRecoveryAvailable: boolean;
    isReferralProgramEnabled: boolean;
    recoveryNotification?: ThemeColor;
    organization?: OrganizationExtended;
    showVPNDashboard: boolean;
    showVPNDashboardVariant: VPNDashboardVariant | 'disabled' | undefined;
    showThemeSelection: boolean;
    assistantKillSwitch: boolean;
    memberships: GroupMembershipReturn[] | undefined;
    isZoomIntegrationEnabled: boolean;
    isProtonMeetIntegrationEnabled: boolean;
    isB2BTrial: boolean;
    referralInfo: {
        refereeRewardAmount: string;
        referrerRewardAmount: string;
        maxRewardAmount: string;
    };
    canDisplayNonPrivateEmailPhone: boolean;
    showMailDashboard: boolean;
    showMailDashboardVariant: MailDashboardVariant | 'disabled' | undefined;
    showPassDashboard: boolean;
    showPassDashboardVariant: PassDashboardVariant | 'disabled' | undefined;
    showDriveDashboard: boolean;
    showDriveDashboardVariant: DriveDashboardVariant | 'disabled' | undefined;
    showMeetDashboard: boolean;
    showMeetDashboardVariant: MeetDashboardVariant | 'disabled' | undefined;
    hasPendingInvitations: boolean;
    isOLESEnabled: boolean;
}) => {
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
        !(app === APPS.PROTONPASS || app === APPS.PROTONAUTHENTICATOR || app === APPS.PROTONMEET) &&
        !isSSOUser;

    const showVideoConferenceSection =
        (isZoomIntegrationEnabled || isProtonMeetIntegrationEnabled) &&
        !isExternalUser &&
        (organization?.Settings.VideoConferencingEnabled || !hasPaidMail);

    const isAccountRecoveryAvailable = getIsAccountRecoveryAvailable(user);
    const isEmergencyAccessAvailable = user.isPrivate && getIsOutgoingDelegatedAccessAvailable(user);
    const isRecoveryContactsAvailable = isRecoveryContactsEnabled && isEmergencyAccessAvailable;
    const isNonPrivateEmergencyAccessAvailable = !user.isPrivate && getIsIncomingDelegatedAccessAvailable(user);
    const isNonPrivateRecoveryContactsAvailable = isRecoveryContactsEnabled && isNonPrivateEmergencyAccessAvailable;

    const paymentsSectionAvailable =
        isFamilyOrDuoPlanMember ||
        // we do NOT display payment sections to Visionary admins here (display only to members),
        // because they should have them on the dashboard or subscription pages
        (isVisionaryPlan && isMemberProton && isMember);

    const shouldShowDashboard = isFree || canPay || !isMember || (isPaid && canPay);
    // We do not have to check app names here as the hook responsible to populate these values will do it for us.
    const shouldShowV2Dashboard =
        showVPNDashboard || showMailDashboard || showPassDashboard || showDriveDashboard || showMeetDashboard;

    // As VPN dashboard has its own route for v2 dashboard, we need to check for APP and Feature flag to decide between v1 vs v2 dashboard
    const isVPNDashboardEnabled = app === APPS.PROTONVPN_SETTINGS && showVPNDashboard;

    // Show B2B onboarding to admins of B2B orgs when OLES is available
    const showBusinessActivation = isOLESEnabled && isOrganizationB2B(organization) && isAdmin;

    return <const>{
        available: true,
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
                    ? getV2DashboardSections(canPay, planIsManagedExternally, hasPendingInvitations)
                    : getV1DashboardSections(
                          hasSplitStorage,
                          showStorageSection,
                          canPay,
                          assistantKillSwitch,
                          isPaid,
                          isB2BTrial,
                          isMember,
                          cancellablePlan,
                          subscription,
                          cancellableOnlyViaSupport,
                          hasExternalMemberCapableB2BPlan,
                          showBusinessActivation
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
                        variant: 'card',
                    },
                    {
                        text: c('Title').t`Your subscriptions`,
                        id: 'your-subscriptions',
                        available: isPaid && canPay,
                        variant: 'card',
                    },
                    {
                        text: c('Title').t`Payment methods`,
                        id: 'payment-methods',
                        available: canPay,
                        variant: 'card',
                    },
                    {
                        text: c('Title').t`Credits`,
                        id: 'credits',
                        available: canPay,
                        variant: 'card',
                    },
                    {
                        text: c('Title').t`Gift code`,
                        id: 'gift-code',
                        available: canPay,
                        variant: 'card',
                    },
                    {
                        text: c('Title').t`Invoices`,
                        id: 'invoices',
                        available: canPay && !isB2BTrial,
                        variant: 'card',
                    },
                    {
                        text: c('Title').t`Notifications`,
                        id: 'email-subscription',
                        available: !isMember,
                        variant: 'card',
                    },
                    {
                        text: c('Title').t`Cancel subscription`,
                        id: 'cancel-subscription',
                        available:
                            isPaid &&
                            canPay &&
                            cancellablePlan &&
                            subscription?.Renew === Renew.Enabled &&
                            !cancellableOnlyViaSupport,
                        variant: 'card',
                    },
                    {
                        text: c('Title').t`Cancel subscription`,
                        id: 'cancel-via-support',
                        available: isPaid && canPay && cancellableOnlyViaSupport,
                        variant: 'card',
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
                        variant: 'card',
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
            recovery: {
                id: 'recovery',
                text: c('Title').t`Recovery`,
                to: '/recovery',
                icon: 'key',
                available: isAccountRecoveryAvailable,
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
                    {
                        text: c('emergency_access').t`Emergency access`,
                        id: recoveryIds.emergencyAccess,
                        available: isEmergencyAccessAvailable,
                    },
                    {
                        text: c('emergency_access').t`Recovery contacts`,
                        id: recoveryIds.recoveryContacts,
                        available: isRecoveryContactsAvailable,
                    },
                    {
                        text: c('Title').t`Password reset settings`,
                        id: 'password-reset',
                        available: isSessionRecoveryAvailable,
                    },
                ],
            },
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
                        available: !user.isPrivate && !isAccountRecoveryAvailable && canDisplayNonPrivateEmailPhone,
                    },
                    {
                        text: c('Title').t`Account recovery`,
                        id: 'account-recovery',
                        // This is a special section for non-private users that only contains the QR code sign in
                        available: !user.isPrivate && !isAccountRecoveryAvailable,
                    },
                    {
                        text: c('Title').t`Emergency access`,
                        id: 'emergency-access',
                        // This is a special section for non-private users that only contains incoming delegated access
                        available: isNonPrivateEmergencyAccessAvailable,
                    },
                    {
                        text: c('emergency_access').t`Recovery contacts`,
                        id: recoveryIds.recoveryContacts,
                        available: isNonPrivateRecoveryContactsAvailable,
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
                        text: c('Title').t`Activity monitor`,
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
                available: isReferralProgramEnabled,
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
                to: '/easy-switch',
                icon: 'arrow-down-to-square',
                available: showEasySwitchSection,
                subsections: [
                    {
                        id: 'easy-switch',
                    },
                    {
                        text: c('Title').t`History`,
                        id: 'import-list',
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
