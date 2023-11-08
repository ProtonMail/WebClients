import { Dispatch, SetStateAction, useCallback } from 'react';

import { getDateOrDateTimeProperty, propertyToUTCDate } from '@proton/shared/lib/calendar/vcalConverter';
import { startOfDay } from '@proton/shared/lib/date-fns-utc';
import {
    convertUTCDateTimeToZone,
    fromUTCDate,
    fromUTCDateToLocalFakeUTCDate,
    toUTCDate,
} from '@proton/shared/lib/date/timezone';
import { CalendarEventSharedData, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';

import { getViewEventDateProperties } from '../containers/calendar/eventHelper';
import { EventTargetAction } from '../containers/calendar/interface';
import { generateEventUniqueId } from '../helpers/event';

interface Props {
    onChangeDate: (newDate: Date) => void;
    tzid: string;
    setEventTargetAction: Dispatch<SetStateAction<EventTargetAction | undefined>>;
    preventPopover?: boolean;
}

export const useOpenCalendarEvents = ({ onChangeDate, tzid, setEventTargetAction, preventPopover }: Props) => {
    const navigateToEvent = useCallback(
        (utcDate: Date, isAllDay: boolean) => {
            const fakeUTCDate = fromUTCDateToLocalFakeUTCDate(utcDate, isAllDay, tzid);

            onChangeDate(startOfDay(fakeUTCDate));
        },
        [tzid, setEventTargetAction]
    );

    const goToEvent = useCallback(
        (eventData: CalendarEventSharedData, eventComponent: VcalVeventComponent) => {
            const { utcStart, isAllDay, isAllPartDay } = getViewEventDateProperties(eventComponent);
            const startInTzid = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(utcStart), tzid));

            navigateToEvent(utcStart, isAllDay);
            setEventTargetAction({
                uniqueId: `${generateEventUniqueId(eventData.CalendarID, eventData.ID)}`,
                isAllDay,
                isAllPartDay,
                startInTzid,
                preventPopover,
            });
        },
        [setEventTargetAction, onChangeDate, tzid, navigateToEvent]
    );

    const goToOccurrence = useCallback(
        (
            eventData: CalendarEventSharedData,
            eventComponent: VcalVeventComponent,
            occurrence: { localStart: Date; occurrenceNumber: number }
        ) => {
            const { isAllDay, isAllPartDay } = getViewEventDateProperties(eventComponent);
            const withOccurrenceDtstart = getDateOrDateTimeProperty(eventComponent.dtstart, occurrence.localStart);

            const utcDate = propertyToUTCDate(withOccurrenceDtstart);
            const startInTzid = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(utcDate), tzid));

            navigateToEvent(utcDate, isAllDay);
            setEventTargetAction({
                uniqueId: `${generateEventUniqueId(eventData.CalendarID, eventData.ID)}-${occurrence.occurrenceNumber}`,
                isAllDay,
                isAllPartDay,
                startInTzid,
                preventPopover,
            });
        },
        [setEventTargetAction, onChangeDate, navigateToEvent]
    );

    return { goToEvent, goToOccurrence };
};

export default useOpenCalendarEvents;
