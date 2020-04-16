import {
    convertUTCDateTimeToZone,
    convertZonedDateTimeToUTC,
    fromUTCDate,
    toUTCDate
} from 'proton-shared/lib/date/timezone';
import { differenceInHours } from 'date-fns';
import { max } from 'proton-shared/lib/date-fns-utc';
import { getDateTimeState, getTimeInUtc } from '../../components/eventModal/eventForm/time';
import getFrequencyModelChange from '../../components/eventModal/eventForm/getFrequencyModelChange';
import { EventModel } from '../../interfaces/EventModel';
import { Calendar as tsCalendar } from 'proton-shared/lib/interfaces/calendar';

const modelToEventProperties = (oldTemporaryEvent: any, { start, end, isAllDay }: EventModel, tzid: string) => {
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

export const getCreateTemporaryEvent = (Calendar: tsCalendar) => {
    return {
        id: 'tmp',
        data: {
            Calendar
        }
    };
};

export const getEditTemporaryEvent = (targetEvent: any, model: EventModel, tzid: string) => {
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

export const getTemporaryEvent = (temporaryEvent: any, model: EventModel, tzid: string) => {
    const tmpDataOriginal = temporaryEvent.tmpDataOriginal || model;
    return {
        ...temporaryEvent,
        ...modelToEventProperties(temporaryEvent, model, tzid),
        tmpData: model,
        tmpDataOriginal
    };
};

export const getTimeInTimezone = (fakeUtcDate: Date, fromTzid: string, toTzid: string) => {
    const trueUtcTime = convertZonedDateTimeToUTC(fromUTCDate(fakeUtcDate), fromTzid);
    return toUTCDate(convertUTCDateTimeToZone(trueUtcTime, toTzid));
};

interface GetUpdateDateTimeArguments {
    start: Date;
    end: Date;
    isAllDay: boolean;
    tzid: string;
}
export const getUpdatedDateTime = (
    oldModel: EventModel,
    { start, end, isAllDay, tzid: fromTzid }: GetUpdateDateTimeArguments
) => {
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
