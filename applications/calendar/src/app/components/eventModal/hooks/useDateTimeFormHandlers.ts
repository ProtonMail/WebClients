import {
    toUTCDate,
    convertUTCDateTimeToZone,
    fromUTCDate,
    convertZonedDateTimeToUTC,
} from '@proton/shared/lib/date/timezone';
import { startOfDay } from '@proton/shared/lib/date-fns-utc';
import { addDays, isValid } from 'date-fns';
import { DAY } from '@proton/shared/lib/constants';
import { EventModel, DateTimeModel } from '@proton/shared/lib/interfaces/calendar';
import { getDateTimeState, getTimeInUtc } from '../eventForm/time';
import getFrequencyModelChange from '../eventForm/getFrequencyModelChange';

const DEFAULT_MIN_TIME = new Date(Date.UTC(2000, 0, 1, 0, 0));

interface UseDateTimeFormHandlersArgs {
    model: EventModel;
    setModel: (value: EventModel) => void;
}

const useDateTimeFormHandlers = ({ model, setModel }: UseDateTimeFormHandlersArgs) => {
    const { isAllDay, start, end } = model;

    const startUtcDate = getTimeInUtc(start, false);
    const endUtcDate = getTimeInUtc(end, false);

    const isDuration = +endUtcDate - +startUtcDate < DAY;
    const minEndTimeInTimezone = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(startUtcDate), end.tzid));
    const { time: minEndTime } = getDateTimeState(isDuration ? minEndTimeInTimezone : DEFAULT_MIN_TIME, '');

    const getMinEndDate = () => {
        const { date: minDate } = getDateTimeState(minEndTimeInTimezone, '');
        // If the minDate with the currently selected end time would lead to an error, don't allow it to be selected
        const minTimeUtcDate = getTimeInUtc({ ...end, date: minDate, time: end.time }, false);
        return startUtcDate > minTimeUtcDate ? addDays(minDate, 1) : minDate;
    };

    const minEndDate = isAllDay ? start.date : getMinEndDate();

    const getStartChange = (newStart: DateTimeModel) => {
        const newStartUtcDate = getTimeInUtc(newStart, false);
        const diffInMs = +newStartUtcDate - +startUtcDate;

        const newEndDate = new Date(+endUtcDate + diffInMs);
        const endLocalDate = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(newEndDate), end.tzid));
        const newEnd = getDateTimeState(endLocalDate, end.tzid);

        return {
            start: newStart,
            end: newEnd,
        };
    };

    const getEndTimeChange = (newTime: Date) => {
        const diffMs = +newTime - +minEndTime;

        const endTimeInTimezone = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(endUtcDate), end.tzid));

        const minEndUtcDateBase = isDuration ? minEndTimeInTimezone : startOfDay(endTimeInTimezone);

        const endUtcDateBase = toUTCDate(convertZonedDateTimeToUTC(fromUTCDate(minEndUtcDateBase), end.tzid));
        const newEndUtcDate = new Date(+endUtcDateBase + diffMs);
        const endLocalDate = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(newEndUtcDate), end.tzid));

        return getDateTimeState(endLocalDate, end.tzid);
    };

    const handleChangeStartDate = (newDate: Date | undefined) => {
        if (!newDate || !isValid(newDate)) {
            return;
        }
        const newStart = { ...start, date: newDate };
        setModel({
            ...model,
            frequencyModel: getFrequencyModelChange(start, newStart, model.frequencyModel),
            ...getStartChange(newStart),
        });
    };

    const handleChangeStartTime = (newTime: Date) => {
        setModel({
            ...model,
            ...getStartChange({
                ...start,
                time: newTime,
            }),
        });
    };

    const handleEndUpdate = (newEnd: DateTimeModel) => {
        setModel({
            ...model,
            end: newEnd,
        });
    };

    const handleChangeEndDate = (newDate: Date | undefined) => {
        if (!newDate || !isValid(newDate)) {
            return;
        }
        handleEndUpdate({
            ...end,
            date: newDate,
        });
    };

    const handleChangeEndTime = (newTime: Date) => {
        handleEndUpdate(getEndTimeChange(newTime));
    };
    return {
        handleChangeStartDate,
        handleChangeStartTime,
        handleChangeEndDate,
        handleChangeEndTime,
        minEndDate,
        minEndTime,
        isDuration,
    };
};

export default useDateTimeFormHandlers;
