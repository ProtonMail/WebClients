import { CalendarUserSettingsModel } from '../../models';
import { STATUS } from '../../models/cache';

const calendarUserSettingsModelKey = CalendarUserSettingsModel.key;
export const updateCalendarsUserSettings = (cache: Map<string, any>, data: any) => {
    if (data[calendarUserSettingsModelKey]) {
        const { value: oldValue, status } = cache.get(calendarUserSettingsModelKey) || {};
        if (status === STATUS.RESOLVED) {
            cache.set(calendarUserSettingsModelKey, {
                status: STATUS.RESOLVED,
                value: CalendarUserSettingsModel.update(oldValue, data[calendarUserSettingsModelKey]),
            });
        }
    }
};
