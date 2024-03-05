import { CALENDAR_SHARE_BUSY_TIME_SLOTS, CALENDAR_TYPE } from '@proton/shared/lib/calendar/constants';
import { PLANS } from '@proton/shared/lib/constants';
import { Organization } from '@proton/shared/lib/interfaces';

export const isUserEligibleForBusyTimeSlots = (organization: Organization): boolean => {
    const isEligible = [
        PLANS.BUNDLE_PRO, // Business
        PLANS.NEW_VISIONARY, // Visionary
        PLANS.FAMILY, // Family
        PLANS.ENTERPRISE, // Enterprise
        PLANS.MAIL_PRO, // Mail Essentials
    ].includes(organization.PlanName);

    return !!isEligible;
};

export const getBusyTimeSlotCalSettingValue = (calendarType: CALENDAR_TYPE): CALENDAR_SHARE_BUSY_TIME_SLOTS => {
    if (CALENDAR_TYPE.PERSONAL === calendarType) {
        return CALENDAR_SHARE_BUSY_TIME_SLOTS.YES;
    }

    return CALENDAR_SHARE_BUSY_TIME_SLOTS.NO;
};
