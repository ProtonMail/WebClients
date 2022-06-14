import { Address, Organization, UserModel } from '@proton/shared/lib/interfaces';
import { ThemeColor } from '@proton/colors';
import { getAccountAppRoutes } from '../containers/account/routes';
import { getMailAppRoutes } from '../containers/mail/routes';
import { getCalendarAppRoutes } from '../containers/calendar/routes';
import { getDriveAppRoutes } from '../containers/drive/routes';
import { getOrganizationAppRoutes } from '../containers/organization/routes';
import { getVpnAppRoutes } from '../containers/vpn/routes';

interface Arguments {
    user: UserModel;
    addresses: Address[];
    organization: Organization;
    isSpyTrackerEnabled: boolean;
    isInviteSettingEnabled: boolean;
    isReferralProgramEnabled: boolean;
    isSubscribeCalendarEnabled: boolean;
    isDataRecoveryAvailable: boolean;
    recoveryNotification?: ThemeColor;
    newDomain?: string;
}

export const getRoutes = ({
    user,
    organization,
    addresses,
    isDataRecoveryAvailable,
    isSpyTrackerEnabled,
    isReferralProgramEnabled,
    isSubscribeCalendarEnabled,
    isInviteSettingEnabled,
    recoveryNotification,
    newDomain,
}: Arguments) => {
    return {
        account: getAccountAppRoutes({ user, isDataRecoveryAvailable, isReferralProgramEnabled, recoveryNotification }),
        mail: getMailAppRoutes({ user, addresses, organization, isSpyTrackerEnabled, newDomain }),
        calendar: getCalendarAppRoutes(isSubscribeCalendarEnabled, isInviteSettingEnabled),
        drive: getDriveAppRoutes(),
        organization: getOrganizationAppRoutes({ user, organization }),
        vpn: getVpnAppRoutes(),
    };
};

export type Routes = ReturnType<typeof getRoutes>;
