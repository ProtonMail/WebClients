import type { ThemeColor } from '@proton/colors';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type {
    Address,
    Group,
    GroupMembershipReturn,
    OrganizationExtended,
    UserModel,
} from '@proton/shared/lib/interfaces';
import type {
    DriveDashboardVariant,
    MailDashboardVariant,
    MeetDashboardVariant,
    PassDashboardVariant,
    VPNDashboardVariant,
} from '@proton/unleash/UnleashFeatureFlagsVariants';

export type AccountSettings = {
    isDataRecoveryAvailable: boolean;
    isSessionRecoveryAvailable: boolean;
    isReferralProgramEnabled: boolean;
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
    showMailDashboard: boolean;
    showMailDashboardVariant: MailDashboardVariant | 'disabled' | undefined;
    showPassDashboard: boolean;
    showPassDashboardVariant: PassDashboardVariant | 'disabled' | undefined;
    showDriveDashboard: boolean;
    showDriveDashboardVariant: DriveDashboardVariant | 'disabled' | undefined;
    showMeetDashboard: boolean;
    showMeetDashboardVariant: MeetDashboardVariant | 'disabled' | undefined;
    hasPendingInvitations: boolean;
};

// Define the feature flag that are used in the account app
export type Flags = {
    canDisplayB2BLogsPass?: boolean;
    canDisplayB2BLogsVPN?: boolean;
    canDisplayPassReports?: boolean;
    canB2BHidePhotos?: boolean;
    canDisplayNonPrivateEmailPhone?: boolean;
    isUserGroupsFeatureEnabled?: boolean;
    isUserGroupsNoCustomDomainEnabled?: boolean;
    isUserGroupsPassBusinessEnabled?: boolean;
    isScribeEnabled?: boolean;
    isZoomIntegrationEnabled?: boolean;
    isProtonMeetIntegrationEnabled?: boolean;
    isSharedServerFeatureEnabled?: boolean;
    isCryptoPostQuantumOptInEnabled?: boolean;
    isSsoForPbsEnabled?: boolean;
    isRetentionPoliciesEnabled?: boolean;
    isAuthenticatorAvailable?: boolean;
    isOLESEnabled?: boolean;
    isCategoryViewEnabled?: boolean;
    isRecoveryContactsEnabled?: boolean;
    isRolesAndPermissionsEnabled?: boolean;
    isRecoverySettingsRedesignEnabled?: boolean;
    isMnemonicAvailable?: boolean;
    isRecoveryFileAvailable?: boolean;
};

export type OrganizationSettings = {
    organization?: OrganizationExtended;
    isB2BDrive: boolean;
    isB2BTrial: boolean;
    isGroupOwner: boolean | null;
    memberships?: GroupMembershipReturn[];
    groups?: Group[];
};

export type GeneralRouterParams = {
    app: APP_NAMES;
    user: UserModel;
    addresses?: Address[];
    subscription: MaybeFreeSubscription;
    flags: Flags;
};

export type OrganizationRouterParams = GeneralRouterParams & OrganizationSettings;
export type AccountRouterParams = GeneralRouterParams & AccountSettings & OrganizationSettings;

export type AllRouterParams = GeneralRouterParams & {
    accountSettings: AccountSettings;
    organizationSettings: OrganizationSettings;
};
