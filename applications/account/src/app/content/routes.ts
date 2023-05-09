import { ThemeColor } from '@proton/colors';
import { Address, Organization, Subscription, UserModel } from '@proton/shared/lib/interfaces';

import { getAccountAppRoutes } from '../containers/account/routes';
import { getCalendarAppRoutes } from '../containers/calendar/routes';
import { getDriveAppRoutes } from '../containers/drive/routes';
import { getMailAppRoutes } from '../containers/mail/routes';
import { getOrganizationAppRoutes } from '../containers/organization/routes';
import { getPassAppRoutes } from '../containers/pass/routes';
import { getVpnAppRoutes } from '../containers/vpn/routes';

interface Arguments {
    user: UserModel;
    addresses: Address[];
    subscription: Subscription;
    organization: Organization;
    isSpyTrackerEnabled: boolean;
    isReferralProgramEnabled: boolean;
    isSmtpTokenEnabled: boolean;
    isDataRecoveryAvailable: boolean;
    isGmailSyncEnabled: boolean;
    recoveryNotification?: ThemeColor;
    isRevisionsEnabled: boolean;
}

export const getRoutes = ({
    user,
    organization,
    addresses,
    subscription,
    isDataRecoveryAvailable,
    isSpyTrackerEnabled,
    isReferralProgramEnabled,
    isSmtpTokenEnabled,
    isGmailSyncEnabled,
    recoveryNotification,
    isRevisionsEnabled,
}: Arguments) => {
    return {
        account: getAccountAppRoutes({
            user,
            isDataRecoveryAvailable,
            isReferralProgramEnabled,
            recoveryNotification,
            isGmailSyncEnabled,
            organization,
        }),
        mail: getMailAppRoutes({
            user,
            addresses,
            organization,
            isSpyTrackerEnabled,
            isSmtpTokenEnabled,
        }),
        calendar: getCalendarAppRoutes(),
        drive: getDriveAppRoutes({ isRevisionsEnabled }),
        pass: getPassAppRoutes(),
        organization: getOrganizationAppRoutes({ user, organization, subscription }),
        vpn: getVpnAppRoutes(),
    };
};

export type Routes = ReturnType<typeof getRoutes>;
