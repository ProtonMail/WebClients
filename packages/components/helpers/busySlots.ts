import { PLANS } from '@proton/payments';
import { CALENDAR_SHARE_BUSY_TIME_SLOTS, CALENDAR_TYPE } from '@proton/shared/lib/calendar/constants';
import type { Organization } from '@proton/shared/lib/interfaces';

export const isUserEligibleForBusySlots = (organization: Organization): boolean => {
    const isEligible = [
        PLANS.BUNDLE_PRO, // Business
        PLANS.BUNDLE_PRO_2024, // Business
        PLANS.VISIONARY, // Visionary
        PLANS.FAMILY, // Family
        PLANS.DUO, // Duo
        PLANS.MAIL_PRO, // Mail Essentials
        PLANS.MAIL_BUSINESS, // Mail Business
    ].includes(organization.PlanName);

    return !!isEligible;
};

export const getBusySlotSettingValue = (calendarType: CALENDAR_TYPE): CALENDAR_SHARE_BUSY_TIME_SLOTS => {
    if (CALENDAR_TYPE.PERSONAL === calendarType) {
        return CALENDAR_SHARE_BUSY_TIME_SLOTS.YES;
    }

    return CALENDAR_SHARE_BUSY_TIME_SLOTS.NO;
};
