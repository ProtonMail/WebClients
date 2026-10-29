import { CALENDAR_SHARE_BUSY_TIME_SLOTS, CALENDAR_TYPE } from '@proton/shared/lib/calendar/constants';

export const getBusySlotSettingValue = (calendarType: CALENDAR_TYPE): CALENDAR_SHARE_BUSY_TIME_SLOTS => {
    if (CALENDAR_TYPE.PERSONAL === calendarType) {
        return CALENDAR_SHARE_BUSY_TIME_SLOTS.YES;
    }

    return CALENDAR_SHARE_BUSY_TIME_SLOTS.NO;
};
