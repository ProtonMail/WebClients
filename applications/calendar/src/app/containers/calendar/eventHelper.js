import { propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import {
    convertUTCDateTimeToZone,
    convertZonedDateTimeToUTC,
    fromUTCDate,
    toUTCDate
} from 'proton-shared/lib/date/timezone';
import { differenceInHours } from 'date-fns';
import { modelToDateProperty } from '../../components/eventModal/eventForm/modelToProperties';
import { getDateTimeState } from '../../components/eventModal/eventForm/state';

const modelToEventProperties = (oldTemporaryEvent, { start, end, isAllDay }, tzid) => {
    // If unrelevant things were changed, like title or description
    if (oldTemporaryEvent &&
        oldTemporaryEvent.tmpData && (
            oldTemporaryEvent.tmpData.start === start &&
            oldTemporaryEvent.tmpData.end === end &&
            oldTemporaryEvent.tmpData.isAllDay === isAllDay
        )
    ) {
        return;
    }

    const dtstart = modelToDateProperty({ ...start, isAllDay }, tzid);
    const dtend = modelToDateProperty({ ...end, isAllDay }, tzid);

    const utcStart = propertyToUTCDate(dtstart);
    const utcEnd = propertyToUTCDate(dtend);

    const calendarStart = isAllDay ? utcStart : toUTCDate(convertUTCDateTimeToZone(fromUTCDate(utcStart), tzid));
    const calendarEnd = isAllDay ? utcEnd : toUTCDate(convertUTCDateTimeToZone(fromUTCDate(utcEnd), tzid));
    const isAllPartDay = !isAllDay && differenceInHours(utcEnd, utcStart) >= 24;

    return {
        start: calendarStart,
        end: calendarEnd,
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
    }
};

export const getEditTemporaryEvent = ({ id, targetId, data }, model) => {
    return {
        id: 'tmp',
        targetId: targetId || id,
        data,
        tmpData: model,
        tmpDataOriginal: model
    }
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

    return {
        ...oldModel,
        isAllDay,
        start: getDateTimeState(utcStart, tzStart),
        end: getDateTimeState(utcEnd, tzEnd)
    };
};
