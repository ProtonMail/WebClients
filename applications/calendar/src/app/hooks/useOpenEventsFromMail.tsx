import { Dispatch, RefObject, SetStateAction, useCallback, useEffect } from 'react';

import { c } from 'ttag';

import { useCalendarModelEventManager, useNotifications } from '@proton/components';
import { getDateOrDateTimeProperty, propertyToUTCDate } from '@proton/shared/lib/calendar/vcalConverter';
import { startOfDay } from '@proton/shared/lib/date-fns-utc';
import { fromUTCDateToLocalFakeUTCDate } from '@proton/shared/lib/date/timezone';
import { getIsDrawerPostMessage } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import { Address } from '@proton/shared/lib/interfaces';
import { CalendarEvent, VcalVeventComponent, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { TYPE } from '../components/calendar/interactions/constants';
import { InteractiveState, TimeGridRef } from '../containers/calendar/interface';
import { useOpenEvent } from './useOpenEvent';

interface Props {
    calendars: VisualCalendar[];
    addresses: Address[];
    onChangeDate: (newDate: Date) => void;
    tzid: string;
    timeGridViewRef: RefObject<TimeGridRef>;
    interactiveData?: InteractiveState;
    setInteractiveData: Dispatch<SetStateAction<InteractiveState | undefined>>;
}

export const useOpenEventsFromMail = ({
    calendars,
    addresses,
    onChangeDate,
    tzid,
    timeGridViewRef,
    interactiveData,
    setInteractiveData,
}: Props) => {
    const { call } = useCalendarModelEventManager();
    const { createNotification } = useNotifications();
    const openEvent = useOpenEvent();

    const handleLinkError = () => {
        createNotification({
            type: 'error',
            text: c('Error').t`Invalid link to the event`,
        });
    };

    const goToEvent = useCallback(
        (utcDate: Date, isAllDay: boolean) => {
            const fakeUTCDate = fromUTCDateToLocalFakeUTCDate(utcDate, isAllDay, tzid);

            onChangeDate(startOfDay(fakeUTCDate));
            timeGridViewRef.current?.scrollToTime(fakeUTCDate);
        },
        [tzid]
    );

    const handleGotoOccurrence = useCallback(
        (
            eventData: CalendarEvent,
            eventComponent: VcalVeventComponent,
            occurrence: { localStart: Date; occurrenceNumber: number }
        ) => {
            const withOccurrenceDtstart = getDateOrDateTimeProperty(eventComponent.dtstart, occurrence.localStart);

            const utcDate = propertyToUTCDate(withOccurrenceDtstart);

            setInteractiveData((interactiveData) => ({
                ...interactiveData,
                targetEventData: {
                    id: `${eventData.ID}-${occurrence.occurrenceNumber}`,
                    type: TYPE.TIMEGRID,
                    preventPopover: true,
                },
            }));

            goToEvent(utcDate, !!eventData.FullDay);
        },
        [timeGridViewRef, onChangeDate]
    );

    const handleGoToEvent = useCallback(
        (eventData: CalendarEvent, eventComponent: VcalVeventComponent) => {
            const utcDate = propertyToUTCDate(eventComponent.dtstart);

            setInteractiveData({
                ...interactiveData,
                targetEventData: {
                    id: eventData.ID,
                    type: TYPE.TIMEGRID,
                    preventPopover: true,
                },
            });

            goToEvent(utcDate, !!eventData.FullDay);
        },
        [timeGridViewRef, onChangeDate]
    );

    const handleEvents = useCallback(
        (event: MessageEvent) => {
            if (!getIsDrawerPostMessage(event)) {
                return;
            }

            switch (event.data.type) {
                case DRAWER_EVENTS.CALENDAR_OPEN_EVENT:
                    {
                        const { calendarID, eventID, recurrenceID } = event.data.payload;

                        void openEvent({
                            calendars,
                            addresses,
                            calendarID,
                            eventID,
                            recurrenceId: recurrenceID ? recurrenceID.toString() : null,
                            onGoToEvent: handleGoToEvent,
                            onGoToOccurrence: handleGotoOccurrence,
                            onLinkError: handleLinkError,
                        });
                    }
                    break;
                case DRAWER_EVENTS.CALL_CALENDAR_EVENT_MANAGER:
                    {
                        void call([event.data.payload.calendarID]);
                    }
                    break;
                default:
                    break;
            }
        },
        [calendars, addresses, handleGoToEvent, handleGotoOccurrence]
    );

    useEffect(() => {
        window.addEventListener('message', handleEvents);

        return () => {
            window.removeEventListener('message', handleEvents);
        };
    }, [handleEvents]);
};
