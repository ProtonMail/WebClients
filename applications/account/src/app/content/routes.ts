import { getAccountAppRoutes } from '../containers/account/routes';
import { getAuthenticatorAppRoutes } from '../containers/authenticator/routes';
import { getCalendarAppRoutes } from '../containers/calendar/routes';
import { getDocsAppRoutes } from '../containers/docs/routes';
import { getDriveAppRoutes } from '../containers/drive/routes';
import { getMailAppRoutes } from '../containers/mail/routes';
import { getMeetAppRoutes } from '../containers/meet/routes';
import { getOrganizationAppRoutes } from '../containers/organization/routes';
import { getPassAppRoutes } from '../containers/pass/routes';
import { getVpnAppRoutes } from '../containers/vpn/routes';
import { getWalletAppRoutes } from '../containers/wallet/routes';

type Arguments = Parameters<typeof getAccountAppRoutes>[0] &
    Parameters<typeof getMailAppRoutes>[0] &
    Parameters<typeof getCalendarAppRoutes>[0] &
    Parameters<typeof getDriveAppRoutes>[0] &
    Parameters<typeof getPassAppRoutes>[0] &
    Parameters<typeof getVpnAppRoutes>[0] &
    Parameters<typeof getAuthenticatorAppRoutes>[0] &
    Parameters<typeof getOrganizationAppRoutes>[0];

export const getRoutes = ({
    app,
    user,
    organization,
    addresses,
    subscription,
    isDataRecoveryAvailable,
    isSessionRecoveryAvailable,
    isReferralProgramEnabled,
    recoveryNotification,
    isRecoveryContactsEnabled,
    showVPNDashboard,
    showVPNDashboardVariant,
    isUserGroupsFeatureEnabled,
    isUserGroupsNoCustomDomainEnabled,
    showThemeSelection,
    assistantKillSwitch,
    canDisplayB2BLogsPass,
    canDisplayB2BLogsVPN,
    canDisplayPassReports,
    memberships,
    groups,
    canB2BHidePhotos,
    isB2BDrive,
    isB2BAuthLogsEnabled,
    isScribeEnabled,
    isZoomIntegrationEnabled,
    isProtonMeetIntegrationEnabled,
    isSharedServerFeatureEnabled,
    isCryptoPostQuantumOptInEnabled,
    isB2BTrial,
    isSsoForPbsEnabled,
    isRetentionPoliciesEnabled,
    referralInfo,
    canDisplayNonPrivateEmailPhone,
    showMailDashboard,
    showMailDashboardVariant,
    showPassDashboard,
    showPassDashboardVariant,
    showDriveDashboard,
    showDriveDashboardVariant,
    showMeetDashboard,
    showMeetDashboardVariant,
    isAuthenticatorAvailable,
    hasPendingInvitations,
    isGroupOwner,
    isOLESEnabled,
    isCategoryViewEnabled,
    isRolesAndPermissionsEnabled,
}: Arguments) => {
    return {
        account: getAccountAppRoutes({
            app,
            user,
            subscription,
            addresses,
            isDataRecoveryAvailable,
            isSessionRecoveryAvailable,
            isRecoveryContactsEnabled,
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
            showMailDashboardVariant,
            showPassDashboard,
            showPassDashboardVariant,
            showDriveDashboard,
            showDriveDashboardVariant,
            showMeetDashboard,
            showMeetDashboardVariant,
            hasPendingInvitations,
            isOLESEnabled,
        }),
        mail: getMailAppRoutes({
            app,
            user,
            addresses,
            organization,
            isCryptoPostQuantumOptInEnabled,
            isCategoryViewEnabled,
        }),
        calendar: getCalendarAppRoutes({
            app,
            user,
            organization,
            isZoomIntegrationEnabled,
            isProtonMeetIntegrationEnabled,
        }),
        drive: getDriveAppRoutes({ app, isB2BDrive, canB2BHidePhotos }),
        docs: getDocsAppRoutes({ app }),
        pass: getPassAppRoutes({ app, user, organization, subscription, canDisplayB2BLogsPass, canDisplayPassReports }),
        organization: getOrganizationAppRoutes({
            app,
            user,
            organization,
            subscription,
            canDisplayB2BLogsVPN,
            isUserGroupsFeatureEnabled,
            isUserGroupsNoCustomDomainEnabled,
            isB2BAuthLogsEnabled,
            groups,
            isScribeEnabled,
            isZoomIntegrationEnabled,
            isProtonMeetIntegrationEnabled,
            isSharedServerFeatureEnabled,
            isSsoForPbsEnabled,
            isRetentionPoliciesEnabled,
            isOLESEnabled,
            isGroupOwner,
            isRolesAndPermissionsEnabled,
        }),
        vpn: getVpnAppRoutes({ app }),
        wallet: getWalletAppRoutes(),
        meet: getMeetAppRoutes(),
        authenticator: getAuthenticatorAppRoutes({ isAuthenticatorAvailable }),
    };
};

export type Routes = ReturnType<typeof getRoutes>;
