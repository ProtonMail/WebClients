import type { ThemeColor } from '@proton/colors';
import { type Subscription } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type {
    Address,
    Group,
    GroupMembershipReturn,
    OrganizationWithSettings,
    UserModel,
} from '@proton/shared/lib/interfaces';

import { getAccountAppRoutes } from '../containers/account/routes';
import { getCalendarAppRoutes } from '../containers/calendar/routes';
import { getDocsAppRoutes } from '../containers/docs/routes';
import { getDriveAppRoutes } from '../containers/drive/routes';
import { getMailAppRoutes } from '../containers/mail/routes';
import { getOrganizationAppRoutes } from '../containers/organization/routes';
import { getPassAppRoutes } from '../containers/pass/routes';
import { getVpnAppRoutes } from '../containers/vpn/routes';
import { getWalletAppRoutes } from '../containers/wallet/routes';

interface Arguments {
    app: APP_NAMES;
    user: UserModel;
    addresses: Address[] | undefined;
    subscription: Subscription | undefined;
    organization: OrganizationWithSettings | undefined;
    isReferralProgramEnabled: boolean;
    isDataRecoveryAvailable: boolean;
    isSessionRecoveryAvailable: boolean;
    recoveryNotification?: ThemeColor;
    isBreachesAccountDashboardEnabled: boolean;
    showVPNDashboard: boolean;
    isUserGroupsFeatureEnabled: boolean;
    showThemeSelection: boolean;
    assistantKillSwitch: boolean;
    canDisplayB2BLogsPass: boolean;
    canDisplayB2BLogsVPN: boolean;
    canDisplayPassReports: boolean;
    memberships: GroupMembershipReturn[] | undefined;
    groups: Group[] | undefined;
    isUserGroupsMembershipFeatureEnabled: boolean;
    canB2BHidePhotos: boolean;
    isB2BDrive: boolean;
    isB2BAuthLogsEnabled: boolean;
    isScribeEnabled: boolean;
    isZoomIntegrationEnabled: boolean;
    isSharedServerFeatureEnabled: boolean;
    isCalendarHotkeysEnabled: boolean;
    isAccessControlEnabled: boolean;
}

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
    isAccessControlEnabled,
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
            isAccessControlEnabled,
        }),
        vpn: getVpnAppRoutes({ app }),
        wallet: getWalletAppRoutes(),
    };
};

export type Routes = ReturnType<typeof getRoutes>;
