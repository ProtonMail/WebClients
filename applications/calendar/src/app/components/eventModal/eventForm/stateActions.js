import { fromLocalDate, toUTCDate } from 'proton-shared/lib/date/timezone';
import { getDateTimeState, getInitialDateTimeModel } from './state';

export const getStartTimeChange = ({ start, end }, newStart) => {
    const oldStartDate = toUTCDate({
        ...fromLocalDate(start.date),
        hours: start.time.getHours(),
        minutes: start.time.getMinutes()
    });
    const newStartDate = toUTCDate({
        ...fromLocalDate(newStart.date),
        hours: newStart.time.getHours(),
        minutes: newStart.time.getMinutes()
    });
    const difference = newStartDate - oldStartDate;
    const oldEndDate = toUTCDate({
        ...fromLocalDate(end.date),
        hours: end.time.getHours(),
        minutes: end.time.getMinutes()
    });

    const newEndDate = new Date(+oldEndDate + difference);
    const newEnd = getDateTimeState(newEndDate, end.tzid);

    return {
        start: newStart,
        end: newEnd
    };
};

const isZeroHoursMinutes = (date) => date.getHours() === 0 && date.getMinutes() === 0;

export const getAllDayCheck = (oldModel, isAllDay) => {
    // If switching to a part day event and there is no time, assume it has never been set.
    if (!isAllDay && isZeroHoursMinutes(oldModel.start.time) && isZeroHoursMinutes(oldModel.end.time)) {
        const {
            start: { time: startTime },
            end: { time: endTime }
        } = getInitialDateTimeModel(oldModel.defaultEventDuration);

        return {
            isAllDay,
            start: { ...oldModel.start, time: startTime },
            end: { ...oldModel.end, time: endTime },
        };
    }

    return {
        isAllDay
    };
};

