import { ThemeColor } from '@proton/colors';
import { APP_NAMES } from '@proton/shared/lib/constants';
import { Address, Organization, Subscription, UserModel } from '@proton/shared/lib/interfaces';

import { getAccountAppRoutes } from '../containers/account/routes';
import { getCalendarAppRoutes } from '../containers/calendar/routes';
import { getDriveAppRoutes } from '../containers/drive/routes';
import { getMailAppRoutes } from '../containers/mail/routes';
import { getOrganizationAppRoutes } from '../containers/organization/routes';
import { getPassAppRoutes } from '../containers/pass/routes';
import { getVpnAppRoutes } from '../containers/vpn/routes';

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
    showThemeSelection: boolean;
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
    showThemeSelection,
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
        }),
        mail: getMailAppRoutes({
            app,
            user,
            addresses,
            organization,
        }),
        calendar: getCalendarAppRoutes({ app }),
        drive: getDriveAppRoutes({ app }),
        pass: getPassAppRoutes({ app }),
        organization: getOrganizationAppRoutes({
            app,
            user,
            organization,
            subscription,
        }),
        vpn: getVpnAppRoutes({ app }),
    };
};

export type Routes = ReturnType<typeof getRoutes>;
