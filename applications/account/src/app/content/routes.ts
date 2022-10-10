import { ThemeColor } from '@proton/colors';
import { Address, Organization, UserModel } from '@proton/shared/lib/interfaces';

import { getAccountAppRoutes } from '../containers/account/routes';
import { getCalendarAppRoutes } from '../containers/calendar/routes';
import { getDriveAppRoutes } from '../containers/drive/routes';
import { getMailAppRoutes } from '../containers/mail/routes';
import { getOrganizationAppRoutes } from '../containers/organization/routes';
import { getVpnAppRoutes } from '../containers/vpn/routes';

interface Arguments {
    user: UserModel;
    addresses: Address[];
    organization: Organization;
    isSpyTrackerEnabled: boolean;
    isInviteSettingEnabled: boolean;
    isReferralProgramEnabled: boolean;
    isBulkUserUploadEnabled: boolean;
    isShowSenderImagesEnabled: boolean;
    isSubscribeCalendarEnabled: boolean;
    isDataRecoveryAvailable: boolean;
    recoveryNotification?: ThemeColor;
}

export const getRoutes = ({
    user,
    organization,
    addresses,
    isDataRecoveryAvailable,
    isSpyTrackerEnabled,
    isReferralProgramEnabled,
    isBulkUserUploadEnabled,
    isShowSenderImagesEnabled,
    isSubscribeCalendarEnabled,
    isInviteSettingEnabled,
    recoveryNotification,
}: Arguments) => {
    return {
        account: getAccountAppRoutes({ user, isDataRecoveryAvailable, isReferralProgramEnabled, recoveryNotification }),
        mail: getMailAppRoutes({ user, addresses, organization, isSpyTrackerEnabled, isShowSenderImagesEnabled }),
        calendar: getCalendarAppRoutes(isSubscribeCalendarEnabled, isInviteSettingEnabled),
        drive: getDriveAppRoutes(),
        organization: getOrganizationAppRoutes({ user, organization, isBulkUserUploadEnabled }),
        vpn: getVpnAppRoutes(),
    };
};

export type Routes = ReturnType<typeof getRoutes>;
