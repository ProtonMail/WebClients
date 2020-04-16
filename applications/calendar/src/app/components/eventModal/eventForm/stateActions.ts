import { getInitialDateTimeModel } from './state';
import { addDays, isSameDay } from 'proton-shared/lib/date-fns-utc';
import { EventModel } from '../../../interfaces/EventModel';

const isZeroHoursMinutes = (date: Date) => date.getHours() === 0 && date.getMinutes() === 0;

export const getAllDayCheck = (oldModel: EventModel, isAllDay: boolean) => {
    // If switching to a part day event and there is no time, assume it has never been set.
    if (
        !isAllDay &&
        oldModel.isAllDay &&
        isZeroHoursMinutes(oldModel.start.time) &&
        isZeroHoursMinutes(oldModel.end.time)
    ) {
        const {
            start: { date: startDate, time: startTime },
            end: { date: endDate, time: endTime }
        } = getInitialDateTimeModel(oldModel.initialDate, oldModel.defaultEventDuration, '');

        const newStartDate = oldModel.start.date;
        // If the default time did not yield the same date, assume it starts in one day and spans into the next (max 1 day)
        const newEndDate = !isSameDay(startDate, endDate) ? addDays(oldModel.end.date, 1) : oldModel.end.date;

        return {
            isAllDay,
            start: { tzid: oldModel.initialTzid, date: newStartDate, time: startTime },
            end: { tzid: oldModel.initialTzid, date: newEndDate, time: endTime }
        };
    }

    return {
        isAllDay
    };
};
