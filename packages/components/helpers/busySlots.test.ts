import { CALENDAR_SHARE_BUSY_TIME_SLOTS, CALENDAR_TYPE } from '@proton/shared/lib/calendar/constants';

import { getBusySlotSettingValue } from './busySlots';

describe('getBusyTimeSlotCalSettingValue', () => {
    it('should share Personal calendar and user owns it', () => {
        const result = getBusySlotSettingValue(CALENDAR_TYPE.PERSONAL);

        expect(result).toBe(CALENDAR_SHARE_BUSY_TIME_SLOTS.YES);
    });

    it("should NOT share Subscription calendar and user don't own it", () => {
        const result = getBusySlotSettingValue(CALENDAR_TYPE.SUBSCRIPTION);

        expect(result).toBe(CALENDAR_SHARE_BUSY_TIME_SLOTS.NO);
    });

    it('should NOT share Holiday calendar and user owns it', () => {
        const result = getBusySlotSettingValue(CALENDAR_TYPE.HOLIDAYS);

        expect(result).toBe(CALENDAR_SHARE_BUSY_TIME_SLOTS.NO);
    });
});
