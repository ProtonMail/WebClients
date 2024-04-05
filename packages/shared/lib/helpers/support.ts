import { Organization, User, UserModel } from '../interfaces';
import { openNewTab } from './browser';
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

export const openCalendlyLink = (calendlyLink: string, user: User) => {
    const params = new URLSearchParams({
        name: user.DisplayName,
        email: user.Email,
        /**
         * a1 autofills the first custom element in the calendly form
         */
        a1: user.Name,
    });

    openNewTab(`${calendlyLink}?${params.toString()}`);
};
