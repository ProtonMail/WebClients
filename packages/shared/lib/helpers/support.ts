import { Organization, UserModel } from '../interfaces';
import { hasPhoneSupport } from './organization';

export const canScheduleOrganizationPhoneCalls = ({
    organization,
    user,
    isScheduleCallsEnabled,
}: {
    organization: Organization | undefined;
    user: UserModel;
    isScheduleCallsEnabled: boolean;
}) => {
    /**
     * Feature flag check
     */
    if (!isScheduleCallsEnabled) {
        return false;
    }

    /**
     * User is admin of an org check
     */
    if (user.isFree || !organization || !user.isAdmin) {
        return false;
    }

    /**
     * Admin panel flag check
     */
    return hasPhoneSupport(organization);
};
