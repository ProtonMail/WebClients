import { differenceInHours, fromUnixTime } from 'date-fns';

import { getDtendProperty, propertyToUTCDate } from '@proton/shared/lib/calendar/vcalConverter';
import { getIsAllDay } from '@proton/shared/lib/calendar/veventHelper';
import { addDays, max } from '@proton/shared/lib/date-fns-utc';
import {
    convertUTCDateTimeToZone,
    convertZonedDateTimeToUTC,
    fromUTCDate,
    fromUTCDateToLocalFakeUTCDate,
    toUTCDate,
} from '@proton/shared/lib/date/timezone';
import type { EventModel, VcalVeventComponent, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import generateUID from '@proton/utils/generateUID';

import getFrequencyModelChange from '../../components/eventModal/eventForm/getFrequencyModelChange';
import { getDateTimeState, getTimeInUtc } from '../../components/eventModal/eventForm/time';
import type { BusySlot } from '../../store/busySlots/busySlotsSlice';
import type { CalendarViewBusyEvent, CalendarViewEvent, CalendarViewEventTemporaryEvent } from './interface';

export const getViewEventDateProperties = (eventComponent: VcalVeventComponent) => {
    const utcStart = propertyToUTCDate(eventComponent.dtstart);
    const unsafeEnd = propertyToUTCDate(getDtendProperty(eventComponent));

    const isAllDay = getIsAllDay(eventComponent);

    const modifiedEnd = isAllDay
        ? addDays(unsafeEnd, -1) // All day event range is non-inclusive
        : unsafeEnd;
    const utcEnd = max(utcStart, modifiedEnd);

    const isAllPartDay = !isAllDay && differenceInHours(utcEnd, utcStart) >= 24;

    return {
        utcStart,
        utcEnd,

        isAllDay,
        isAllPartDay,
    };
};

export const getCalendarViewEventProperties = ({ start, end, isAllDay }: EventModel, tzid: string) => {
    const utcStart = getTimeInUtc(start, isAllDay);
    const utcEnd = getTimeInUtc(end, isAllDay);

    const calendarStart = fromUTCDateToLocalFakeUTCDate(utcStart, isAllDay, tzid);
    const calendarEnd = fromUTCDateToLocalFakeUTCDate(utcEnd, isAllDay, tzid);
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
    Calendar: VisualCalendar,
    model: EventModel,
    tzid: string
): CalendarViewEventTemporaryEvent => {
    return {
        uniqueId: 'tmp',
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
    const { uniqueId, data } = targetEvent;
    return {
        uniqueId: 'tmp',
        targetUniqueId: (targetEvent as CalendarViewEventTemporaryEvent).targetUniqueId || uniqueId,
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

export const getBusyScheduledEvent = (
    email: string,
    timeSlot: BusySlot,
    tzid: string,
    color: string
): CalendarViewBusyEvent => {
    const busySlotStart = fromUnixTime(timeSlot.Start);
    const busySlotEnd = fromUnixTime(timeSlot.End);
    const isAllDay = timeSlot.isAllDay;

    const eventStart = fromUTCDateToLocalFakeUTCDate(busySlotStart, isAllDay, tzid);
    const eventEnd = fromUTCDateToLocalFakeUTCDate(busySlotEnd, isAllDay, tzid);
    const isAllPartDay = !isAllDay && differenceInHours(busySlotEnd, busySlotStart) >= 24;

    const busyEvent: CalendarViewBusyEvent = {
        type: 'busy',
        start: eventStart,
        end: eventEnd,
        isAllDay: isAllPartDay || isAllDay,
        isAllPartDay,
        uniqueId: generateUID('busy-time-slot'),
        color,
        email,
    };

    return busyEvent;
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
