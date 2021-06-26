import {
    convertUTCDateTimeToZone,
    convertZonedDateTimeToUTC,
    fromUTCDate,
    toUTCDate,
} from '@proton/shared/lib/date/timezone';
import { differenceInHours } from 'date-fns';
import { max } from '@proton/shared/lib/date-fns-utc';
import { Calendar as tsCalendar, EventModel } from '@proton/shared/lib/interfaces/calendar';

import { getTimeInUtc, getDateTimeState } from '../../components/eventModal/eventForm/time';
import getFrequencyModelChange from '../../components/eventModal/eventForm/getFrequencyModelChange';
import { CalendarViewEvent, CalendarViewEventTemporaryEvent } from './interface';

export const getCalendarViewEventProperties = ({ start, end, isAllDay }: EventModel, tzid: string) => {
    const utcStart = getTimeInUtc(start, isAllDay);
    const utcEnd = getTimeInUtc(end, isAllDay);

    const calendarStart = isAllDay ? utcStart : toUTCDate(convertUTCDateTimeToZone(fromUTCDate(utcStart), tzid));
    const calendarEnd = isAllDay ? utcEnd : toUTCDate(convertUTCDateTimeToZone(fromUTCDate(utcEnd), tzid));
    const isAllPartDay = !isAllDay && differenceInHours(utcEnd, utcStart) >= 24;

    return {
        start: calendarStart,
        end: max(calendarStart, calendarEnd),
        isAllDay: isAllDay || isAllPartDay,
        isAllPartDay,
        isRecurring: false,
    };
};

const modelToEventProperties = (
    oldTemporaryEvent: CalendarViewEventTemporaryEvent | undefined,
    model: EventModel,
    tzid: string
) => {
    // If unrelevant things were changed, like title or description
    if (
        oldTemporaryEvent &&
        oldTemporaryEvent.tmpData &&
        oldTemporaryEvent.tmpData.start === model.start &&
        oldTemporaryEvent.tmpData.end === model.end &&
        oldTemporaryEvent.tmpData.isAllDay === model.isAllDay
    ) {
        return;
    }
    return getCalendarViewEventProperties(model, tzid);
};

export const getCreateTemporaryEvent = (
    Calendar: tsCalendar,
    model: EventModel,
    tzid: string
): CalendarViewEventTemporaryEvent => {
    return {
        id: 'tmp',
        data: {
            calendarData: Calendar,
        },
        ...getCalendarViewEventProperties(model, tzid),
        tmpData: model,
        tmpDataOriginal: model,
    };
};

export const getEditTemporaryEvent = (
    targetEvent: CalendarViewEventTemporaryEvent | CalendarViewEvent,
    model: EventModel,
    tzid: string
): CalendarViewEventTemporaryEvent => {
    const { id, data } = targetEvent;
    return {
        id: 'tmp',
        targetId: (targetEvent as CalendarViewEventTemporaryEvent).targetId || id,
        data,
        ...getCalendarViewEventProperties(model, tzid),
        tmpData: model,
        tmpDataOriginal: model,
        tmpOriginalTarget: targetEvent,
    };
};

export const getTemporaryEvent = (
    temporaryEvent: CalendarViewEventTemporaryEvent,
    model: EventModel,
    tzid: string
): CalendarViewEventTemporaryEvent => {
    const tmpDataOriginal = temporaryEvent.tmpDataOriginal || model;

    return {
        ...temporaryEvent,
        ...modelToEventProperties(temporaryEvent, model, tzid),
        tmpData: model,
        tmpDataOriginal,
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
): EventModel => {
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
        frequencyModel: getFrequencyModelChange(oldModel.start, newStart, oldModel.frequencyModel),
    };
};
