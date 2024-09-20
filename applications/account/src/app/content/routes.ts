import type { ThemeColor } from '@proton/colors';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type {
    Address,
    GroupMembershipReturn,
    Organization,
    Subscription,
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
    organization: Organization | undefined;
    isReferralProgramEnabled: boolean;
    isDataRecoveryAvailable: boolean;
    isSessionRecoveryAvailable: boolean;
    recoveryNotification?: ThemeColor;
    isBreachesAccountDashboardEnabled: boolean;
    isUserGroupsFeatureEnabled: boolean;
    showThemeSelection: boolean;
    assistantKillSwitch: boolean;
    canDisplayB2BLogsPass: boolean;
    canDisplayB2BLogsVPN: boolean;
    memberships: GroupMembershipReturn[] | undefined;
    isUserGroupsMembershipFeatureEnabled: boolean;
    isB2BDrive: boolean;
    isB2BAuthLogsEnabled: boolean;
    showGatewaysForBundlePlan: boolean;
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
    isUserGroupsFeatureEnabled,
    showThemeSelection,
    assistantKillSwitch,
    canDisplayB2BLogsPass,
    canDisplayB2BLogsVPN,
    memberships,
    isUserGroupsMembershipFeatureEnabled,
    isB2BDrive,
    isB2BAuthLogsEnabled,
    showGatewaysForBundlePlan,
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
            showThemeSelection,
            assistantKillSwitch,
            isUserGroupsMembershipFeatureEnabled,
            memberships,
        }),
        mail: getMailAppRoutes({
            app,
            user,
            addresses,
            organization,
        }),
        calendar: getCalendarAppRoutes({ app }),
        drive: getDriveAppRoutes({ app, isB2BDrive }),
        docs: getDocsAppRoutes(),
        pass: getPassAppRoutes({ app, user, organization, subscription, canDisplayB2BLogsPass }),
        organization: getOrganizationAppRoutes({
            app,
            user,
            organization,
            subscription,
            canDisplayB2BLogsVPN,
            isUserGroupsFeatureEnabled,
            isB2BAuthLogsEnabled,
            showGatewaysForBundlePlan,
        }),
        vpn: getVpnAppRoutes({ app }),
        wallet: getWalletAppRoutes(),
    };
};

export type Routes = ReturnType<typeof getRoutes>;
