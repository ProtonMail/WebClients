import type { ThemeColor } from '@proton/colors';
import type { EntitlementChecks } from '@proton/payments/core/entitlements/resolver';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type {
    Address,
    Group,
    GroupMembershipReturn,
    OrgPermissions,
    OrganizationExtended,
    UserModel,
} from '@proton/shared/lib/interfaces';
import type { DriveDashboardVariant, VPNDashboardVariant } from '@proton/unleash/UnleashFeatureFlagsVariants';

export type AccountRecoveryRouterFlags = {
    isAccountRecoveryAvailable: boolean;
    isMnemonicAvailable: boolean;
    isRecoveryFileAvailable: boolean;
    isDataRecoveryAvailable: boolean;
    isSessionRecoveryAvailable: boolean;
    isDelegatedAccessAvailable: boolean;
    isNonPrivateDelegatedAccessAvailable: boolean;
    isRecoveryScoreBannerAvailable: boolean;
};

export type AccountSettingsRouterParams = {
    accountRecoveryRouterFlags: AccountRecoveryRouterFlags;
    recoveryNotification?: ThemeColor;
    showVPNDashboard: boolean;
    showVPNDashboardVariant: VPNDashboardVariant | 'disabled' | undefined;
    showThemeSelection: boolean;
    assistantKillSwitch: boolean;
    referralInfo: {
        refereeRewardAmount: string;
        referrerRewardAmount: string;
        maxRewardAmount: string;
    };
    showDashboard: boolean;
    showDriveDashboard: boolean;
    showDriveDashboardVariant: DriveDashboardVariant | 'disabled' | undefined;
    showGenericDashboard: boolean;
    hasPendingInvitations: boolean;
};

// Define the feature flag that are used in the account app
export type Flags = {
    canDisplayNonPrivateEmailPhone: boolean;
    isUserGroupsFeatureEnabled: boolean;
    isUserGroupsNoCustomDomainEnabled: boolean;
    isUserGroupsPassBusinessEnabled: boolean;
    isScribeEnabled: boolean;
    isZoomIntegrationEnabled: boolean;
    isProtonMeetIntegrationEnabled: boolean;
    isSharedServerFeatureEnabled: boolean;
    isAlwaysOnVpnEnabled: boolean;
    isCryptoPostQuantumOptInEnabled: boolean;
    isSsoForPbsEnabled: boolean;
    isRetentionPoliciesEnabled: boolean;
    isPasswordRemindersOrgEnabled: boolean;
    isAuthenticatorAvailable: boolean;
    isCategoryViewEnabled: boolean;
    isMspEnabled: boolean;
    isReferralProgramEnabled: boolean;
};

export type OrganizationSettingsRouterParams = {
    organization: OrganizationExtended | undefined;
    isB2BDrive: boolean;
    isGroupOwner: boolean | null;
    memberships: GroupMembershipReturn[] | undefined;
    groups: Group[] | undefined;
    permissions: OrgPermissions;
};

export type GeneralRouterParams = {
    app: APP_NAMES;
    user: UserModel;
    addresses?: Address[];
    subscription: MaybeFreeSubscription;
    entitlements: EntitlementChecks;
    flags: Flags;
};

export type OrganizationRouterParams = GeneralRouterParams & OrganizationSettingsRouterParams;
export type AccountRouterParams = GeneralRouterParams & AccountSettingsRouterParams & OrganizationSettingsRouterParams;

export type AllRouterParams = GeneralRouterParams & {
    accountSettingsRouterParams: AccountSettingsRouterParams;
    organizationSettingsRouterParams: OrganizationSettingsRouterParams;
};
