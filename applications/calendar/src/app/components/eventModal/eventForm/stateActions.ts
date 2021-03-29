import { addDays, isSameDay } from 'proton-shared/lib/date-fns-utc';
import { getInitialDateTimeModel } from './state';
import { EventModel } from '../../../interfaces/EventModel';
import { getTimeInUtc } from './time';

const isZeroHoursMinutes = (date: Date) => date.getHours() === 0 && date.getMinutes() === 0;

export const getAllDayCheck = (oldModel: EventModel, isAllDay: boolean) => {
    if (!isAllDay && oldModel.isAllDay) {
        // If switching to a part day event and there is no time, assume it has never been set.
        if (isZeroHoursMinutes(oldModel.start.time) && isZeroHoursMinutes(oldModel.end.time)) {
            const {
                start: { date: startDate, time: startTime },
                end: { date: endDate, time: endTime },
            } = getInitialDateTimeModel(oldModel.initialDate, oldModel.defaultEventDuration, '');

            const newStartDate = oldModel.start.date;
            // If the default time did not yield the same date, assume it starts in one day and spans into the next (max 1 day)
            const newEndDate = !isSameDay(startDate, endDate) ? addDays(oldModel.end.date, 1) : oldModel.end.date;

            return {
                isAllDay,
                start: { tzid: oldModel.initialTzid, date: newStartDate, time: startTime },
                end: { tzid: oldModel.initialTzid, date: newEndDate, time: endTime },
            };
        }
        // If switching to a part day event and there is time, make sure the end time is not earlier than the start time
        const startUtcDate = getTimeInUtc(oldModel.start, isAllDay);
        const endUtcDate = getTimeInUtc(oldModel.end, isAllDay);
        if (+endUtcDate < +startUtcDate) {
            return {
                isAllDay,
                end: { tzid: oldModel.initialTzid, date: oldModel.start.date, time: oldModel.start.time },
            };
        }
    }

    return {
        isAllDay,
    };
};
