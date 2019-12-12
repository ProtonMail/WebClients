import { getInitialDateTimeModel } from './state';

const isZeroHoursMinutes = (date) => date.getHours() === 0 && date.getMinutes() === 0;

export const getAllDayCheck = (oldModel, isAllDay) => {
    // If switching to a part day event and there is no time, assume it has never been set.
    if (!isAllDay && isZeroHoursMinutes(oldModel.start.time) && isZeroHoursMinutes(oldModel.end.time)) {
        const {
            start: { time: startTime },
            end: { time: endTime }
        } = getInitialDateTimeModel(oldModel.initialDate, oldModel.defaultEventDuration);

        return {
            isAllDay,
            start: { ...oldModel.start, time: startTime },
            end: { ...oldModel.end, time: endTime }
        };
    }

    return {
        isAllDay
    };
};
