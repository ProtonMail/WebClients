import { getAccountAppRoutes } from '../containers/account/routes';
import { getCalendarAppRoutes } from '../containers/calendar/routes';
import { getDocsAppRoutes } from '../containers/docs/routes';
import { getDriveAppRoutes } from '../containers/drive/routes';
import { getMailAppRoutes } from '../containers/mail/routes';
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
    isBreachesAccountDashboardEnabled,
    showVPNDashboard,
    isUserGroupsFeatureEnabled,
    showThemeSelection,
    assistantKillSwitch,
    canDisplayB2BLogsPass,
    canDisplayB2BLogsVPN,
    canDisplayPassReports,
    memberships,
    groups,
    isUserGroupsMembershipFeatureEnabled,
    canB2BHidePhotos,
    isB2BDrive,
    isB2BAuthLogsEnabled,
    isScribeEnabled,
    isZoomIntegrationEnabled,
    isCalendarHotkeysEnabled,
    isSharedServerFeatureEnabled,
    isPasswordPolicyEnabled,
    isB2BTrial,
}: Arguments) => {
    return {
        account: getAccountAppRoutes({
            app,
            user,
            subscription,
            addresses,
            isDataRecoveryAvailable,
            isSessionRecoveryAvailable,
            isReferralProgramEnabled,
            recoveryNotification,
            organization,
            isBreachesAccountDashboardEnabled,
            showVPNDashboard,
            showThemeSelection,
            assistantKillSwitch,
            isUserGroupsMembershipFeatureEnabled,
            memberships,
            isZoomIntegrationEnabled,
            isB2BTrial,
        }),
        mail: getMailAppRoutes({
            app,
            user,
            addresses,
            organization,
        }),
        calendar: getCalendarAppRoutes({ app, user, organization, isZoomIntegrationEnabled, isCalendarHotkeysEnabled }),
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
            isB2BAuthLogsEnabled,
            groups,
            isScribeEnabled,
            isZoomIntegrationEnabled,
            isSharedServerFeatureEnabled,
            isPasswordPolicyEnabled,
        }),
        vpn: getVpnAppRoutes({ app }),
        wallet: getWalletAppRoutes(),
    };
};

export type Routes = ReturnType<typeof getRoutes>;
