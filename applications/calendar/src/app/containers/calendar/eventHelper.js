import {
    convertUTCDateTimeToZone,
    convertZonedDateTimeToUTC,
    fromUTCDate,
    toUTCDate
} from 'proton-shared/lib/date/timezone';
import { differenceInHours } from 'date-fns';
import { max } from 'proton-shared/lib/date-fns-utc';
import { getDateTimeState, getTimeInUtc } from '../../components/eventModal/eventForm/time';
import { getFrequencyModelChange } from '../../components/eventModal/eventForm/propertiesToModel';

const modelToEventProperties = (oldTemporaryEvent, { start, end, isAllDay }, tzid) => {
    // If unrelevant things were changed, like title or description
    if (
        oldTemporaryEvent &&
        oldTemporaryEvent.tmpData &&
        oldTemporaryEvent.tmpData.start === start &&
        oldTemporaryEvent.tmpData.end === end &&
        oldTemporaryEvent.tmpData.isAllDay === isAllDay
    ) {
        return;
    }

    const utcStart = getTimeInUtc(start, isAllDay);
    const utcEnd = getTimeInUtc(end, isAllDay);

    const calendarStart = isAllDay ? utcStart : toUTCDate(convertUTCDateTimeToZone(fromUTCDate(utcStart), tzid));
    const calendarEnd = isAllDay ? utcEnd : toUTCDate(convertUTCDateTimeToZone(fromUTCDate(utcEnd), tzid));
    const isAllPartDay = !isAllDay && differenceInHours(utcEnd, utcStart) >= 24;

    return {
        start: calendarStart,
        end: max(calendarStart, calendarEnd),
        isAllDay: isAllDay || isAllPartDay,
        isAllPartDay
    };
};

export const getCreateTemporaryEvent = (Calendar) => {
    return {
        id: 'tmp',
        data: {
            Calendar
        }
    };
};

export const getEditTemporaryEvent = (targetEvent, model, tzid) => {
    const { id, targetId, data } = targetEvent;
    return {
        id: 'tmp',
        targetId: targetId || id,
        data,
        ...modelToEventProperties({}, model, tzid),
        tmpData: model,
        tmpDataOriginal: model,
        tmpOriginalTarget: targetEvent
    };
};

export const getTemporaryEvent = (temporaryEvent, model, tzid) => {
    const tmpDataOriginal = temporaryEvent.tmpDataOriginal || model;
    return {
        ...temporaryEvent,
        ...modelToEventProperties(temporaryEvent, model, tzid),
        tmpData: model,
        tmpDataOriginal
    };
};

export const getTimeInTimezone = (fakeUtcDate, fromTzid, toTzid) => {
    const trueUtcTime = convertZonedDateTimeToUTC(fromUTCDate(fakeUtcDate), fromTzid);
    return toUTCDate(convertUTCDateTimeToZone(trueUtcTime, toTzid));
};

export const getUpdatedDateTime = (oldModel, { start, end, isAllDay, tzid: fromTzid }) => {
    const tzStart = oldModel.start.tzid;
    const tzEnd = oldModel.end.tzid;

    // If there is a timezone, convert the fake UTC time in the timezone of the calendar to the specified timezone
    const utcStart = tzStart !== fromTzid ? getTimeInTimezone(start, fromTzid, tzStart) : start;
    const utcEnd = tzEnd !== fromTzid ? getTimeInTimezone(end, fromTzid, tzEnd) : end;
    const newStart = getDateTimeState(utcStart, tzStart);
    const newEnd = getDateTimeState(utcEnd, tzEnd);

    return {
        ...oldModel,
        isAllDay,
        start: newStart,
        end: newEnd,
        frequencyModel: getFrequencyModelChange(oldModel.start, newStart, oldModel.frequencyModel)
    };
};
