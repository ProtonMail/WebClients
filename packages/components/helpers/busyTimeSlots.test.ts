import { CALENDAR_SHARE_BUSY_TIME_SLOTS, CALENDAR_TYPE } from '@proton/shared/lib/calendar/constants';
import { PLANS } from '@proton/shared/lib/constants';
import { Organization } from '@proton/shared/lib/interfaces';

import { getBusyTimeSlotCalSettingValue, isUserEligibleForBusyTimeSlots } from './busyTimeSlots';

describe('isUserEligibleForBusyTimeSlots', () => {
    it('should return true if the user has a bundle pro organisation', () => {
        const organisation = {
            PlanName: PLANS.BUNDLE_PRO,
        } as Organization;

        const result = isUserEligibleForBusyTimeSlots(organisation);

        expect(result).toBe(true);
    });

    it('should return true if the user has an enterprise organisation', () => {
        const organisation = {
            PlanName: PLANS.ENTERPRISE,
        } as Organization;

        const result = isUserEligibleForBusyTimeSlots(organisation);

        expect(result).toBe(true);
    });

    it('should return true if the user has a family organisation', () => {
        const organisation = {
            PlanName: PLANS.FAMILY,
        } as Organization;

        const result = isUserEligibleForBusyTimeSlots(organisation);

        expect(result).toBe(true);
    });

    it('should return true if the user has a visionary organisation', () => {
        const organisation = {
            PlanName: PLANS.NEW_VISIONARY,
        } as Organization;

        const result = isUserEligibleForBusyTimeSlots(organisation);

        expect(result).toBe(true);
    });

    it('should return false if the user does not have an eligible organisation', () => {
        const organisation = {
            PlanName: PLANS.FREE,
        } as Organization;

        const result = isUserEligibleForBusyTimeSlots(organisation);

        expect(result).toBe(false);
    });
});

describe('getBusyTimeSlotCalSettingValue', () => {
    it('should share Personal calendar and user owns it', () => {
        const result = getBusyTimeSlotCalSettingValue(CALENDAR_TYPE.PERSONAL);

        expect(result).toBe(CALENDAR_SHARE_BUSY_TIME_SLOTS.YES);
    });

    it("should NOT share Subscription calendar and user don't own it", () => {
        const result = getBusyTimeSlotCalSettingValue(CALENDAR_TYPE.SUBSCRIPTION);

        expect(result).toBe(CALENDAR_SHARE_BUSY_TIME_SLOTS.NO);
    });

    it('should NOT share Holiday calendar and user owns it', () => {
        const result = getBusyTimeSlotCalSettingValue(CALENDAR_TYPE.HOLIDAYS);

        expect(result).toBe(CALENDAR_SHARE_BUSY_TIME_SLOTS.NO);
    });
});
